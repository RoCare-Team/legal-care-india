import mongoose from 'mongoose';

const { Schema } = mongoose;

/** A single chat message within a consultation session. */
const MessageSchema = new Schema(
  {
    from: { type: String, enum: ['user', 'advocate'], required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

/**
 * Call — the WebRTC video-call leg of a consultation.
 *
 * The two browsers stream to each other directly (peer-to-peer); this
 * sub-document is only the *signalling* channel they use to find one another.
 * Each side writes its SDP (`offer`/`answer`) and ICE candidates here and
 * polls for the other's. Once connected, no audio or video passes through us.
 *
 * Only the client may ring; the lawyer accepts or rejects — the same direction
 * as the booking itself. `id` is regenerated per attempt so both sides can tell
 * a fresh ring apart from the leftovers of the previous one.
 *
 * Lifecycle:  idle → ringing → active → ended
 */
const CallSchema = new Schema(
  {
    id: { type: String, default: '' },
    status: {
      type: String,
      enum: ['idle', 'ringing', 'active', 'ended'],
      default: 'idle',
    },
    // 'rejected' | 'hangup' | 'unanswered' | 'session-ended' | 'failed'
    endedReason: { type: String, default: '' },
    // Who hung up, for the wording the other side sees.
    endedBy: { type: String, enum: ['user', 'advocate', ''], default: '' },

    // Signalling payloads (stringified RTCSessionDescription / RTCIceCandidate).
    offer: { type: String, default: '' },
    answer: { type: String, default: '' },
    userCandidates: { type: [String], default: [] },
    advocateCandidates: { type: [String], default: [] },

    ringingAt: { type: Date, default: null },
    connectedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { _id: false }
);

/**
 * Recording — one call attempt's audio, mixed client-side (both parties'
 * mics via the Web Audio API) and uploaded once the call ends.
 *
 * Kept as its own array on the consultation rather than nested in `CallSchema`
 * above, because `call` is wiped and re-stamped with a fresh `id` on every new
 * call attempt within the same session (a reconnect) — a recording tied to a
 * finished attempt would otherwise vanish the moment the next one starts.
 */
const RecordingSchema = new Schema(
  {
    callId: { type: String, default: '' },
    // Where the audio sits on disk — and empty for every recording made since
    // they moved into the database (see lib/callRecordings and the
    // CallRecordingPart model), which is all of them now.
    //
    // This must not be `required`. Mongoose counts an empty string as missing,
    // and the uploads write it empty through `updateOne`, which runs no
    // validators — so the write succeeded and then every later `save()` of the
    // consultation threw "Path `path` is required". That is one line in a
    // sub-schema and it broke everything that finishes a session: ending it
    // from either app, the lazy settle on a poll, and the admin panel's End
    // button all failed with a 500, which is why a call with a recording on it
    // could run for hours and refuse to stop.
    path: { type: String, default: '' },
    mimeType: { type: String, default: 'audio/webm' },
    size: { type: Number, default: 0 },
    // Who uploaded it. A web recording is both voices whoever sent it; a phone
    // app recording is one channel of the uploader's device, so admin needs to
    // know whose device it came from.
    by: { type: String, enum: ['user', 'advocate', ''], default: '' },
    // A browser streams its recording up in parts while the call runs, so a
    // hang-up race or a closed tab loses seconds rather than the whole call.
    // This is how many one-second chunks have been stored so far, which is what
    // the next part has to line up with.
    chunks: { type: Number, default: 0 },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

/**
 * Discount — an admin's instruction to charge this session less than it ran up.
 *
 * Left on the session while it is still going, and read once by
 * `settleCharges` when the money moves; see constants/discounts for who pays
 * for it. `off` and `fromAdvocate` are written at that moment, so a settled
 * session records what the discount actually came to rather than only what was
 * asked for — a percentage means nothing once the session it applied to is
 * over.
 */
const DiscountSchema = new Schema(
  {
    kind: { type: String, enum: ['percent', 'flat'], required: true },
    value: { type: Number, required: true, min: 0 },
    note: { type: String, default: '', maxlength: 200 },
    // The admin who granted it, and when. This is the whole audit trail for a
    // discount, so it is never optional in practice.
    by: { type: String, default: '' },
    at: { type: Date, default: Date.now },
    // Filled in at settlement: ₹ taken off the bill, and how much of that the
    // lawyer funded once our commission ran out.
    off: { type: Number, default: null },
    fromAdvocate: { type: Number, default: null },
  },
  { _id: false }
);

/**
 * Consultation — a live session a user books with a lawyer, billed by the
 * minute.
 *
 * Nothing is charged up front. The lawyer's per-minute `rate` is snapshotted
 * when the session is created (so a rate change mid-call can't move the
 * price), the clock starts when they accept, and the wallet transfer happens
 * once — at the end, for the minutes actually used.
 *
 * `maxMinutes` is the ceiling the user's wallet could afford at booking time.
 * It is what `endsAt` is built from, so a session cuts off rather than running
 * up a bill nobody can pay.
 *
 * Lifecycle:
 *   pending   → user booked, waiting for the lawyer to accept (no charge)
 *   active    → lawyer accepted; clock running until `endsAt`
 *   ended     → hung up or ran out of affordable time; wallet settled here
 *   rejected  → lawyer declined (no charge)
 *   cancelled → user backed out while still pending (no charge)
 */
const ConsultationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, default: '' },
    advocateId: { type: Schema.Types.ObjectId, ref: 'Advocate', required: true, index: true },
    advocateName: { type: String, default: '' },

    // Which kind of session: a text live-chat, a video call, or an audio-only
    // call — each priced from the lawyer's own separate plan list. Video and
    // audio both ride on the `call` sub-document below; `type` only changes
    // pricing and which UI opens (audio just never asks for the camera).
    type: { type: String, enum: ['chat', 'video', 'audio'], default: 'chat' },

    // ₹ per minute, copied from the lawyer's profile when the session is
    // created. The session bills at this rate for its whole life even if the
    // lawyer edits their profile halfway through.
    rate: { type: Number, default: 0, min: 0 },
    // The most minutes the user's wallet could cover at that rate when they
    // booked — the hard cap `endsAt` is derived from.
    maxMinutes: { type: Number, default: 0, min: 0 },

    // What was actually billed. Both stay 0 until the session ends and
    // `settleCharges` runs; `settled` makes that transfer exactly-once, since
    // a session can be finalised by either party hanging up or by expiring on
    // a poll, and those can race.
    minutes: { type: Number, default: 0 },
    price: { type: Number, default: 0, min: 0 },
    settled: { type: Boolean, default: false },

    // An admin's discount on this session, applied when it settles (null for
    // the overwhelming majority of sessions, which are charged in full).
    discount: { type: DiscountSchema, default: null },

    // How `price` was split when it settled: JusticeLand's commission and the
    // lawyer's share credited to their wallet. Absent on sessions settled
    // before commission existed — readers work those out at the current rate.
    commissionRate: { type: Number, default: null },
    commission: { type: Number, default: null },
    advocateEarning: { type: Number, default: null },

    status: {
      type: String,
      enum: ['pending', 'active', 'ended', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },

    messages: { type: [MessageSchema], default: [] },

    // Video-call signalling for this session (see CallSchema above).
    call: { type: CallSchema, default: () => ({}) },

    // Audio recordings of this session's call attempts (see RecordingSchema).
    recordings: { type: [RecordingSchema], default: [] },

    // Set when an admin ended or cancelled the session from the panel rather
    // than either participant hanging up: their email, so the record says who.
    endedByAdmin: { type: String, default: '' },

    startedAt: { type: Date, default: null }, // when the lawyer accepted
    endsAt: { type: Date, default: null },    // startedAt + minutes (planned end)

    // An audio or video session is billed from the moment the call's media is
    // actually up, not from the lawyer's tap on Accept — the seconds spent
    // ringing and connecting are nobody's fault and nobody's bill. The first
    // time either side reports "connected" (see markCallConnected) the clock
    // moves to that moment, once, and this marks it done.
    callClockStarted: { type: Boolean, default: false },
    endedAt: { type: Date, default: null },   // when it actually ended

    // Free "resume" of leftover time. When a session ends early, the unused
    // minutes can be reconnected once, free, within 24h. `resumedFromId` points
    // a free resume back at the paid session it drew from; `resumed` marks that
    // paid session's leftover as spent so it can't be claimed twice.
    resumedFromId: { type: Schema.Types.ObjectId, ref: 'Consultation', default: null },
    resumed: { type: Boolean, default: false },

    // Either side can clear the row from their own list. The record itself
    // stays, so hiding it on one side never affects the other.
    hiddenForAdvocate: { type: Boolean, default: false },
    hiddenForUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Consultation ||
  mongoose.model('Consultation', ConsultationSchema);
