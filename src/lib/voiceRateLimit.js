import { connectDB } from '@/lib/db';
import VoiceSearchUsage from '@/models/VoiceSearchUsage';
import { RATE_LIMIT } from '@/constants/voiceSearch';

/**
 * How often one caller may run a voice search.
 *
 * Signed-in visitors get a larger allowance than anonymous ones, because an
 * account is a thing we can act on if it is abused and an IP shared by a whole
 * office is not. The window is a simple fixed hour rather than a rolling one:
 * the point is to cap what a single caller can spend of ours, and an hour that
 * resets on the hour does that with one atomic update.
 *
 * A database that is briefly unreachable must not take the feature down with
 * it, so a failed check allows the request. The audio limits and the short
 * model prompt are the other half of the cost control, and they hold whatever
 * the database is doing.
 */
export async function checkVoiceRateLimit({ userId = '', ip = '' } = {}) {
  const key = userId ? `user:${userId}` : `ip:${ip || 'unknown'}`;
  const allowance = userId ? RATE_LIMIT.signedIn : RATE_LIMIT.signedOut;
  const now = Date.now();

  try {
    await connectDB();
    const existing = await VoiceSearchUsage.findOne({ key }).lean();
    const fresh = !existing
      || now - new Date(existing.windowStartedAt).getTime() > RATE_LIMIT.windowMs;

    if (fresh) {
      await VoiceSearchUsage.updateOne(
        { key },
        { $set: { key, windowStartedAt: new Date(now), count: 1, lastAt: new Date(now) } },
        { upsert: true }
      );
      return { ok: true, remaining: allowance - 1 };
    }

    if ((existing.count || 0) >= allowance) {
      const retryAfterMs = RATE_LIMIT.windowMs - (now - new Date(existing.windowStartedAt).getTime());
      return {
        ok: false,
        remaining: 0,
        retryAfterSeconds: Math.max(60, Math.ceil(retryAfterMs / 1000)),
      };
    }

    await VoiceSearchUsage.updateOne(
      { key },
      { $inc: { count: 1 }, $set: { lastAt: new Date(now) } }
    );
    return { ok: true, remaining: allowance - (existing.count || 0) - 1 };
  } catch (err) {
    console.warn('[voice] rate limit unavailable, allowing the request', err?.message || err);
    return { ok: true, remaining: allowance };
  }
}
