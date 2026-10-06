/**
 * Cache keys and what each kind of write invalidates.
 *
 * Every screen used to decide on its own what to refresh after a write, and
 * they disagreed, so a screen kept showing a stale answer.
 *
 * Keys live here, and so does the consequence of each operation. A write
 * declares its domain, never a list of keys, so adding a screen cannot leave
 * a stale one behind.
 */

/** Root of each cached collection. Keys are matched by prefix. */
export const KEYS = {
  daaras: 'daaras',
  daaraNames: 'daara-names',
  members: 'members',
  member: 'member',
  memberHistory: 'member-history',
  memberMonthly: 'member-monthly',
  users: 'users',
  exercises: 'exercises',
  exerciseSummary: 'exercise-summary',
  exerciseTransfer: 'exercise-transfer',
  meetings: 'meetings',
  meeting: 'meeting',
  meetingGifts: 'meeting-gifts',
  meetingGiftTargets: 'meeting-gift-targets',
  contributions: 'contributions',
  donations: 'donations',
  expenses: 'expenses',
  expenseCategories: 'expense-categories',
  dashboard: 'dashboard',
  statement: 'statement',
  journal: 'journal',
  audit: 'audit',
  projects: 'projects',
  projectYears: 'project-years',
  project: 'project',
  projectContributors: 'project-contributors',
  projectPayments: 'project-payments',
  projectMemberOptions: 'project-member-options',
  rentalDashboard: 'rental-dashboard',
  rentalStatement: 'rental-statement',
  rentalCategories: 'rental-categories',
  rentalUnits: 'rental-units',
  rentalArticles: 'rental-articles',
  rentalArticle: 'rental-article',
  rentalArticleOptions: 'rental-article-options',
  rentalMovements: 'rental-movements',
  rentalMemberOptions: 'rental-member-options',
  rentalOrders: 'rental-orders',
  rentalOrder: 'rental-order',
  rentalInvoices: 'rental-invoices',
  rentalInvoice: 'rental-invoice',
  myAccount: 'my-account',
  rentalBalance: 'rental-balance',
  rentalSettings: 'rental-settings',
  rentalPeriods: 'rental-periods',
  rentalExpenses: 'rental-expenses',
  rentalExpenseCategories: 'rental-expense-categories',
};

/**
 * Everything a financial write moves.
 *
 * Any amount recorded, corrected or cancelled changes the balances, the
 * statement, the journal and the standing of the exercise itself, and always
 * leaves an audit entry.
 */
const FINANCIAL_FALLOUT = [
  KEYS.exerciseSummary,
  KEYS.dashboard,
  KEYS.statement,
  KEYS.journal,
  KEYS.audit,
];

/**
 * What each domain invalidates when written to.
 *
 * The reasoning behind the less obvious entries:
 * a member changes the counts shown on the section cards, and their name is
 * shown on each gift and in the journal, so a correction must reach those
 * too; a contribution changes the totals carried by its meeting; a project
 * payment may count in a Gamou exercise and may have been handed over at a
 * meeting, so it moves both.
 */
export const INVALIDATION = {
  /**
   * A category's name is copied onto every row that belongs to it: members,
   * accounts, gifts, contributions, journal lines and project contributors.
   * Renaming one must reach all of them, not only the category listings.
   */
  daara: [
    KEYS.daaras,
    KEYS.daaraNames,
    KEYS.members,
    KEYS.member,
    KEYS.memberHistory,
    KEYS.users,
    KEYS.projectMemberOptions,
    KEYS.contributions,
    KEYS.meetingGifts,
    KEYS.project,
    KEYS.projectContributors,
    KEYS.dashboard,
    KEYS.statement,
    KEYS.journal,
    KEYS.audit,
  ],

  /**
   * A member's name and category are shown on their account, on each project
   * they contributed to and on every gift, so a rename or a transfer must
   * reach all of those.
   */
  member: [
    KEYS.members,
    KEYS.projectMemberOptions,
    KEYS.member,
    KEYS.memberHistory,
    KEYS.memberMonthly,
    KEYS.users,
    KEYS.contributions,
    KEYS.meetingGifts,
    KEYS.projectContributors,
    KEYS.journal,
    KEYS.daaras,
    KEYS.dashboard,
    KEYS.statement,
    KEYS.audit,
  ],

  /**
   * Creating an account creates the member behind it, and renaming one
   * renames that member. The account's name is also shown as the author of
   * every record it entered, so an account write reaches everything showing
   * either name.
   */
  user: [
    KEYS.users,
    KEYS.members,
    KEYS.projectMemberOptions,
    KEYS.member,
    KEYS.memberHistory,
    KEYS.daaras,
    KEYS.exercises,
    KEYS.meetings,
    KEYS.meeting,
    KEYS.contributions,
    KEYS.meetingGifts,
    KEYS.donations,
    KEYS.expenses,
    KEYS.projects,
    KEYS.project,
    KEYS.projectContributors,
    KEYS.projectPayments,
    KEYS.dashboard,
    KEYS.statement,
    KEYS.journal,
    KEYS.audit,
  ],

  /**
   * Opening or closing an exercise changes the Gamou pot a meeting offers and
   * what the projects attached to it show.
   */
  exercise: [
    KEYS.exercises,
    KEYS.exerciseTransfer,
    KEYS.meetingGiftTargets,
    KEYS.projects,
    KEYS.project,
    ...FINANCIAL_FALLOUT,
  ],

  meeting: [
    KEYS.meetings,
    KEYS.meeting,
    KEYS.contributions,
    KEYS.meetingGifts,
    KEYS.meetingGiftTargets,
    ...FINANCIAL_FALLOUT,
  ],

  contribution: [
    KEYS.contributions,
    KEYS.meetings,
    KEYS.meeting,
    KEYS.meetingGifts,
    KEYS.memberMonthly,
    ...FINANCIAL_FALLOUT,
  ],

  /**
   * What a member gave at a meeting lands in the Gamou pot and in projects at
   * once, so it moves everything both of them move.
   */
  meetingGift: [
    KEYS.meetingGifts,
    KEYS.meetings,
    KEYS.meeting,
    KEYS.contributions,
    KEYS.memberMonthly,
    KEYS.projects,
    KEYS.project,
    KEYS.projectContributors,
    KEYS.projectPayments,
    ...FINANCIAL_FALLOUT,
  ],

  /** A gift or an expense may be filed under a project, whose balance then moves. */
  donation: [KEYS.donations, KEYS.projects, KEYS.project, ...FINANCIAL_FALLOUT],

  expense: [KEYS.expenses, KEYS.projects, KEYS.project, ...FINANCIAL_FALLOUT],

  /** A category's name is copied onto each expense filed under it. */
  expenseCategory: [KEYS.expenseCategories, KEYS.expenses, KEYS.statement, KEYS.audit],

  /**
   * A project holds no money of its own until it is paid, so creating or
   * correcting one moves the project listings and the pots a meeting offers.
   * Its name is copied onto the gifts, expenses and meeting gifts filed under
   * it and into the journal labels, and its amounts per category set the
   * share each contributor owes.
   */
  project: [
    KEYS.projects,
    KEYS.projectYears,
    KEYS.project,
    KEYS.projectContributors,
    KEYS.meetingGiftTargets,
    KEYS.meetingGifts,
    KEYS.donations,
    KEYS.expenses,
    KEYS.journal,
    KEYS.audit,
  ],

  /**
   * A payment moves the project totals and its contributor, the meeting it
   * was handed over at, and the exercise when the project counts in a Gamou.
   */
  projectPayment: [
    KEYS.projects,
    KEYS.project,
    KEYS.projectContributors,
    KEYS.projectPayments,
    KEYS.meetingGifts,
    KEYS.meetings,
    KEYS.meeting,
    ...FINANCIAL_FALLOUT,
  ],

  /** Emptying the trail moves nothing else: no other screen reads from it. */
  audit: [KEYS.audit],

  /**
   * Categories and units are shown on every article, and renaming one moves
   * the names the catalogue lists and the order lines offer.
   */
  rentalCatalog: [
    KEYS.rentalCategories,
    KEYS.rentalUnits,
    KEYS.rentalArticles,
    KEYS.rentalArticle,
    KEYS.rentalArticleOptions,
    KEYS.audit,
  ],

  /** A stock movement moves the levels of its article and what orders can still take. */
  rentalStock: [
    KEYS.rentalArticles,
    KEYS.rentalArticle,
    KEYS.rentalMovements,
    KEYS.rentalArticleOptions,
    KEYS.audit,
  ],

  /**
   * An order holds material once confirmed and moves it when it goes out or
   * comes back, so it reaches the stock as well as the dashboard.
   */
  rentalOrder: [
    KEYS.rentalOrders,
    KEYS.rentalOrder,
    KEYS.rentalStatement,
    KEYS.rentalArticles,
    KEYS.rentalArticle,
    KEYS.rentalMovements,
    KEYS.rentalArticleOptions,
    KEYS.rentalDashboard,
    KEYS.audit,
  ],

  /**
   * An invoice or a payment moves what is owed, and the order shows its
   * invoice. A payment is money in, so it moves the balance and the months.
   */
  rentalInvoice: [
    KEYS.rentalInvoices,
    KEYS.rentalInvoice,
    KEYS.rentalOrders,
    KEYS.rentalOrder,
    KEYS.rentalDashboard,
    KEYS.rentalStatement,
    KEYS.rentalBalance,
    KEYS.rentalPeriods,
    KEYS.audit,
  ],

  /** The default grace decides which orders read as late. */
  rentalSettings: [KEYS.rentalSettings, KEYS.rentalOrders, KEYS.rentalOrder, KEYS.rentalDashboard],

  /**
   * Expenses are money out and months carry the balance, so both move the
   * balance, the statement and every month after the one touched.
   */
  rentalCash: [
    KEYS.rentalExpenses,
    KEYS.rentalExpenseCategories,
    KEYS.rentalBalance,
    KEYS.rentalPeriods,
    KEYS.rentalStatement,
    KEYS.audit,
  ],
};

/**
 * Invalidate everything a write in this domain affects.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient The cache.
 * @param {keyof typeof INVALIDATION} domain What was written to.
 * @returns {Promise<void>} Resolves once the refetches are queued.
 */
export async function invalidateDomain(queryClient, domain) {
  const roots = INVALIDATION[domain];
  if (!roots) {
    throw new Error(`Domaine de cache inconnu : ${domain}`);
  }
  await Promise.all(
    roots.map((root) => queryClient.invalidateQueries({ queryKey: [root] })),
  );
}
