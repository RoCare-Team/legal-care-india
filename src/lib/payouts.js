import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import Consultation from '@/models/Consultation';
import Payout from '@/models/Payout';
import { seal, open } from '@/lib/secretBox';
import {
  COMMISSION_RATE, COMMISSION_LABEL, MIN_PAYOUT, MAX_BANK_ACCOUNTS,
  IFSC_PATTERN, ACCOUNT_NUMBER_PATTERN, PAN_PATTERN, round2, formatMoney,
} from '@/constants/payouts';

/**
 * A lawyer's earnings after commission, their bank accounts, and payouts.
 *
 * Money moves in three places, each in a single conditional update so two
 * requests racing each other cannot move it twice:
 *
 *   settlement      credits the lawyer's share (lib/consultations)
 *   payout request  debits the wallet and marks the one open payout
 *   cancel/reject   credits it back and clears the open payout
 *
 * Every movement is also a line in `walletTransactions`, the ledger the lawyer
 * reads, so a balance never changes without saying why.
 */

function httpError(message, status = 400, code = '') {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  return e;
}

// ── Commission on balances from before commission ───────────────────────────

/**
 * Takes JusticeLand's commission, once, from whatever a lawyer had in their
 * wallet before commission was introduced — those credits were the full amount
 * the client paid.
 *
 * Runs the first time anything touches the wallet (a settlement, a visit to
 * the earnings page, a payout request), so there is no migration to remember
 * and no lawyer is missed. The update is conditional on the flag still being
 * unset and the balance being the one just read, so it happens exactly once and
 * never against a balance that moved in between.
 *
 * @param {string} advocateId
 */
export async function applyLegacyCommission(advocateId) {
  await connectDB();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const adv = await Advocate.findOne({ _id: advocateId, commissionAppliedAt: null })
      .select('walletBalance')
      .lean();
    if (!adv) return; // already applied (or no such lawyer)

    const balance = round2(adv.walletBalance);
    const cut = round2(balance * COMMISSION_RATE);
    const update = { $set: { commissionAppliedAt: new Date() } };
    if (cut > 0) {
      update.$inc = { walletBalance: -cut };
      update.$push = {
        walletTransactions: {
          type: 'debit',
          kind: 'commission_adjustment',
          amount: cut,
          gross: balance,
          commission: cut,
          note: `JusticeLand commission (${COMMISSION_LABEL}) on earlier earnings of ${formatMoney(balance)}`,
        },
      };
    }

    const res = await Advocate.updateOne(
      { _id: advocateId, commissionAppliedAt: null, walletBalance: adv.walletBalance },
      update
    );
    if (res.modifiedCount) return;
    // The balance moved between the read and the write — read it again.
  }
}

// ── Bank accounts ────────────────────────────────────────────────────────────

/** What a lawyer's browser is allowed to see of an account. */
function publicAccount(a) {
  return {
    id: String(a._id),
    holderName: a.holderName,
    bankName: a.bankName || '',
    ifsc: a.ifsc,
    accountType: a.accountType || 'savings',
    accountLast4: a.accountLast4,
    panLast4: a.panLast4 || '',
    isPrimary: Boolean(a.isPrimary),
    createdAt: a.createdAt || null,
  };
}

/**
 * Validates and adds a bank account. The first one becomes primary.
 *
 * @param {string} advocateId
 * @param {{holderName:string, accountNumber:string, ifsc:string, bankName?:string, accountType?:string, pan?:string}} input
 */
export async function addBankAccount(advocateId, input) {
  const holderName = String(input?.holderName || '').trim().replace(/\s+/g, ' ');
  const accountNumber = String(input?.accountNumber || '').replace(/\s+/g, '');
  const ifsc = String(input?.ifsc || '').trim().toUpperCase();
  const bankName = String(input?.bankName || '').trim().slice(0, 80);
  const accountType = input?.accountType === 'current' ? 'current' : 'savings';
  const pan = String(input?.pan || '').replace(/\s+/g, '').toUpperCase();

  if (holderName.length < 3 || holderName.length > 100) {
    throw httpError('Enter the account holder’s name exactly as the bank has it.');
  }
  if (!ACCOUNT_NUMBER_PATTERN.test(accountNumber)) {
    throw httpError('Account number should be 9 to 18 digits.');
  }
  if (!IFSC_PATTERN.test(ifsc)) {
    throw httpError('That IFSC does not look right — it is 11 characters, like HDFC0001234.');
  }
  // Optional, but never stored half-right: a PAN that is present must be valid.
  if (pan && !PAN_PATTERN.test(pan)) {
    throw httpError('That PAN does not look right — it is 10 characters, like ABCDE1234F.');
  }

  await connectDB();
  const adv = await Advocate.findById(advocateId).select('bankAccounts').lean();
  if (!adv) throw httpError('Account not found.', 404);
  const existing = adv.bankAccounts || [];
  if (existing.length >= MAX_BANK_ACCOUNTS) {
    throw httpError(`You can keep up to ${MAX_BANK_ACCOUNTS} bank accounts. Remove one to add another.`);
  }
  const last4 = accountNumber.slice(-4);
  if (existing.some((a) => a.ifsc === ifsc && a.accountLast4 === last4 && open(a.accountNumberEnc) === accountNumber)) {
    throw httpError('This bank account is already added.', 409);
  }

  const account = {
    _id: new mongoose.Types.ObjectId(),
    holderName,
    bankName,
    ifsc,
    accountType,
    accountLast4: last4,
    accountNumberEnc: seal(accountNumber),
    ...(pan ? { panEnc: seal(pan), panLast4: pan.slice(-4) } : {}),
    isPrimary: existing.length === 0,
    createdAt: new Date(),
  };

  // Conditional on the count, so two adds at once cannot pass the limit.
  const res = await Advocate.updateOne(
    { _id: advocateId, [`bankAccounts.${MAX_BANK_ACCOUNTS - 1}`]: { $exists: false } },
    { $push: { bankAccounts: account } }
  );
  if (!res.modifiedCount) {
    throw httpError(`You can keep up to ${MAX_BANK_ACCOUNTS} bank accounts.`);
  }
  return publicAccount(account);
}

export async function setPrimaryBankAccount(advocateId, accountId) {
  await connectDB();
  if (!mongoose.isValidObjectId(accountId)) throw httpError('Account not found.', 404);
  const adv = await Advocate.findOne({ _id: advocateId, 'bankAccounts._id': accountId }).select('_id').lean();
  if (!adv) throw httpError('Account not found.', 404);
  await Advocate.updateOne(
    { _id: advocateId },
    { $set: { 'bankAccounts.$[a].isPrimary': true, 'bankAccounts.$[b].isPrimary': false } },
    {
      arrayFilters: [
        { 'a._id': new mongoose.Types.ObjectId(String(accountId)) },
        { 'b._id': { $ne: new mongoose.Types.ObjectId(String(accountId)) } },
      ],
    }
  );
}

export async function removeBankAccount(advocateId, accountId) {
  await connectDB();
  if (!mongoose.isValidObjectId(accountId)) throw httpError('Account not found.', 404);
  const adv = await Advocate.findById(advocateId).select('bankAccounts').lean();
  const target = (adv?.bankAccounts || []).find((a) => String(a._id) === String(accountId));
  if (!target) throw httpError('Account not found.', 404);

  await Advocate.updateOne({ _id: advocateId }, { $pull: { bankAccounts: { _id: target._id } } });

  // Removing the primary hands the role to the oldest remaining account, so a
  // lawyer with accounts always has somewhere a payout defaults to.
  if (target.isPrimary) {
    const next = (adv.bankAccounts || []).find((a) => String(a._id) !== String(accountId));
    if (next) {
      await Advocate.updateOne(
        { _id: advocateId, 'bankAccounts._id': next._id },
        { $set: { 'bankAccounts.$.isPrimary': true } }
      );
    }
  }
}

// ── Payouts ──────────────────────────────────────────────────────────────────

function publicPayout(p) {
  return {
    id: String(p._id),
    amount: round2(p.amount),
    status: p.status,
    bank: {
      holderName: p.bank?.holderName || '',
      bankName: p.bank?.bankName || '',
      ifsc: p.bank?.ifsc || '',
      accountLast4: p.bank?.accountLast4 || '',
    },
    utr: p.utr || '',
    adminNote: p.adminNote || '',
    createdAt: p.createdAt || null,
    processedAt: p.processedAt || null,
  };
}

/**
 * Takes the amount out of the wallet and opens a payout for an admin to send.
 *
 * @param {string} advocateId
 * @param {{amount:number, bankAccountId:string}} input
 */
export async function requestPayout(advocateId, input) {
  await applyLegacyCommission(advocateId);

  const amount = round2(input?.amount);
  if (!Number.isFinite(amount) || amount < MIN_PAYOUT) {
    throw httpError(`The smallest payout is ${formatMoney(MIN_PAYOUT)}.`);
  }

  await connectDB();
  const adv = await Advocate.findById(advocateId)
    .select('name legalCareId walletBalance openPayoutId bankAccounts')
    .lean();
  if (!adv) throw httpError('Account not found.', 404);
  if (adv.openPayoutId) {
    throw httpError('You already have a payout being processed. Wait for it, or cancel it first.', 409, 'open');
  }
  const account = (adv.bankAccounts || []).find((a) => String(a._id) === String(input?.bankAccountId));
  if (!account) throw httpError('Choose a bank account to send the payout to.');
  if (amount > round2(adv.walletBalance)) {
    throw httpError(`You can withdraw up to ${formatMoney(adv.walletBalance)}.`, 400, 'insufficient');
  }

  const payoutId = new mongoose.Types.ObjectId();
  const where = `${account.bankName || 'Bank'} ••${account.accountLast4}`;

  // The debit and the open-payout mark are one write, conditional on the money
  // being there and nothing else being open — so this cannot overdraw or
  // stack up two requests, however fast they arrive.
  const debited = await Advocate.updateOne(
    { _id: advocateId, openPayoutId: null, walletBalance: { $gte: amount } },
    {
      $inc: { walletBalance: -amount },
      $set: { openPayoutId: payoutId },
      $push: {
        walletTransactions: {
          type: 'debit',
          kind: 'payout',
          amount,
          payoutId,
          note: `Payout requested to ${where}`,
        },
      },
    }
  );
  if (!debited.modifiedCount) {
    throw httpError('Your balance changed, or a payout is already open. Refresh and try again.', 409);
  }

  try {
    const payout = await Payout.create({
      _id: payoutId,
      advocateId,
      advocateName: adv.name || '',
      legalCareId: adv.legalCareId || '',
      amount,
      bank: {
        holderName: account.holderName,
        bankName: account.bankName,
        ifsc: account.ifsc,
        accountType: account.accountType,
        accountLast4: account.accountLast4,
        accountNumberEnc: account.accountNumberEnc,
        panEnc: account.panEnc || '',
      },
    });
    return publicPayout(payout.toObject());
  } catch (err) {
    // The request could not be recorded — give the money straight back.
    await Advocate.updateOne(
      { _id: advocateId, openPayoutId: payoutId },
      {
        $inc: { walletBalance: amount },
        $set: { openPayoutId: null },
        $push: {
          walletTransactions: { type: 'credit', kind: 'payout_refund', amount, payoutId, note: 'Payout request failed — refunded' },
        },
      }
    );
    throw err;
  }
}

/**
 * Closes an open payout without paying it and returns the amount to the
 * wallet. Shared by the lawyer's cancel and the admin's reject.
 */
async function closeWithRefund(filter, status, { note, adminNote = '', processedBy = '' }) {
  await connectDB();
  const payout = await Payout.findOneAndUpdate(
    { ...filter, status: 'requested' },
    { $set: { status, adminNote, processedBy, processedAt: new Date() } },
    { new: true }
  ).lean();
  if (!payout) throw httpError('This payout is no longer open.', 409);

  await Advocate.updateOne(
    { _id: payout.advocateId },
    {
      $inc: { walletBalance: payout.amount },
      $set: { openPayoutId: null },
      $push: {
        walletTransactions: {
          type: 'credit',
          kind: 'payout_refund',
          amount: payout.amount,
          payoutId: payout._id,
          note,
        },
      },
    }
  );
  return payout;
}

export async function cancelPayout(advocateId, payoutId) {
  if (!mongoose.isValidObjectId(payoutId)) throw httpError('Payout not found.', 404);
  const payout = await closeWithRefund(
    { _id: payoutId, advocateId },
    'cancelled',
    { note: 'Payout cancelled — returned to your balance' }
  );
  return publicPayout(payout);
}

// ── What the earnings and payouts pages read ─────────────────────────────────

/**
 * Everything the lawyer's earnings and payouts pages show.
 *
 * Lifetime figures come from the consultations themselves, so they include
 * sessions from before commission existed — those are shown at today's rate,
 * which is also what their balance was adjusted by.
 */
export async function getLawyerPayoutData(advocateId) {
  await applyLegacyCommission(advocateId);
  await connectDB();

  const id = new mongoose.Types.ObjectId(String(advocateId));
  const [adv, totals, payouts] = await Promise.all([
    Advocate.findById(id).select('walletBalance walletTransactions bankAccounts openPayoutId').lean(),
    Consultation.aggregate([
      { $match: { advocateId: id, settled: true, price: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          gross: { $sum: '$price' },
          commission: {
            $sum: { $ifNull: ['$commission', { $multiply: ['$price', COMMISSION_RATE] }] },
          },
          sessions: { $sum: 1 },
        },
      },
    ]),
    Payout.find({ advocateId: id }).sort({ createdAt: -1 }).limit(100).lean(),
  ]);

  const t = totals[0] || { gross: 0, commission: 0, sessions: 0 };
  const gross = round2(t.gross);
  const commission = round2(t.commission);
  const paidOut = round2(payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0));
  const processing = round2(payouts.filter((p) => p.status === 'requested').reduce((s, p) => s + p.amount, 0));

  const transactions = [...(adv?.walletTransactions || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((tx) => ({
      id: String(tx._id),
      type: tx.type,
      kind: tx.kind || (tx.type === 'credit' ? 'earning' : ''),
      amount: round2(tx.amount),
      gross: round2(tx.gross),
      commission: round2(tx.commission),
      note: tx.note || '',
      createdAt: tx.createdAt || null,
    }));

  const accounts = (adv?.bankAccounts || [])
    .map(publicAccount)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

  return {
    commissionRate: COMMISSION_RATE,
    minPayout: MIN_PAYOUT,
    maxBankAccounts: MAX_BANK_ACCOUNTS,
    balance: round2(adv?.walletBalance),
    summary: {
      sessions: t.sessions,
      gross,
      commission,
      earning: round2(gross - commission),
      paidOut,
      processing,
    },
    openPayoutId: adv?.openPayoutId ? String(adv.openPayoutId) : null,
    payouts: payouts.map(publicPayout),
    bankAccounts: accounts,
    transactions,
  };
}

// ── Admin ────────────────────────────────────────────────────────────────────

/** Payouts for the admin panel, with the full account number opened. */
export async function adminListPayouts({ status } = {}) {
  await connectDB();
  const filter = status && status !== 'all' ? { status } : {};
  const [rows, groups] = await Promise.all([
    Payout.find(filter).sort({ createdAt: -1 }).limit(300).lean(),
    Payout.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
    ]),
  ]);
  const stats = Object.fromEntries(groups.map((g) => [g._id, { count: g.count, amount: round2(g.amount) }]));
  return {
    stats,
    payouts: rows.map((p) => ({
      ...publicPayout(p),
      advocateId: String(p.advocateId),
      advocateName: p.advocateName,
      legalCareId: p.legalCareId,
      bank: {
        ...publicPayout(p).bank,
        accountType: p.bank?.accountType || 'savings',
        accountNumber: open(p.bank?.accountNumberEnc) || '',
        pan: open(p.bank?.panEnc) || '',
      },
      processedBy: p.processedBy || '',
    })),
  };
}

export async function adminMarkPaid(payoutId, { utr, note = '', adminEmail = '' }) {
  if (!mongoose.isValidObjectId(payoutId)) throw httpError('Payout not found.', 404);
  const reference = String(utr || '').trim();
  if (reference.length < 6) throw httpError('Enter the bank transfer reference (UTR).');

  await connectDB();
  const payout = await Payout.findOneAndUpdate(
    { _id: payoutId, status: 'requested' },
    {
      $set: {
        status: 'paid',
        utr: reference.slice(0, 40),
        adminNote: String(note || '').trim().slice(0, 300),
        processedBy: adminEmail,
        processedAt: new Date(),
      },
    },
    { new: true }
  ).lean();
  if (!payout) throw httpError('This payout is no longer open.', 409);

  await Advocate.updateOne(
    { _id: payout.advocateId, openPayoutId: payout._id },
    { $set: { openPayoutId: null } }
  );
  return payout;
}

export async function adminRejectPayout(payoutId, { reason, adminEmail = '' }) {
  if (!mongoose.isValidObjectId(payoutId)) throw httpError('Payout not found.', 404);
  const why = String(reason || '').trim().slice(0, 300);
  if (!why) throw httpError('Say why it is being rejected — the lawyer sees this.');
  return closeWithRefund({ _id: payoutId }, 'rejected', {
    note: `Payout rejected — returned to your balance (${why})`,
    adminNote: why,
    processedBy: adminEmail,
  });
}
