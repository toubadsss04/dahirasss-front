import {
  BookOpen,
  Boxes,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderKanban,
  Gauge,
  HandCoins,
  LayoutDashboard,
  Receipt,
  Scale,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  UserCog,
  Wallet,
} from 'lucide-react';

import { ROUTES } from './routes';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ENTITY_MANAGER: 'ENTITY_MANAGER',
  RENTAL_MANAGER: 'RENTAL_MANAGER',
  SUPERVISOR: 'SUPERVISOR',
  MEMBER: 'MEMBER',
};

/** Roles that reach the Dahira itself: members, finances, projects, reports. */
export const DAHIRA_ROLES = [ROLES.SUPER_ADMIN, ROLES.ENTITY_MANAGER, ROLES.SUPERVISOR];

/** Roles that reach the rental business, which stands apart from the Dahira. */
export const RENTAL_ROLES = [ROLES.SUPER_ADMIN, ROLES.RENTAL_MANAGER, ROLES.SUPERVISOR];

/** Roles that write in the rental business; the supervisor only reads it. */
export const RENTAL_WRITE_ROLES = [ROLES.SUPER_ADMIN, ROLES.RENTAL_MANAGER];

/** Roles that read without writing anything. */
export const READ_ONLY_ROLES = [ROLES.SUPERVISOR];

/**
 * Sidebar model. Every item names the roles that see it, matching the areas
 * the API opens to each role: a rental manager sees the rental group alone.
 * The audit trail and user management stay with the super administrator,
 * matching the backend restrictions. A member sees their own space alone.
 *
 * Group headings and item names are translation keys, resolved when the
 * sidebar renders. The same keys name the page in the top bar.
 */
export const NAVIGATION = [
  {
    group: null,
    items: [
      {
        to: ROUTES.dashboard,
        labelKey: 'nav.dashboard',
        icon: LayoutDashboard,
        end: true,
        roles: DAHIRA_ROLES,
      },
      {
        to: ROUTES.memberSpace,
        labelKey: 'nav.memberSpace',
        icon: Wallet,
        roles: [ROLES.MEMBER],
      },
    ],
  },
  {
    group: 'nav.groups.daara',
    items: [
      { to: ROUTES.members, labelKey: 'nav.members', icon: Users, roles: DAHIRA_ROLES },
      { to: ROUTES.entities, labelKey: 'nav.daaras', icon: Building2, roles: DAHIRA_ROLES },
      {
        to: ROUTES.users,
        labelKey: 'nav.users',
        icon: UserCog,
        roles: [ROLES.SUPER_ADMIN],
      },
    ],
  },
  {
    group: 'nav.groups.finances',
    items: [
      { to: ROUTES.meetings, labelKey: 'nav.meetings', icon: CalendarDays, roles: DAHIRA_ROLES },
      { to: ROUTES.donations, labelKey: 'nav.donations', icon: HandCoins, roles: DAHIRA_ROLES },
      { to: ROUTES.expenses, labelKey: 'nav.expenses', icon: Receipt, roles: DAHIRA_ROLES },
      { to: ROUTES.financialJournal, labelKey: 'nav.journal', icon: BookOpen, roles: DAHIRA_ROLES },
      { to: ROUTES.financialStatement, labelKey: 'nav.statement', icon: Scale, roles: DAHIRA_ROLES },
    ],
  },
  {
    group: 'nav.groups.projects',
    items: [{ to: ROUTES.projects, labelKey: 'nav.projects', icon: FolderKanban, roles: DAHIRA_ROLES }],
  },
  {
    group: 'nav.groups.exercises',
    items: [{ to: ROUTES.exercises, labelKey: 'nav.exercises', icon: Sparkles, roles: DAHIRA_ROLES }],
  },
  {
    group: 'nav.groups.rental',
    items: [
      { to: ROUTES.rental, labelKey: 'nav.rentalDashboard', icon: Gauge, end: true, roles: RENTAL_ROLES },
      { to: ROUTES.rentalOrders, labelKey: 'nav.rentalOrders', icon: ClipboardList, roles: RENTAL_ROLES },
      { to: ROUTES.rentalInvoices, labelKey: 'nav.rentalInvoices', icon: FileText, roles: RENTAL_ROLES },
      { to: ROUTES.rentalStatement, labelKey: 'nav.rentalStatement', icon: Scale, roles: RENTAL_ROLES },
      { to: ROUTES.rentalExpenses, labelKey: 'nav.rentalExpenses', icon: Receipt, roles: RENTAL_ROLES },
      { to: ROUTES.rentalPeriods, labelKey: 'nav.rentalPeriods', icon: CalendarCheck, roles: RENTAL_ROLES },
      { to: ROUTES.rentalArticles, labelKey: 'nav.rentalArticles', icon: Boxes, roles: RENTAL_ROLES },
      { to: ROUTES.rentalSettings, labelKey: 'nav.rentalSettings', icon: Settings2, roles: RENTAL_ROLES },
    ],
  },
  {
    group: 'nav.groups.administration',
    items: [
      {
        to: ROUTES.auditLog,
        labelKey: 'nav.audit',
        icon: ShieldCheck,
        roles: [ROLES.SUPER_ADMIN],
      },
    ],
  },
];
