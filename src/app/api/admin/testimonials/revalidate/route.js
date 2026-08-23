import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin';
import { TESTIMONIALS_TAG } from '@/lib/testimonials';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/testimonials/revalidate — drop the cached testimonial list.
 *
 * The homepage list is cached for an hour, and until now the only thing that
 * cleared it was somebody submitting a new review. So a testimonial edited or
 * corrected straight in the database stayed invisible for up to an hour with
 * no way to hurry it along — and on Vercel the data cache survives a
 * redeploy, so shipping again did not help either.
 *
 * Admin-only: this is cheap to call but it does force a fresh render for
 * everyone, so it is not something to leave open to the internet.
 */
export async function POST() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  try {
    revalidateTag(TESTIMONIALS_TAG);
    // The tag covers the data; this re-renders the page holding it.
    revalidatePath('/');

    return NextResponse.json({
      ok: true,
      message: 'Testimonials refreshed. The homepage will show the latest within a few seconds.',
    });
  } catch (err) {
    console.error('testimonial revalidate failed', err);
    return NextResponse.json({ error: 'Could not refresh the cache.' }, { status: 500 });
  }
}
