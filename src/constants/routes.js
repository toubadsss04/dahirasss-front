/** Route paths, referenced everywhere instead of raw strings. */
export const ROUTES = {
  login: '/connexion',
  dashboard: '/',
  members: '/membres',
  memberDetail: '/membres/:memberId',
  entities: '/categories',
  meetings: '/rencontres',
  meetingDetail: '/rencontres/:meetingId',
  /** Kept only to send an old link to the meetings, where contributions live. */
  contributions: '/contributions',
  donations: '/barkelou',
  expenses: '/depenses',
  exercises: '/exercices',
  projects: '/projets',
  projectDetail: '/projets/:projectId',
  financialStatement: '/etat-financier',
  financialJournal: '/journal-financier',
  auditLog: '/journal-audit',
  users: '/utilisateurs',
  rental: '/location',
  rentalArticles: '/location/articles',
  rentalArticleDetail: '/location/articles/:articleId',
  rentalSettings: '/location/parametres',
  rentalOrders: '/location/bons-de-commande',
  rentalOrderNew: '/location/bons-de-commande/nouveau',
  rentalOrderDetail: '/location/bons-de-commande/:orderId',
  rentalOrderEdit: '/location/bons-de-commande/:orderId/modifier',
  rentalInvoices: '/location/factures',
  rentalInvoiceDetail: '/location/factures/:invoiceId',
  rentalStatement: '/location/etat-financier',
};

/**
 * Build a concrete path from a parameterised route.
 *
 * @param {string} pattern Route pattern containing :params.
 * @param {Record<string, string>} params Values to substitute.
 * @returns {string} The resolved path.
 */
export function buildPath(pattern, params) {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, encodeURIComponent(value)),
    pattern,
  );
}
