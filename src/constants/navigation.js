/**
 * Centralized navigation maps used by the Navbar, MobileMenu and Footer.
 * Keeping links here keeps the layout components presentational and reusable.
 */
// Three links, not five.
//
// "Home" went first: the logo already goes home from every page. About and
// Contact went next — both are read once and neither is what somebody opens
// the site to do, so they keep their place in the footer, where visitors go
// looking for that kind of thing.
//
// How It Works stays. It is not a page but a jump to the section on the home
// page, and it answers the question a first-time visitor has before they will
// search for anything: what actually happens if I do.
export const MAIN_NAV = [
  { label: 'Find Lawyers', href: '/lawyers' },
  { label: 'Legal Services', href: '/legal-services' },
  { label: 'How It Works', href: '/#how-it-works' },
];

/** Primary calls-to-action shown in the header and mobile drawer. */
export const AUTH_NAV = {
  login: { label: 'Lawyer Login', href: '/login' },
  register: { label: 'Register as Lawyer', href: '/register' },
  // No `userSignup`: a client account is created by logging in with a mobile
  // number, so /user/login is the only client-facing entry point.
  userLogin: { label: 'User Login', href: '/user/login' },
};

export const FOOTER_NAV = [
  {
    title: 'Platform',
    links: [
      { label: 'Find Lawyers', href: '/lawyers' },
      { label: 'Legal Services', href: '/legal-services' },
      { label: 'Browse Cities', href: '/cities' },
      { label: 'How It Works', href: '/#how-it-works' },
    ],
  },
  {
    title: 'For Lawyers',
    links: [
      { label: 'Register as Lawyer', href: '/register' },
      { label: 'Lawyer Login', href: '/login' },
      { label: 'Verification', href: '/verification' },
      { label: 'Success Stories', href: '/success-stories' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blogs', href: '/blogs' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Disclaimer', href: '/disclaimer' },
      { label: 'Refund Policy', href: '/refund' },
    ],
  },
];
