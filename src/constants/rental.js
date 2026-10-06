/** Size of a page in the rental lists. */
export const RENTAL_PAGE_SIZE = 20;

/** Lifecycle of a purchase order, as the API names it. */
export const ORDER_STATUSES = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  OUT: 'OUT',
  RETURNED: 'RETURNED',
  CANCELLED: 'CANCELLED',
};

/** Badge tone of each order status. */
export const ORDER_STATUS_TONES = {
  DRAFT: 'draft',
  CONFIRMED: 'open',
  OUT: 'active',
  RETURNED: 'closed',
  CANCELLED: 'cancel',
};

/** An order may still be rewritten in these statuses, as long as it has no invoice. */
export const EDITABLE_ORDER_STATUSES = [ORDER_STATUSES.DRAFT, ORDER_STATUSES.CONFIRMED];

/** An invoice may be drawn from an order in these statuses. */
export const INVOICEABLE_ORDER_STATUSES = [
  ORDER_STATUSES.CONFIRMED,
  ORDER_STATUSES.OUT,
  ORDER_STATUSES.RETURNED,
];

/** Lifecycle of an invoice. */
export const INVOICE_STATUSES = {
  ISSUED: 'ISSUED',
  CANCELLED: 'CANCELLED',
};

/** What a price is quoted for. */
export const PRICING_MODES = {
  PER_EVENT: 'PER_EVENT',
  PER_DAY: 'PER_DAY',
};

/** What a line of an order sells: an article of the catalogue or a service. */
export const LINE_KINDS = {
  ARTICLE: 'ARTICLE',
  SERVICE: 'SERVICE',
};

/** Services billed on an order. OTHER carries its own wording. */
export const SERVICE_TYPES = {
  TRANSPORT: 'TRANSPORT',
  OTHER: 'OTHER',
};

/** Longest grace, in days, an order or the settings may give before lateness. */
export const MAX_GRACE_DAYS = 60;

/** Stock movements typed by hand. Check-outs and returns come from an order. */
export const MANUAL_MOVEMENTS = [
  'ENTRY',
  'INVENTORY_CORRECTION',
  'BREAKAGE',
  'LOSS',
  'TO_REPAIR',
  'BACK_IN_SERVICE',
  'RETIREMENT',
];

/** The only movement whose quantity may be negative. */
export const CORRECTION_MOVEMENT = 'INVENTORY_CORRECTION';

/** How a customer may pay. */
export const PAYMENT_METHODS = ['CASH', 'WAVE', 'ORANGE_MONEY', 'BANK', 'OTHER'];

/** Ways a customer is designated on an order. */
export const CUSTOMER_KINDS = {
  MEMBER: 'MEMBER',
  EXTERNAL: 'EXTERNAL',
};

/** Sorts offered on the catalogue, as the API names them. */
export const ARTICLE_SORTS = ['name', 'price', 'updated'];
