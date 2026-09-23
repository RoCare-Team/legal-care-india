import {
  LayoutDashboard, UserRound, Image as ImageIcon, Building2, Scale, Phone,
  Clock, FileBadge, Award, GraduationCap, Briefcase, Languages, ShieldCheck, Wifi,
  Share2, Settings, MessagesSquare, BadgeIndianRupee, MessageCircleMore, Wallet, IndianRupee, Landmark, Inbox,
} from 'lucide-react';

/**
 * The lawyer portal's navigation, grouped. `badge: 'pending'` marks the item
 * that carries the live count of requests waiting on the lawyer.
 */
export const DASHBOARD_NAV = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Consultations', href: '/dashboard/consultations', icon: MessagesSquare, badge: 'pending' },
      { label: 'Messages', href: '/dashboard/messages', icon: MessageCircleMore },
      { label: 'Client Queries', href: '/dashboard/queries', icon: Inbox },
      { label: 'Earnings', href: '/dashboard/earnings', icon: Wallet },
      { label: 'Payouts', href: '/dashboard/payouts', icon: Landmark },
    ],
  },
  {
    title: 'Practice',
    items: [
      { label: 'Edit Profile', href: '/dashboard/profile', icon: UserRound },
      { label: 'Consultation Rates', href: '/dashboard/profile#slots', icon: IndianRupee },
      // A plan is not part of describing your practice, it is what decides how
      // much of it you may describe — but it is still about the practice.
      { label: 'Your Plan', href: '/dashboard/plan', icon: BadgeIndianRupee },
    ],
  },
  {
    title: 'Account',
    items: [{ label: 'Settings', href: '/dashboard/settings', icon: Settings }],
  },
];

/** Deep links into the Edit Profile page's sections, shown while editing. */
export const PROFILE_SECTIONS = [
  { label: 'Legal Services', href: '/dashboard/profile#services', icon: Scale },
  { label: 'Office Details', href: '/dashboard/profile#office', icon: Building2 },
  { label: 'Office Timing', href: '/dashboard/profile#timing', icon: Clock },
  { label: 'Contact Details', href: '/dashboard/profile#contact', icon: Phone },
  { label: 'Consultation Rates', href: '/dashboard/profile#slots', icon: IndianRupee },
  { label: 'Usually Online', href: '/dashboard/profile#availability', icon: Wifi },
  { label: 'Education', href: '/dashboard/profile#education', icon: GraduationCap },
  { label: 'Experience', href: '/dashboard/profile#experience', icon: Briefcase },
  { label: 'Verification Documents', href: '/dashboard/profile#verification', icon: ShieldCheck },
  { label: 'Languages', href: '/dashboard/profile#languages', icon: Languages },
  { label: 'Certificates', href: '/dashboard/profile#certificates', icon: FileBadge },
  { label: 'Awards', href: '/dashboard/profile#awards', icon: Award },
  { label: 'Gallery', href: '/dashboard/profile#gallery', icon: ImageIcon },
  { label: 'Social Links', href: '/dashboard/profile#social', icon: Share2 },
];

/** Page titles for the app bar, longest prefix first. */
export const DASHBOARD_TITLES = [
  { prefix: '/dashboard/consultations', title: 'Consultations', sub: 'Requests, sessions and what each one earned' },
  { prefix: '/dashboard/messages', title: 'Messages', sub: 'Every client you have spoken to' },
  { prefix: '/dashboard/queries', title: 'Client Queries', sub: 'Questions posted from the website' },
  { prefix: '/dashboard/earnings', title: 'Earnings', sub: 'What you earned after JusticeLand commission' },
  { prefix: '/dashboard/payouts', title: 'Payouts', sub: 'Withdrawals and bank accounts' },
  { prefix: '/dashboard/profile', title: 'Edit Profile', sub: 'What clients see on your public profile' },
  { prefix: '/dashboard/plan', title: 'Your Plan', sub: 'Membership and billing' },
  { prefix: '/dashboard/settings', title: 'Settings', sub: 'Account details' },
  { prefix: '/dashboard', title: 'Dashboard', sub: 'Your practice at a glance' },
];
