import {
  LayoutDashboard, UserRound, Image as ImageIcon, Building2, Scale, Phone,
  Clock, IndianRupee, FileBadge, Award, GraduationCap, Briefcase, Languages,
  Share2, Settings, MessagesSquare,
} from 'lucide-react';

/**
 * Dashboard navigation, grouped. Profile sub-sections deep-link into the
 * Edit Profile page anchors so every requested area is reachable.
 * (The "View Public Profile" link lives in the topbar, which knows the
 * logged-in advocate's slug.)
 */
export const DASHBOARD_NAV = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Consultations', href: '/dashboard/consultations', icon: MessagesSquare },
      { label: 'Edit Profile', href: '/dashboard/profile', icon: UserRound },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
  {
    title: 'Profile Sections',
    items: [
      { label: 'Legal Services', href: '/dashboard/profile#services', icon: Scale },
      { label: 'Office Details', href: '/dashboard/profile#office', icon: Building2 },
      { label: 'Office Timing', href: '/dashboard/profile#timing', icon: Clock },
      { label: 'Contact Details', href: '/dashboard/profile#contact', icon: Phone },
      { label: 'Fees', href: '/dashboard/profile#fees', icon: IndianRupee },
      { label: 'Chat Rates', href: '/dashboard/profile#chat-rates', icon: MessagesSquare },
      { label: 'Education', href: '/dashboard/profile#education', icon: GraduationCap },
      { label: 'Experience', href: '/dashboard/profile#experience', icon: Briefcase },
      { label: 'Languages', href: '/dashboard/profile#languages', icon: Languages },
      { label: 'Certificates', href: '/dashboard/profile#certificates', icon: FileBadge },
      { label: 'Awards', href: '/dashboard/profile#awards', icon: Award },
      { label: 'Gallery', href: '/dashboard/profile#gallery', icon: ImageIcon },
      { label: 'Social Links', href: '/dashboard/profile#social', icon: Share2 },
    ],
  },
];
