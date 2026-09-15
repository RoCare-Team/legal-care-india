/**
 * Pure helpers that turn a lawyer's consultation history into the numbers the
 * dashboard overview shows — today's earnings, the week's bars, and so on.
 *
 * Days are Indian days. The server runs in UTC, and "today" counted from UTC
 * midnight would move every session booked before 5:30 am into yesterday.
 */

const IST = 'Asia/Kolkata';
const DAY_MS = 24 * 60 * 60 * 1000;

const dayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST, year: 'numeric', month: '2-digit', day: '2-digit',
});
const weekdayFmt = new Intl.DateTimeFormat('en-IN', { timeZone: IST, weekday: 'short' });
const dayMonthFmt = new Intl.DateTimeFormat('en-US', { timeZone: IST, day: 'numeric', month: 'short' });
/** "12 Sep" — built from parts, since en-IN spells the month "Sept". */
const dateFmt = {
  format(date) {
    const parts = Object.fromEntries(dayMonthFmt.formatToParts(date).map((p) => [p.type, p.value]));
    return `${parts.day} ${parts.month}`;
  },
};
const timeFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST, hour: 'numeric', minute: '2-digit', hour12: true,
});
const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: IST, hour: 'numeric', hour12: false });

/** "2026-09-14" — the IST calendar day a moment falls on. */
export function istDayKey(value) {
  return dayFmt.format(new Date(value));
}

/** "10:30 am" → "10:30 AM" in IST. */
export function istTime(value) {
  return timeFmt.format(new Date(value)).toUpperCase();
}

/** "14 Sep, 10:30 AM" in IST. */
export function istDateTime(value) {
  return `${dateFmt.format(new Date(value))}, ${istTime(value)}`;
}

/** "Good Morning" / "Good Afternoon" / "Good Evening" for the IST hour. */
export function istGreeting(now = new Date()) {
  const hour = Number(hourFmt.format(now));
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * "10:30 AM" for today, "Yesterday", else "12 Sep" — how a conversation list
 * dates its rows.
 */
export function istRelativeLabel(value, now = new Date()) {
  const key = istDayKey(value);
  if (key === istDayKey(now)) return istTime(value);
  if (key === istDayKey(now.getTime() - DAY_MS)) return 'Yesterday';
  return dateFmt.format(new Date(value));
}

/** When a session counts as having happened: the clock start, else the booking. */
const whenOf = (c) => c.startedAt || c.createdAt;

/** Earned, sessions and minutes over the paid rows whose day is in `keys`. */
function totals(paid, keys) {
  const rows = paid.filter((c) => keys.has(istDayKey(whenOf(c))));
  return {
    earned: rows.reduce((sum, c) => sum + (c.price || 0), 0),
    sessions: rows.length,
    minutes: rows.reduce((sum, c) => sum + (c.talkedMinutes || 0), 0),
  };
}

/** The IST day keys for `count` days ending `offset` days before today. */
function dayKeys(now, count, offset = 0) {
  const keys = new Set();
  for (let i = 0; i < count; i += 1) keys.add(istDayKey(now.getTime() - (offset + i) * DAY_MS));
  return keys;
}

/**
 * Everything the overview needs from the history.
 *
 * @param {Array} consultations  visible history rows (toHistoryRow shape)
 * @param {Date} [now]
 */
export function buildOverview(consultations, now = new Date()) {
  const paid = consultations.filter((c) => c.charged);
  const todayKey = istDayKey(now);

  const period = (label, compareLabel, noCompare, count) => {
    const current = totals(paid, dayKeys(now, count));
    const previous = totals(paid, dayKeys(now, count, count));
    return { label, compareLabel, noCompare, ...current, previousEarned: previous.earned };
  };

  const periods = {
    today: period('Today', 'yesterday', 'No earnings yesterday to compare', 1),
    week: period('Last 7 days', 'the previous 7 days', 'No earnings in the previous 7 days', 7),
    month: period('Last 30 days', 'the previous 30 days', 'No earnings in the previous 30 days', 30),
  };

  // Oldest on the left, today on the right.
  const week = [];
  for (let i = 6; i >= 0; i -= 1) {
    const at = now.getTime() - i * DAY_MS;
    const key = istDayKey(at);
    week.push({
      key,
      weekday: weekdayFmt.format(new Date(at)),
      date: dateFmt.format(new Date(at)),
      amount: totals(paid, new Set([key])).earned,
      isToday: key === todayKey,
    });
  }

  const today = consultations
    .filter((c) => istDayKey(whenOf(c)) === todayKey)
    .sort((a, b) => new Date(whenOf(a)) - new Date(whenOf(b)));

  return {
    periods,
    week,
    today,
    totalSessions: paid.length,
    sessionsToday: periods.today.sessions,
  };
}

/** Whole-percent change, or null when there is nothing to compare against. */
export function percentChange(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * One row per client: every session with them folded together, newest client
 * first — what the Messages page lists.
 *
 * @param {Array} consultations  visible history rows, newest first
 */
export function clientThreads(consultations) {
  const byClient = new Map();
  for (const c of consultations) {
    let t = byClient.get(c.userId);
    if (!t) {
      // Rows arrive newest first, so the first one seen is the latest.
      t = {
        userId: c.userId,
        userName: c.userName,
        latest: c,
        threadId: null,
        sessions: 0,
        messages: 0,
        earned: 0,
        minutes: 0,
        types: new Set(),
        lastMessage: null,
      };
      byClient.set(c.userId, t);
    }
    t.sessions += 1;
    t.messages += c.messagesCount || 0;
    t.earned += c.charged ? c.price || 0 : 0;
    t.minutes += c.talkedMinutes || 0;
    t.types.add(c.type || 'chat');
    if (!t.lastMessage && c.lastMessage) t.lastMessage = c.lastMessage;
    // Any session of the pair opens the whole transcript; pick one that has lines.
    if (!t.threadId && c.messagesCount > 0) t.threadId = c.id;
  }
  return [...byClient.values()].map((t) => ({ ...t, types: [...t.types] }));
}

/** Earned, sessions and minutes per channel over paid sessions. */
export function channelTotals(consultations) {
  const out = {
    chat: { earned: 0, sessions: 0, minutes: 0 },
    audio: { earned: 0, sessions: 0, minutes: 0 },
    video: { earned: 0, sessions: 0, minutes: 0 },
  };
  for (const c of consultations) {
    if (!c.charged) continue;
    const row = out[c.type] || out.chat;
    row.earned += c.price || 0;
    row.sessions += 1;
    row.minutes += c.talkedMinutes || 0;
  }
  return out;
}

/** The latest session with each client, newest first. */
export function latestPerClient(consultations, limit = 5) {
  const seen = new Set();
  const out = [];
  for (const c of consultations) {
    if (seen.has(c.userId)) continue;
    seen.add(c.userId);
    out.push(c);
    if (out.length === limit) break;
  }
  return out;
}
