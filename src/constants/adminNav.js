import { LayoutDashboard, Scale, Users, Star, Building2, MessagesSquare, PhoneCall, Newspaper, Mail, IndianRupee, Landmark } from 'lucide-react';

/** Navigation for the admin panel, shared by the sidebar and mobile nav. */
export const ADMIN_NAV = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Lawyers', href: '/admin/advocates', icon: Scale },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Consultations', href: '/admin/consultations', icon: MessagesSquare },
  { label: 'Payments', href: '/admin/payments', icon: IndianRupee },
  { label: 'Payouts', href: '/admin/payouts', icon: Landmark },
  { label: 'Contact', href: '/admin/contacts', icon: Mail },
  { label: 'Phone Calls', href: '/admin/calls', icon: PhoneCall },
  { label: 'Cities', href: '/admin/cities', icon: Building2 },
  { label: 'Blogs', href: '/admin/blogs', icon: Newspaper },
  { label: 'Testimonials', href: '/admin/testimonials', icon: Star },
];
