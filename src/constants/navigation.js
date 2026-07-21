/**
 * Centralized navigation maps used by the Navbar, MobileMenu and Footer.
 * Keeping links here keeps the layout components presentational and reusable.
 */
export const MAIN_NAV = [
  { label: 'Home', href: '/' },
  { label: 'Find Lawyers', href: '/lawyers' },
  { label: 'Legal Services', href: '/legal-services' },
  { label: 'Cities', href: '/cities' },
  { label: 'Blogs', href: '/blogs' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

/** Primary calls-to-action shown in the header and mobile drawer. */
export const AUTH_NAV = {
  login: { label: 'Lawyer Login', href: '/login' },
  register: { label: 'Register as Lawyer', href: '/register' },
  userLogin: { label: 'User Login', href: '/user/login' },
  userSignup: { label: 'Sign Up', href: '/user/signup' },
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
