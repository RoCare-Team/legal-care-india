/**
 * The AI-generated profile-photo avatar: one constant, read by the route that
 * spends a try and by the snapshot that shows how many are left, so the two
 * can never disagree about the cap.
 *
 * Each generation is a real OpenAI image call — a paid plan feature, and
 * capped low because it costs money per press, not because the design allows
 * for more.
 */
export const MAX_AI_AVATARS = 2;
