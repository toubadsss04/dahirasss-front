import { CUSTOMER_KINDS, PRICING_MODES } from '../constants/rental';
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
 * Move an order one step: confirm it or hand its material out.
 *
 * @param {string} orderId Identifier.
 * @param {'confirm'|'check-out'} step The step.
 * @returns {Promise<object>} The order.
 */
export async function advanceRentalOrder(orderId, step) {
  const { data } = await apiClient.post(`/rental/orders/${orderId}/${step}`);
  return data;
}

/**
 * Take the material of an order back.
 *
 * @param {string} orderId Identifier.
 * @param {{lines: Array<object>, comment?: string|null}} payload How each line came back.
 * @returns {Promise<object>} The order.
 */
export async function returnRentalOrder(orderId, payload) {
  const { data } = await apiClient.post(`/rental/orders/${orderId}/return`, payload);
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
 * @param {object} payload Amount, date, method and comment.
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
 * A blank order line.
 *
 * @returns {object} The line state.
 */
export function emptyOrderLine() {
  return { articleId: '', quantity: '1', unitPrice: '', discount: '' };
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
    remarks: order.remarks ?? '',
    lines: order.lines.map((line) => ({
      articleId: line.article_id,
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
      const article = articles.get(line.articleId);
      const quantity = Number(line.quantity);
      const priced = line.unitPrice !== '' || article?.price !== null;
      return (
        Boolean(article) &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        priced &&
        (line.unitPrice === '' || Number(line.unitPrice) >= 0) &&
        isValidPercent(line.discount)
      );
    });
  return (
    hasCustomer &&
    hasPeriod &&
    requiredText(form.eventType).length >= 2 &&
    isValidPercent(form.discount) &&
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
    remarks: optionalText(form.remarks),
    lines: form.lines.map((line) => ({
      article_id: line.articleId,
      quantity: Number(line.quantity),
      unit_price: line.unitPrice === '' ? null : Math.round(Number(line.unitPrice)),
      discount_percent: Number(line.discount || 0),
    })),
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
    pricingMode: article.pricing_mode,
    isActive: article.is_active,
  };
}

/**
 * Tell whether an article form can be sent.
 *
 * @param {object} form The form state.
 * @returns {boolean} True when the name and unit are set and the price is valid.
 */
export function isArticleFormValid(form) {
  const price = form.price === '' || (Number.isFinite(Number(form.price)) && Number(form.price) >= 0);
  return requiredText(form.name).length >= 2 && Boolean(form.unitId) && price;
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
    pricing_mode: form.pricingMode,
    ...(withStatus ? { is_active: form.isActive } : {}),
  };
}

/**
 * The state of a return, one row per order line, all returned in good state.
 *
 * @param {Array<object>} lines The order lines.
 * @returns {Array<object>} The return rows.
 */
export function emptyReturn(lines) {
  return lines.map((line) => ({
    lineId: line.id,
    name: line.article_name,
    quantity: line.quantity,
    damaged: '0',
    lost: '0',
  }));
}

/**
 * Tell whether every row of a return accounts for its units.
 *
 * @param {Array<object>} rows The return rows.
 * @returns {boolean} True when damaged and lost never exceed what went out.
 */
export function isReturnValid(rows) {
  return rows.every((row) => {
    const damaged = Number(row.damaged || 0);
    const lost = Number(row.lost || 0);
    return (
      Number.isInteger(damaged) &&
      Number.isInteger(lost) &&
      damaged >= 0 &&
      lost >= 0 &&
      damaged + lost <= row.quantity
    );
  });
}

/**
 * Build the payload of a return, sending only the lines that did not come back whole.
 *
 * @param {Array<object>} rows The return rows.
 * @param {string} comment Free comment.
 * @returns {object} The return payload.
 */
export function toReturnPayload(rows, comment) {
  return {
    lines: rows
      .filter((row) => Number(row.damaged || 0) + Number(row.lost || 0) > 0)
      .map((row) => {
        const damaged = Number(row.damaged || 0);
        const lost = Number(row.lost || 0);
        return {
          line_id: row.lineId,
          returned: row.quantity - damaged - lost,
          damaged,
          lost,
        };
      }),
    comment: optionalText(comment),
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
 * Tell whether a period can be asked for.
 *
 * @param {{dateFrom: string, dateTo: string}} period The period.
 * @returns {boolean} True when both days are set and in order.
 */
export function isValidPeriod(period) {
  return Boolean(period.dateFrom && period.dateTo) && period.dateFrom <= period.dateTo;
}
