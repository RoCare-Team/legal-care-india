import { LayoutDashboard, Scale, Users, Inbox, Star, Building2 } from 'lucide-react';

/** Navigation for the admin panel, shared by the sidebar and mobile nav. */
export const ADMIN_NAV = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Advocates', href: '/admin/advocates', icon: Scale },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Cities', href: '/admin/cities', icon: Building2 },
  { label: 'Enquiries', href: '/admin/enquiries', icon: Inbox },
  { label: 'Testimonials', href: '/admin/testimonials', icon: Star },
];
