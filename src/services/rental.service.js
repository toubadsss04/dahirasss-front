import {
  CUSTOMER_KINDS,
  LINE_KINDS,
  MAX_GRACE_DAYS,
  PAYMENT_METHODS,
  PRICING_MODES,
  RENTAL_PAYMENT_TARGET,
  SERVICE_TYPES,
} from '../constants/rental';
import { optionalText, requiredText } from '../utils/formChanges';
import { todayInDakar } from '../utils/format';
import { apiClient } from './apiClient';

/**
 * Read the state of the rental business over a period.
 *
 * @param {{date_from?: string, date_to?: string}} [params] Period, the current month by default.
 * @returns {Promise<object>} The dashboard figures.
 */
export async function fetchRentalDashboard(params = {}) {
  const { data } = await apiClient.get('/rental/dashboard', { params });
  return data;
}

/**
 * Read the financial statement of the rental business over a period.
 *
 * @param {{date_from?: string, date_to?: string}} [params] Period, the current month by default.
 * @returns {Promise<object>} Invoicing, collections, outstanding and revenue per article.
 */
export async function fetchRentalStatement(params = {}) {
  const { data } = await apiClient.get('/rental/statement', { params });
  return data;
}

/**
 * List the active members of the Dahira, to pick one as a customer.
 *
 * @returns {Promise<Array<object>>} The members.
 */
export async function fetchRentalMemberOptions() {
  const { data } = await apiClient.get('/rental/member-options');
  return data;
}

/**
 * List the categories of articles.
 *
 * @returns {Promise<Array<object>>} The categories, with their article counts.
 */
export async function fetchRentalCategories() {
  const { data } = await apiClient.get('/rental/categories');
  return data;
}

/**
 * Create a category of articles.
 *
 * @param {{name: string, description?: string|null}} payload The category.
 * @returns {Promise<object>} The created category.
 */
export async function createRentalCategory(payload) {
  const { data } = await apiClient.post('/rental/categories', payload);
  return data;
}

/**
 * Correct a category, or switch it on or off.
 *
 * @param {string} categoryId Identifier.
 * @param {object} payload Fields to change.
 * @returns {Promise<object>} The category.
 */
export async function updateRentalCategory(categoryId, payload) {
  const { data } = await apiClient.patch(`/rental/categories/${categoryId}`, payload);
  return data;
}

/**
 * Delete a category no article uses.
 *
 * @param {string} categoryId Identifier.
 * @returns {Promise<void>} Resolves once deleted.
 */
export async function deleteRentalCategory(categoryId) {
  await apiClient.delete(`/rental/categories/${categoryId}`);
}

/**
 * List the units articles are counted in.
 *
 * @returns {Promise<Array<object>>} The units, with their article counts.
 */
export async function fetchRentalUnits() {
  const { data } = await apiClient.get('/rental/units');
  return data;
}

/**
 * Create a unit.
 *
 * @param {{name: string, symbol?: string|null}} payload The unit.
 * @returns {Promise<object>} The created unit.
 */
export async function createRentalUnit(payload) {
  const { data } = await apiClient.post('/rental/units', payload);
  return data;
}

/**
 * Correct a unit, or switch it on or off.
 *
 * @param {string} unitId Identifier.
 * @param {object} payload Fields to change.
 * @returns {Promise<object>} The unit.
 */
export async function updateRentalUnit(unitId, payload) {
  const { data } = await apiClient.patch(`/rental/units/${unitId}`, payload);
  return data;
}

/**
 * Delete a unit no article uses.
 *
 * @param {string} unitId Identifier.
 * @returns {Promise<void>} Resolves once deleted.
 */
export async function deleteRentalUnit(unitId) {
  await apiClient.delete(`/rental/units/${unitId}`);
}

/**
 * List the catalogue, one page at a time, with each article's stock.
 *
 * @param {object} [params] Search, filters, sort and pagination.
 * @returns {Promise<{items: Array<object>, total: number}>} A page of articles.
 */
export async function fetchRentalArticles(params = {}) {
  const { data } = await apiClient.get('/rental/articles', { params });
  return data;
}

/**
 * Read one article with its stock.
 *
 * @param {string} articleId Identifier.
 * @returns {Promise<object>} The article.
 */
export async function fetchRentalArticle(articleId) {
  const { data } = await apiClient.get(`/rental/articles/${articleId}`);
  return data;
}

/**
 * List the active articles an order can take, with what is free over its period.
 *
 * @param {{start_date?: string, end_date?: string, order_id?: string}} [params] Period and order being edited.
 * @returns {Promise<Array<object>>} The articles.
 */
export async function fetchRentalArticleOptions(params = {}) {
  const { data } = await apiClient.get('/rental/articles/options', { params });
  return data;
}

/**
 * Add an article to the catalogue.
 *
 * @param {object} payload The article.
 * @returns {Promise<object>} The created article.
 */
export async function createRentalArticle(payload) {
  const { data } = await apiClient.post('/rental/articles', payload);
  return data;
}

/**
 * Correct an article, or switch it on or off.
 *
 * @param {string} articleId Identifier.
 * @param {object} payload Fields to change.
 * @returns {Promise<object>} The article.
 */
export async function updateRentalArticle(articleId, payload) {
  const { data } = await apiClient.patch(`/rental/articles/${articleId}`, payload);
  return data;
}

/**
 * Delete an article that was never used.
 *
 * @param {string} articleId Identifier.
 * @returns {Promise<void>} Resolves once deleted.
 */
export async function deleteRentalArticle(articleId) {
  await apiClient.delete(`/rental/articles/${articleId}`);
}

/**
 * List the stock movements of an article, newest first.
 *
 * @param {string} articleId Identifier.
 * @param {{limit?: number, offset?: number}} [params] Pagination.
 * @returns {Promise<{items: Array<object>, total: number}>} A page of movements.
 */
export async function fetchRentalMovements(articleId, params = {}) {
  const { data } = await apiClient.get(`/rental/articles/${articleId}/movements`, { params });
  return data;
}

/**
 * Record a stock movement typed by hand.
 *
 * @param {string} articleId Identifier.
 * @param {object} payload Type, quantity, date and reason.
 * @returns {Promise<object>} The article with its new stock.
 */
export async function createRentalMovement(articleId, payload) {
  const { data } = await apiClient.post(`/rental/articles/${articleId}/movements`, payload);
  return data;
}

/**
 * List purchase orders, newest first.
 *
 * @param {object} [params] Search, filters and pagination.
 * @returns {Promise<{items: Array<object>, total: number}>} A page of orders.
 */
export async function fetchRentalOrders(params = {}) {
  const { data } = await apiClient.get('/rental/orders', { params });
  return data;
}

/**
 * Read one purchase order with its lines.
 *
 * @param {string} orderId Identifier.
 * @returns {Promise<object>} The order.
 */
export async function fetchRentalOrder(orderId) {
  const { data } = await apiClient.get(`/rental/orders/${orderId}`);
  return data;
}

/**
 * Write a purchase order as a draft.
 *
 * @param {object} payload The order, as built by toOrderPayload.
 * @returns {Promise<object>} The created order.
 */
export async function createRentalOrder(payload) {
  const { data } = await apiClient.post('/rental/orders', payload);
  return data;
}

/**
 * Rewrite a purchase order not yet out nor invoiced.
 *
 * @param {string} orderId Identifier.
 * @param {object} payload The order, as built by toOrderPayload.
 * @returns {Promise<object>} The order.
 */
export async function updateRentalOrder(orderId, payload) {
  const { data } = await apiClient.put(`/rental/orders/${orderId}`, payload);
  return data;
}

/**
 * Confirm a draft order, holding its material for the period.
 *
 * @param {string} orderId Identifier.
 * @returns {Promise<object>} The order.
 */
export async function confirmRentalOrder(orderId) {
  const { data } = await apiClient.post(`/rental/orders/${orderId}/confirm`);
  return data;
}

/**
 * Hand the material of a confirmed order out.
 *
 * @param {string} orderId Identifier.
 * @param {{team: string, checkedOutAt: string}} values Who delivers the material, blank when
 *   unknown, and when it left, as a datetime-local value read on Dakar time.
 * @returns {Promise<object>} The order.
 */
export async function checkOutRentalOrder(orderId, { team, checkedOutAt }) {
  const { data } = await apiClient.post(`/rental/orders/${orderId}/check-out`, {
    team: optionalText(team),
    checked_out_at: checkedOutAt || null,
  });
  return data;
}

/**
 * Read the settings of the rental business.
 *
 * @returns {Promise<{default_return_grace_days: number}>} The settings.
 */
export async function fetchRentalSettings() {
  const { data } = await apiClient.get('/rental/settings');
  return data;
}

/**
 * Change the settings of the rental business.
 *
 * @param {{default_return_grace_days: number}} payload The settings.
 * @returns {Promise<object>} The settings.
 */
export async function updateRentalSettings(payload) {
  const { data } = await apiClient.put('/rental/settings', payload);
  return data;
}

/**
 * Take the material of an order back.
 *
 * @param {string} orderId Identifier.
 * @param {{lines: Array<object>, comment?: string|null}} payload What came back this time, line by line.
 * @returns {Promise<object>} The order, with the fees this go proposes in proposed_charges.
 */
export async function returnRentalOrder(orderId, payload) {
  const { data } = await apiClient.post(`/rental/orders/${orderId}/return`, payload);
  return data;
}

/**
 * Record fees on an order whose material has left.
 *
 * @param {string} orderId Identifier.
 * @param {Array<object>} charges Fees, as built by toChargesPayload.
 * @returns {Promise<Array<object>>} The recorded fees.
 */
export async function createRentalCharges(orderId, charges) {
  const { data } = await apiClient.post(`/rental/orders/${orderId}/charges`, { charges });
  return data;
}

/**
 * Cancel a fee with nothing paid on it. It stays in the history.
 *
 * @param {string} chargeId Identifier.
 * @param {string} reason Why it is cancelled.
 * @returns {Promise<object>} The fee.
 */
export async function cancelRentalCharge(chargeId, reason) {
  const { data } = await apiClient.post(`/rental/charges/${chargeId}/cancel`, { reason });
  return data;
}

/**
 * Cancel an order not yet out.
 *
 * @param {string} orderId Identifier.
 * @param {string} reason Why it is cancelled.
 * @returns {Promise<object>} The order.
 */
export async function cancelRentalOrder(orderId, reason) {
  const { data } = await apiClient.post(`/rental/orders/${orderId}/cancel`, { reason });
  return data;
}

/**
 * List invoices, newest first.
 *
 * @param {object} [params] Search, filters and pagination.
 * @returns {Promise<{items: Array<object>, total: number}>} A page of invoices.
 */
export async function fetchRentalInvoices(params = {}) {
  const { data } = await apiClient.get('/rental/invoices', { params });
  return data;
}

/**
 * Read one invoice with its lines and payments.
 *
 * @param {string} invoiceId Identifier.
 * @returns {Promise<object>} The invoice.
 */
export async function fetchRentalInvoice(invoiceId) {
  const { data } = await apiClient.get(`/rental/invoices/${invoiceId}`);
  return data;
}

/**
 * Issue the invoice of a confirmed order.
 *
 * @param {{order_id: string, issue_date?: string, remarks?: string|null}} payload The order to invoice.
 * @returns {Promise<object>} The invoice.
 */
export async function createRentalInvoice(payload) {
  const { data } = await apiClient.post('/rental/invoices', payload);
  return data;
}

/**
 * Cancel an invoice with no payment left on it.
 *
 * @param {string} invoiceId Identifier.
 * @param {string} reason Why it is cancelled.
 * @returns {Promise<object>} The invoice.
 */
export async function cancelRentalInvoice(invoiceId, reason) {
  const { data } = await apiClient.post(`/rental/invoices/${invoiceId}/cancel`, { reason });
  return data;
}

/**
 * Record a payment towards an invoice.
 *
 * @param {string} invoiceId Identifier.
 * @param {object} payload Items paid (rental or fee, with amounts), date, method and comment.
 * @returns {Promise<object>} The invoice.
 */
export async function addRentalPayment(invoiceId, payload) {
  const { data } = await apiClient.post(`/rental/invoices/${invoiceId}/payments`, payload);
  return data;
}

/**
 * Cancel a payment. It stays in the history.
 *
 * @param {string} invoiceId Invoice identifier.
 * @param {string} paymentId Payment identifier.
 * @param {string} reason Why it is cancelled.
 * @returns {Promise<object>} The invoice.
 */
export async function cancelRentalPayment(invoiceId, paymentId, reason) {
  const { data } = await apiClient.post(
    `/rental/invoices/${invoiceId}/payments/${paymentId}/cancel`,
    { reason },
  );
  return data;
}

/**
 * Download the PDF of an order or an invoice under its document number.
 *
 * The file is fetched with the session token, which a plain link cannot
 * carry, then handed to the browser as a download.
 *
 * @param {'orders'|'invoices'} kind Which document.
 * @param {string} id Identifier.
 * @param {string} number Document number, used as the file name.
 * @returns {Promise<void>} Resolves once the download has started.
 */
export async function downloadRentalPdf(kind, id, number) {
  const { data } = await apiClient.get(`/rental/${kind}/${id}/pdf`, { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${number}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Count the days a rental lasts, both ends included, as the API does.
 *
 * @param {string} start First day, YYYY-MM-DD.
 * @param {string} end Return day, YYYY-MM-DD.
 * @returns {number} The days, zero when the period is not set or out of order.
 */
export function rentalDays(start, end) {
  if (!start || !end || end < start) return 0;
  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const [endYear, endMonth, endDay] = end.split('-').map(Number);
  const span = Date.UTC(endYear, endMonth - 1, endDay) - Date.UTC(startYear, startMonth - 1, startDay);
  return Math.round(span / 86400000) + 1;
}

/**
 * Take a percentage of an amount, rounded half up to the franc as the API does.
 *
 * The percentage is carried in hundredths so the arithmetic stays on whole
 * numbers and never drifts from what the server computes.
 *
 * @param {number} amount Whole francs.
 * @param {number|string} percent Percentage, up to two decimals.
 * @returns {number} The share, in whole francs.
 */
export function percentOf(amount, percent) {
  const hundredths = Math.round(Number(percent || 0) * 100);
  return Math.floor((amount * hundredths + 5000) / 10000);
}

/**
 * Price one line of an order the way the API will.
 *
 * @param {{quantity: number|string, unitPrice: number|string, discount: number|string}} line The line typed.
 * @param {string} mode PER_EVENT or PER_DAY.
 * @param {number} days Length of the rental.
 * @returns {{gross: number, discount: number, net: number}} The line amounts.
 */
export function priceLine(line, mode, days) {
  const units = mode === PRICING_MODES.PER_DAY ? Math.max(days, 1) : 1;
  const gross = Number(line.quantity || 0) * Number(line.unitPrice || 0) * units;
  const discount = percentOf(gross, line.discount);
  return { gross, discount, net: gross - discount };
}

/**
 * Total priced lines with the order-wide discount, applied after the line discounts.
 *
 * @param {Array<{gross: number, discount: number, net: number}>} lines Priced lines.
 * @param {number|string} percent Order-wide discount.
 * @returns {{gross: number, discount: number, net: number}} The order totals.
 */
export function priceOrder(lines, percent) {
  const gross = lines.reduce((sum, line) => sum + line.gross, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.net, 0);
  const globalDiscount = percentOf(subtotal, percent);
  return { gross, discount: gross - subtotal + globalDiscount, net: subtotal - globalDiscount };
}

/**
 * Tell whether a percentage typed in a field is acceptable.
 *
 * @param {number|string} value The typed value.
 * @returns {boolean} True for an empty field or a number between 0 and 100.
 */
export function isValidPercent(value) {
  if (value === '' || value === null || value === undefined) return true;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 100;
}

/**
 * A blank article line. An empty pricingMode keeps the article's own.
 *
 * @returns {object} The line state.
 */
export function emptyOrderLine() {
  return {
    kind: LINE_KINDS.ARTICLE,
    articleId: '',
    serviceType: '',
    label: '',
    pricingMode: '',
    quantity: '1',
    unitPrice: '',
    discount: '',
  };
}

/**
 * A blank service line, transport by default.
 *
 * @returns {object} The line state.
 */
export function emptyServiceLine() {
  return {
    ...emptyOrderLine(),
    kind: LINE_KINDS.SERVICE,
    serviceType: SERVICE_TYPES.TRANSPORT,
    quantity: '1',
    discount: '',
  };
}

/**
 * Pricing mode a line applies: a service is always per event, an article
 * takes the mode chosen on the line or else its own.
 *
 * @param {object} line The line state.
 * @param {object} [article] The article option, for an article line.
 * @returns {string} PER_EVENT or PER_DAY.
 */
export function lineMode(line, article) {
  if (line.kind === LINE_KINDS.SERVICE) return PRICING_MODES.PER_EVENT;
  return line.pricingMode || article?.pricing_mode || PRICING_MODES.PER_EVENT;
}

/**
 * Format an instant as the value a datetime-local field holds, on Dakar time.
 *
 * @param {string|Date} [value] Instant; now when omitted.
 * @returns {string} YYYY-MM-DDTHH:mm.
 */
export function toDakarDateTimeInput(value) {
  const date = value ? new Date(value) : new Date();
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Dakar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/**
 * Count the days between two moments as the API does: every started 24 hours, at least one.
 *
 * Both values are datetime-local strings or ISO instants; Dakar has no
 * daylight saving, so reading local strings as UTC keeps the difference right.
 *
 * @param {string} from Check-out moment.
 * @param {string} to Return moment.
 * @returns {number} The days, zero when a moment is missing or out of order.
 */
export function effectiveDays(from, to) {
  if (!from || !to) return 0;
  const toInstant = (value) => new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`);
  const span = toInstant(to) - toInstant(from);
  if (Number.isNaN(span) || span < 0) return 0;
  return Math.max(Math.ceil(span / 86400000), 1);
}

/**
 * The state of a new order form.
 *
 * @returns {object} The form state.
 */
export function emptyOrderForm() {
  const today = todayInDakar();
  return {
    customerKind: CUSTOMER_KINDS.MEMBER,
    member: null,
    customerName: '',
    customerPhone: '',
    eventType: '',
    startDate: today,
    endDate: today,
    discount: '',
    graceDays: '',
    remarks: '',
    lines: [emptyOrderLine()],
  };
}

/**
 * Turn an order read from the API back into the form state, to edit it.
 *
 * @param {object} order The order.
 * @param {Array<object>} members Member options, to show the chosen member.
 * @returns {object} The form state.
 */
export function orderToForm(order, members = []) {
  const member = order.member_id ? members.find((option) => option.id === order.member_id) : null;
  return {
    customerKind: order.member_id ? CUSTOMER_KINDS.MEMBER : CUSTOMER_KINDS.EXTERNAL,
    member: member ?? null,
    customerName: order.member_id ? '' : order.customer_name,
    customerPhone: order.customer_phone ?? '',
    eventType: order.event_type,
    startDate: order.start_date,
    endDate: order.end_date,
    discount: order.discount_percent ? String(order.discount_percent) : '',
    graceDays: order.return_grace_days === null || order.return_grace_days === undefined
      ? ''
      : String(order.return_grace_days),
    remarks: order.remarks ?? '',
    lines: order.lines.map((line) => ({
      kind: line.line_kind ?? LINE_KINDS.ARTICLE,
      articleId: line.article_id ?? '',
      serviceType: line.service_type ?? '',
      label: line.line_kind === LINE_KINDS.SERVICE ? line.article_name : '',
      pricingMode: line.line_kind === LINE_KINDS.SERVICE ? '' : line.pricing_mode,
      quantity: String(line.quantity),
      unitPrice: String(line.unit_price),
      discount: line.discount_percent ? String(line.discount_percent) : '',
    })),
  };
}

/**
 * Tell whether an order form can be sent.
 *
 * @param {object} form The form state.
 * @param {Map<string, object>} articles Article options by identifier.
 * @returns {boolean} True when every required field is filled and valid.
 */
export function isOrderFormValid(form, articles) {
  const hasCustomer =
    form.customerKind === CUSTOMER_KINDS.MEMBER
      ? Boolean(form.member)
      : requiredText(form.customerName).length >= 2;
  const hasPeriod = Boolean(form.startDate && form.endDate) && form.endDate >= form.startDate;
  const linesValid =
    form.lines.length > 0 &&
    form.lines.every((line) => {
      const quantity = Number(line.quantity);
      const common =
        Number.isInteger(quantity) &&
        quantity > 0 &&
        (line.unitPrice === '' || Number(line.unitPrice) >= 0) &&
        isValidPercent(line.discount);
      if (line.kind === LINE_KINDS.SERVICE) {
        const labelled =
          line.serviceType !== SERVICE_TYPES.OTHER || requiredText(line.label).length >= 2;
        return (
          Boolean(line.serviceType) &&
          labelled &&
          line.unitPrice !== '' &&
          Number(line.unitPrice) >= 0
        );
      }
      const article = articles.get(line.articleId);
      const priced = line.unitPrice !== '' || article?.price !== null;
      return common && Boolean(article) && priced;
    });
  const grace = form.graceDays === '' ? 0 : Number(form.graceDays);
  const graceValid = Number.isInteger(grace) && grace >= 0 && grace <= MAX_GRACE_DAYS;
  return (
    hasCustomer &&
    hasPeriod &&
    requiredText(form.eventType).length >= 2 &&
    isValidPercent(form.discount) &&
    graceValid &&
    linesValid
  );
}

/**
 * Build the payload the API expects from an order form.
 *
 * @param {object} form The form state.
 * @returns {object} The order payload.
 */
export function toOrderPayload(form) {
  const isMember = form.customerKind === CUSTOMER_KINDS.MEMBER;
  return {
    member_id: isMember ? form.member?.id ?? null : null,
    customer_name: isMember ? null : requiredText(form.customerName),
    customer_phone: optionalText(form.customerPhone),
    event_type: requiredText(form.eventType),
    start_date: form.startDate,
    end_date: form.endDate,
    discount_percent: Number(form.discount || 0),
    return_grace_days: form.graceDays === '' ? null : Number(form.graceDays),
    remarks: optionalText(form.remarks),
    lines: form.lines.map((line) => {
      const common = {
        kind: line.kind,
        quantity: Number(line.quantity),
        unit_price: line.unitPrice === '' ? null : Math.round(Number(line.unitPrice)),
        discount_percent: Number(line.discount || 0),
      };
      if (line.kind === LINE_KINDS.SERVICE) {
        return {
          ...common,
          quantity: 1,
          discount_percent: 0,
          service_type: line.serviceType,
          label: optionalText(line.label),
        };
      }
      return { ...common, article_id: line.articleId, pricing_mode: line.pricingMode || null };
    }),
  };
}

/**
 * The state of a new article form.
 *
 * @param {string} [unitId] Unit chosen by default.
 * @returns {object} The form state.
 */
export function emptyArticleForm(unitId = '') {
  return {
    reference: '',
    name: '',
    description: '',
    categoryId: '',
    unitId,
    price: '',
    replacementPrice: '',
    pricingMode: PRICING_MODES.PER_EVENT,
    isActive: true,
  };
}

/**
 * Turn an article read from the API into the form state.
 *
 * @param {object} article The article.
 * @returns {object} The form state.
 */
export function articleToForm(article) {
  return {
    reference: article.reference ?? '',
    name: article.name,
    description: article.description ?? '',
    categoryId: article.category_id ?? '',
    unitId: article.unit_id,
    price: article.price === null ? '' : String(article.price),
    replacementPrice:
      article.replacement_price === null || article.replacement_price === undefined
        ? ''
        : String(article.replacement_price),
    pricingMode: article.pricing_mode,
    isActive: article.is_active,
  };
}

/**
 * Tell whether an article form can be sent.
 *
 * @param {object} form The form state.
 * @returns {boolean} True when the name and unit are set and both prices are valid.
 */
export function isArticleFormValid(form) {
  const amountValid = (value) =>
    value === '' || value === undefined || (Number.isFinite(Number(value)) && Number(value) >= 0);
  return (
    requiredText(form.name).length >= 2 &&
    Boolean(form.unitId) &&
    amountValid(form.price) &&
    amountValid(form.replacementPrice)
  );
}

/**
 * Build the payload the API expects from an article form.
 *
 * @param {object} form The form state.
 * @param {boolean} [withStatus] Include the active flag, for an update.
 * @returns {object} The article payload.
 */
export function toArticlePayload(form, withStatus = false) {
  return {
    reference: optionalText(form.reference),
    name: requiredText(form.name),
    description: optionalText(form.description),
    category_id: form.categoryId || null,
    unit_id: form.unitId,
    price: form.price === '' ? null : Math.round(Number(form.price)),
    replacement_price:
      form.replacementPrice === '' || form.replacementPrice === undefined
        ? null
        : Math.round(Number(form.replacementPrice)),
    pricing_mode: form.pricingMode,
    ...(withStatus ? { is_active: form.isActive } : {}),
  };
}

/**
 * The state of one go of a return: one row per article line still partly out,
 * with everything still out prefilled as returned in good state.
 *
 * @param {Array<object>} lines The order lines, with what returns accounted for so far.
 * @returns {Array<object>} The return rows.
 */
export function emptyReturn(lines) {
  return lines
    .filter((line) => (line.line_kind ?? LINE_KINDS.ARTICLE) === LINE_KINDS.ARTICLE)
    .map((line) => {
      const already = (line.returned ?? 0) + (line.damaged ?? 0) + (line.lost ?? 0);
      const outstanding = line.outstanding ?? line.quantity - already;
      return {
        lineId: line.id,
        name: line.article_name,
        quantity: line.quantity,
        already,
        outstanding,
        returned: String(outstanding),
        damaged: '0',
        lost: '0',
      };
    })
    .filter((row) => row.outstanding > 0);
}

/**
 * Read the three counts of a return row as numbers.
 *
 * @param {object} row A return row.
 * @returns {{returned: number, damaged: number, lost: number}} The counts, blanks as zero.
 */
function returnCounts(row) {
  return {
    returned: Number(row.returned || 0),
    damaged: Number(row.damaged || 0),
    lost: Number(row.lost || 0),
  };
}

/**
 * Count the units of a return row that stay with the customer after this go.
 *
 * @param {object} row A return row.
 * @returns {number} Units still out once this go is recorded.
 */
export function stillOutAfter(row) {
  const { returned, damaged, lost } = returnCounts(row);
  return row.outstanding - returned - damaged - lost;
}

/**
 * Tell whether a go can be recorded.
 *
 * @param {Array<object>} rows The return rows.
 * @returns {boolean} True when every count is a whole number, no row declares
 *   more than is still out, and at least one unit is declared.
 */
export function isReturnValid(rows) {
  let declared = 0;
  const rowsValid = rows.every((row) => {
    const counts = Object.values(returnCounts(row));
    declared += counts.reduce((sum, count) => sum + count, 0);
    return counts.every((count) => Number.isInteger(count) && count >= 0) && stillOutAfter(row) >= 0;
  });
  return rowsValid && declared > 0;
}

/**
 * Build the payload of one go, sending only the lines something came back on.
 *
 * @param {Array<object>} rows The return rows.
 * @param {object} values The rest of the dialog.
 * @param {string} values.comment Free comment.
 * @param {string} values.team Who brought the material back; blank when unknown.
 * @param {string} values.returnedAt When it came back, as a datetime-local value.
 * @param {string} values.billedDays Days to bill the per-day lines on; blank for the real days.
 * @param {string} values.billedDaysReason Why the billed days differ from the real ones.
 * @returns {object} The return payload.
 */
export function toReturnPayload(rows, { comment, team, returnedAt, billedDays, billedDaysReason }) {
  return {
    lines: rows
      .map((row) => ({ line_id: row.lineId, ...returnCounts(row) }))
      .filter((line) => line.returned + line.damaged + line.lost > 0),
    comment: optionalText(comment),
    team: optionalText(team),
    returned_at: returnedAt || null,
    billed_days: billedDays === '' || billedDays === undefined ? null : Number(billedDays),
    billed_days_reason: optionalText(billedDaysReason),
  };
}

/**
 * Turn the fees proposed after a return into editable rows.
 *
 * A proposal with a figure starts selected; one without, such as a lost
 * unit of an article with no replacement price, waits for an amount.
 *
 * @param {Array<object>} proposals The proposed_charges of the return answer.
 * @returns {Array<object>} The rows.
 */
export function proposalsToRows(proposals) {
  return proposals.map((proposal, index) => ({
    key: `${proposal.order_line_id}-${proposal.kind}-${index}`,
    selected: proposal.unit_amount !== null && proposal.unit_amount !== undefined,
    kind: proposal.kind,
    label: proposal.label,
    quantity: String(proposal.quantity),
    unitAmount:
      proposal.unit_amount === null || proposal.unit_amount === undefined
        ? ''
        : String(proposal.unit_amount),
    returnId: proposal.return_id ?? null,
    orderLineId: proposal.order_line_id ?? null,
  }));
}

/**
 * An empty fee typed by hand from the order.
 *
 * @returns {object} The row.
 */
export function emptyChargeRow() {
  return {
    key: 'manual',
    selected: true,
    kind: 'OTHER',
    label: '',
    quantity: '1',
    unitAmount: '',
    returnId: null,
    orderLineId: null,
  };
}

/**
 * Work out the amount of a fee row.
 *
 * @param {object} row A fee row.
 * @returns {number} Quantity times unit amount, zero while either is blank.
 */
export function chargeRowAmount(row) {
  const quantity = Number(row.quantity || 0);
  const unitAmount = Number(row.unitAmount || 0);
  return Number.isFinite(quantity * unitAmount) ? quantity * unitAmount : 0;
}

/**
 * Tell whether one fee row can be recorded.
 *
 * @param {object} row A fee row.
 * @returns {boolean} True when it has a wording, a positive whole quantity and amount.
 */
export function isChargeRowValid(row) {
  const quantity = Number(row.quantity);
  const unitAmount = Number(row.unitAmount);
  return (
    requiredText(row.label).length >= 2 &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    Number.isInteger(unitAmount) &&
    unitAmount > 0
  );
}

/**
 * Build the fees to record from the selected rows.
 *
 * @param {Array<object>} rows The fee rows.
 * @param {string} [chargeDate] Day the fees are dated, today when blank.
 * @returns {Array<object>} The charges payload.
 */
export function toChargesPayload(rows, chargeDate = '') {
  return rows
    .filter((row) => row.selected)
    .map((row) => ({
      kind: row.kind,
      label: requiredText(row.label),
      quantity: Number(row.quantity),
      unit_amount: Number(row.unitAmount),
      charge_date: chargeDate || null,
      return_id: row.returnId,
      order_line_id: row.orderLineId,
    }));
}

/**
 * The state of the payment dialog: every element with something left is
 * ticked for its whole remainder, the common case of a customer settling all
 * at once.
 *
 * @param {Array<{value: string, balance: number}>} targets What can be paid.
 * @returns {object} The form state, items keyed by target value.
 */
export function emptyPaymentForm(targets) {
  return {
    items: Object.fromEntries(
      targets.map((target) => [target.value, { selected: true, amount: String(target.balance) }]),
    ),
    date: todayInDakar(),
    method: PAYMENT_METHODS[0],
    comment: '',
  };
}

/**
 * Add up what the ticked elements of a payment receive.
 *
 * @param {object} form The payment form state.
 * @returns {number} Total received, blanks counted as zero.
 */
export function paymentFormTotal(form) {
  return Object.values(form.items)
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

/**
 * Tell whether a payment can be recorded.
 *
 * @param {object} form The payment form state.
 * @param {Array<{value: string, balance: number}>} targets What can be paid.
 * @returns {boolean} True when at least one element is ticked and each ticked
 *   amount is a positive whole number within what remains of it.
 */
export function isPaymentFormValid(form, targets) {
  const ticked = targets.filter((target) => form.items[target.value]?.selected);
  return (
    ticked.length > 0 &&
    ticked.every((target) => {
      const amount = Number(form.items[target.value].amount);
      return Number.isInteger(amount) && amount > 0 && amount <= target.balance;
    })
  );
}

/**
 * Build the payload of a payment: one item per ticked element.
 *
 * @param {object} form The payment form state.
 * @returns {object} The payment payload.
 */
export function toPaymentPayload(form) {
  return {
    items: Object.entries(form.items)
      .filter(([, item]) => item.selected)
      .map(([value, item]) => ({
        charge_id: value === RENTAL_PAYMENT_TARGET ? null : value,
        amount: Number(item.amount),
      })),
    payment_date: form.date || null,
    method: form.method,
    comment: optionalText(form.comment),
  };
}

/**
 * Display name of a member offered as a customer.
 *
 * @param {object} member The member option.
 * @returns {string} First and last name.
 */
export function memberName(member) {
  return `${member.first_name} ${member.last_name}`.trim();
}

/**
 * The first and last day of the current month in Dakar, the default period.
 *
 * @returns {{dateFrom: string, dateTo: string}} The period, as YYYY-MM-DD.
 */
export function currentMonthPeriod() {
  const today = todayInDakar();
  const [year, month] = today.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return { dateFrom: `${prefix}-01`, dateTo: `${prefix}-${String(lastDay).padStart(2, '0')}` };
}

/**
 * Read a period from the from/to query parameters, the current month when either is missing or malformed.
 *
 * @param {URLSearchParams} params Query parameters of the page.
 * @returns {{dateFrom: string, dateTo: string}} The period.
 */
export function periodFromSearch(params) {
  const isoDay = /^\d{4}-\d{2}-\d{2}$/;
  const dateFrom = params.get('from');
  const dateTo = params.get('to');
  if (isoDay.test(dateFrom ?? '') && isoDay.test(dateTo ?? '') && dateFrom <= dateTo) {
    return { dateFrom, dateTo };
  }
  return currentMonthPeriod();
}

/**
 * Tell whether a period can be asked for.
 *
 * @param {{dateFrom: string, dateTo: string}} period The period.
 * @returns {boolean} True when both days are set and in order.
 */
export function isValidPeriod(period) {
  return Boolean(period.dateFrom && period.dateTo) && period.dateFrom <= period.dateTo;
}
