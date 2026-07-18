import { LayoutDashboard, Scale, Users, Star, Building2, MessagesSquare } from 'lucide-react';

/** Navigation for the admin panel, shared by the sidebar and mobile nav. */
export const ADMIN_NAV = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Advocates', href: '/admin/advocates', icon: Scale },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Consultations', href: '/admin/consultations', icon: MessagesSquare },
  { label: 'Cities', href: '/admin/cities', icon: Building2 },
  { label: 'Testimonials', href: '/admin/testimonials', icon: Star },
];
