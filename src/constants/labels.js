/**
 * Display vocabulary, as translation keys.
 *
 * The backend keeps neutral technical names: the table is donations and the
 * route is /donations. What the reader sees is a key resolved at render time,
 * so the same screen speaks whichever language is active.
 *
 * These helpers exist so no screen has to build a key by hand. Pass the value
 * the API returned and hand the result to t().
 */

/** Donations are called Barkelou throughout the interface. */
export const DONATION_KEY = 'domain.donation';
export const DONATIONS_KEY = 'domain.donations';
export const GAMOU_KEY = 'domain.gamou';

/**
 * Key for a movement type in the financial journal.
 *
 * @param {string} type CONTRIBUTION, DONATION or EXPENSE.
 * @returns {string} The translation key.
 */
export const movementTypeKey = (type) => `labels.movementType.${type}`;

/**
 * Key for an account role.
 *
 * @param {string} role SUPER_ADMIN or ENTITY_MANAGER.
 * @returns {string} The translation key.
 */
export const roleKey = (role) => `labels.role.${role}`;

/**
 * Key for the authorisation state of an account.
 *
 * @param {string} status PENDING_APPROVAL, ACTIVE or DISABLED.
 * @returns {string} The translation key.
 */
export const accountStatusKey = (status) => `labels.accountStatus.${status}`;

/**
 * Key for the state of an exercise.
 *
 * @param {string} status DRAFT, OPEN or CLOSED.
 * @param {boolean} [lowercase] Whether the sentence needs it uncapitalised.
 * @returns {string} The translation key.
 */
export const exerciseStatusKey = (status, lowercase = false) =>
  `labels.${lowercase ? 'exerciseStatusLower' : 'exerciseStatus'}.${status}`;

/**
 * Key for the state of a financial operation.
 *
 * @param {string} status ACTIVE or CANCELLED.
 * @returns {string} The translation key.
 */
export const operationStatusKey = (status) => `labels.operationStatus.${status}`;

/**
 * Key for the state of a daara.
 *
 * @param {string} status ACTIVE or INACTIVE.
 * @returns {string} The translation key.
 */
export const entityStatusKey = (status) => `labels.entityStatus.${status}`;

/**
 * Key for the state of a member.
 *
 * @param {string} status ACTIVE or INACTIVE.
 * @returns {string} The translation key.
 */
export const memberStatusKey = (status) => `labels.memberStatus.${status}`;

/**
 * Key for the sex of a member, written in full.
 *
 * @param {string} gender FEMALE or MALE.
 * @returns {string} The translation key.
 */
export const memberGenderKey = (gender) => `labels.memberGender.${gender}`;

/**
 * Key for the sex of a member as one letter, F or H.
 *
 * @param {string} gender FEMALE or MALE.
 * @returns {string} The translation key.
 */
export const memberGenderShortKey = (gender) => `labels.memberGenderShort.${gender}`;

/**
 * Key for an audited action.
 *
 * @param {string} action One of the audit actions.
 * @returns {string} The translation key.
 */
export const auditActionKey = (action) => `labels.auditAction.${action}`;

/**
 * Key for what an audit entry is about.
 *
 * @param {string} objectType One of the audit object types.
 * @returns {string} The translation key.
 */
export const auditObjectKey = (objectType) => `labels.auditObject.${objectType}`;

/**
 * Key for a field name shown in an audit difference.
 *
 * @param {string} field The column name as the API reports it.
 * @returns {string} The translation key.
 */
export const auditFieldKey = (field) => `audit.field.${field}`;

/**
 * Key for the state of a project.
 *
 * @param {string} status OPEN or CLOSED.
 * @returns {string} The translation key.
 */
export const projectStatusKey = (status) => `labels.projectStatus.${status}`;

/**
 * Key for the status of a purchase order.
 *
 * @param {string} status DRAFT, CONFIRMED, OUT, RETURNED or CANCELLED.
 * @returns {string} The translation key.
 */
export const rentalOrderStatusKey = (status) => `labels.rentalOrderStatus.${status}`;

/**
 * Key for the status of an invoice.
 *
 * @param {string} status ISSUED or CANCELLED.
 * @returns {string} The translation key.
 */
export const rentalInvoiceStatusKey = (status) => `labels.rentalInvoiceStatus.${status}`;

/**
 * Key for what a rental price is quoted for.
 *
 * @param {string} mode PER_EVENT or PER_DAY.
 * @returns {string} The translation key.
 */
export const pricingModeKey = (mode) => `labels.pricingMode.${mode}`;

/**
 * Key for a kind of service billed on an order.
 *
 * @param {string} type TRANSPORT or OTHER.
 * @returns {string} The translation key.
 */
export const serviceTypeKey = (type) => `labels.serviceType.${type}`;

/**
 * Key for a kind of stock movement.
 *
 * @param {string} type Movement type, as the API names it.
 * @returns {string} The translation key.
 */
export const stockMovementKey = (type) => `labels.stockMovement.${type}`;

/**
 * Key for a payment method.
 *
 * @param {string} method CASH, WAVE, ORANGE_MONEY, BANK or OTHER.
 * @returns {string} The translation key.
 */
export const paymentMethodKey = (method) => `labels.paymentMethod.${method}`;
