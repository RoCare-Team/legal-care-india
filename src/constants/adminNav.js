import { LayoutDashboard, Scale, Users, Star, Building2, MessagesSquare, PhoneCall } from 'lucide-react';

/** Navigation for the admin panel, shared by the sidebar and mobile nav. */
export const ADMIN_NAV = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Lawyers', href: '/admin/advocates', icon: Scale },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Consultations', href: '/admin/consultations', icon: MessagesSquare },
  { label: 'Phone Calls', href: '/admin/calls', icon: PhoneCall },
  { label: 'Cities', href: '/admin/cities', icon: Building2 },
  { label: 'Testimonials', href: '/admin/testimonials', icon: Star },
];
