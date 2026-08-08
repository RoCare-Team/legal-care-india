import { permanentRedirect } from 'next/navigation';

/**
 * There is no sign-up any more — a client account is created the first time a
 * mobile number passes OTP verification, so /user/login does both jobs.
 *
 * The route is kept as a permanent redirect rather than deleted: the old URL is
 * in browser histories, bookmarks and any link already sent to someone, and a
 * 404 on the way to creating an account is a lost account. 308 also tells a
 * crawler the address moved for good.
 */
export default function UserSignupPage() {
  permanentRedirect('/user/login');
}
