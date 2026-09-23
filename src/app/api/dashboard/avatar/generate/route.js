import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { getSessionAdvocateId } from '@/lib/auth';
import { activePlan } from '@/constants/membershipPlans';
import { MAX_AI_AVATARS } from '@/constants/avatarAi';

export const dynamic = 'force-dynamic';

const MODEL = process.env.OPENAI_AVATAR_MODEL || 'gpt-image-1';

/**
 * POST /api/dashboard/avatar/generate
 *
 * Generates a profile-photo avatar with AI and returns it as a data URL — the
 * lawyer still has to press Save for it to actually become their photo, the
 * same as an uploaded one. Nothing is written to the profile here.
 *
 * Two things gate this, both server-side because the form is a page anyone
 * can edit: the lawyer's plan (Professional and Premium only — Starter gets
 * an upgrade prompt), and MAX_AI_AVATARS tries per lawyer, ever, because each
 * one is a real OpenAI image call that costs money. The try is spent only
 * once an image actually comes back, claimed atomically so two presses at
 * once cannot spend it twice.
 *
 * Deliberately not a photograph of a person. A legal directory showing a
 * fabricated "photo" of a lawyer is a trust problem, not a feature — so the
 * prompt below asks for an abstract, iconographic avatar in the app's own
 * colours, the same idea as the plain-initial avatar this replaces, just
 * styled.
 */
export async function POST() {
  const id = await getSessionAdvocateId();
  if (!id) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: 'AI avatars are not switched on for this site yet.' },
      { status: 503 }
    );
  }

  try {
    await connectDB();
    const advocate = await Advocate.findById(id)
      .select('planId planExpiresAt aiAvatarCount')
      .lean();
    if (!advocate) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

    const plan = activePlan(advocate);
    if (plan.id === 'free') {
      return NextResponse.json(
        {
          error: 'AI avatars need a Professional plan or higher.',
          upgradeTo: 'professional',
          plan: plan.id,
        },
        { status: 402 }
      );
    }

    const used = Number(advocate.aiAvatarCount) || 0;
    if (used >= MAX_AI_AVATARS) {
      return NextResponse.json(
        { error: 'You have used both of your AI avatar tries.', remaining: 0 },
        { status: 429 }
      );
    }

    const prompt = [
      "A flat, modern, professional icon-style avatar for a lawyer's profile picture on a legal directory website.",
      'Abstract and iconographic — absolutely NOT a photograph, and NOT a realistic human face, portrait or person.',
      'A simple, elegant emblem combining a pair of justice scales and a minimalist silhouette bust,',
      'on a solid deep navy blue background (#0B1F3A) with warm gold accents (#D4A017).',
      'Clean flat vector-illustration style, centred composition, suitable as a small circular profile icon.',
      'No text or letters, no photographic elements, no realistic facial features, no shadow of a real person.',
    ].join(' ');

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        n: 1,
        size: '1024x1024',
        // Medium, compressed JPEG: plenty for a small circular avatar, at a
        // fraction of the size (and cost) of the default high-quality PNG —
        // still a real per-call charge, which is the whole reason this is
        // capped at MAX_AI_AVATARS in the first place.
        quality: 'medium',
        background: 'opaque',
        output_format: 'jpeg',
        output_compression: 75,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('avatar/generate: openai refused', res.status, detail.slice(0, 300));
      return NextResponse.json(
        { error: 'Could not create an avatar just now. Please try again.' },
        { status: 502 }
      );
    }

    const payload = await res.json();
    const b64 = payload?.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json(
        { error: 'Could not create an avatar just now. Please try again.' },
        { status: 502 }
      );
    }

    // The try is spent here, after the image is actually in hand — a
    // generation that failed above never reaches this line, so it never
    // costs the lawyer one of their two. The filter re-checks the cap so a
    // second request racing this one cannot both succeed.
    const claimed = await Advocate.findOneAndUpdate(
      { _id: id, aiAvatarCount: { $lt: MAX_AI_AVATARS } },
      { $inc: { aiAvatarCount: 1 } },
      { new: true }
    ).select('aiAvatarCount').lean();
    if (!claimed) {
      return NextResponse.json(
        { error: 'You have used both of your AI avatar tries.', remaining: 0 },
        { status: 429 }
      );
    }

    return NextResponse.json({
      photo: `data:image/jpeg;base64,${b64}`,
      remaining: Math.max(0, MAX_AI_AVATARS - claimed.aiAvatarCount),
    });
  } catch (err) {
    console.error('avatar/generate error', err);
    return NextResponse.json(
      { error: 'Could not create an avatar just now. Please try again.' },
      { status: 502 }
    );
  }
}
