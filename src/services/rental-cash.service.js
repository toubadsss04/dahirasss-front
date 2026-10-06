import { amountValue, isValidAmount, requiredText } from '../utils/formChanges';
import { todayInDakar } from '../utils/format';
import { apiClient } from './apiClient';

/**
 * Read the balance of the rental business since it started, whatever period is on screen.
 *
 * @returns {Promise<{balance: number, income: number, expenses: number}>} The balance.
 */
export async function fetchRentalBalance() {
  const { data } = await apiClient.get('/rental/balance');
  return data;
}

/**
 * List every month of the cash book, latest first.
 *
 * @returns {Promise<Array<object>>} The months, with opening, income, expenses and closing.
 */
export async function fetchRentalPeriods() {
  const { data } = await apiClient.get('/rental/periods');
  return data;
}

/**
 * Close a month, freezing its figures.
 *
 * @param {string} month First day of the month, as YYYY-MM-DD.
 * @returns {Promise<object>} The closed month.
 */
export async function closeRentalPeriod(month) {
  const { data } = await apiClient.post(`/rental/periods/${month}/close`);
  return data;
}

/**
 * Reopen the latest closed month.
 *
 * @param {string} month First day of the month, as YYYY-MM-DD.
 * @param {string} reason Why it is reopened.
 * @returns {Promise<object>} The reopened month.
 */
export async function reopenRentalPeriod(month, reason) {
  const { data } = await apiClient.post(`/rental/periods/${month}/reopen`, { reason });
  return data;
}

/**
 * Type the opening balance of an open month, or give it back its carried value.
 *
 * @param {string} month First day of the month, as YYYY-MM-DD.
 * @param {{amount: number|null, reason: string}} payload Amount, null to carry the previous closing.
 * @returns {Promise<object>} The month.
 */
export async function setRentalOpeningBalance(month, payload) {
  const { data } = await apiClient.put(`/rental/periods/${month}/opening-balance`, payload);
  return data;
}

/**
 * List the categories of rental expenses.
 *
 * @returns {Promise<Array<object>>} The categories, with their expense counts.
 */
export async function fetchRentalExpenseCategories() {
  const { data } = await apiClient.get('/rental/expense-categories');
  return data;
}

/**
 * Create a category of rental expenses.
 *
 * @param {{name: string}} payload The category.
 * @returns {Promise<object>} The created category.
 */
export async function createRentalExpenseCategory(payload) {
  const { data } = await apiClient.post('/rental/expense-categories', payload);
  return data;
}

/**
 * Rename a category of rental expenses, or switch it on or off.
 *
 * @param {string} categoryId Identifier.
 * @param {object} payload Fields to change.
 * @returns {Promise<object>} The category.
 */
export async function updateRentalExpenseCategory(categoryId, payload) {
  const { data } = await apiClient.patch(`/rental/expense-categories/${categoryId}`, payload);
  return data;
}

/**
 * Delete a category no expense was ever filed under.
 *
 * @param {string} categoryId Identifier.
 * @returns {Promise<void>} Resolves once deleted.
 */
export async function deleteRentalExpenseCategory(categoryId) {
  await apiClient.delete(`/rental/expense-categories/${categoryId}`);
}

/**
 * List rental expenses, newest first.
 *
 * @param {object} [params] Filters: status, category_id, date_from, date_to, limit, offset.
 * @returns {Promise<{items: Array<object>, total: number, active_total: number}>} A page.
 */
export async function fetchRentalExpenses(params = {}) {
  const { data } = await apiClient.get('/rental/expenses', { params });
  return data;
}

/**
 * Record a rental expense.
 *
 * @param {object} payload The expense.
 * @returns {Promise<object>} The created expense.
 */
export async function createRentalExpense(payload) {
  const { data } = await apiClient.post('/rental/expenses', payload);
  return data;
}

/**
 * Correct an active rental expense.
 *
 * @param {string} expenseId Identifier.
 * @param {object} payload Fields to change.
 * @returns {Promise<object>} The expense.
 */
export async function updateRentalExpense(expenseId, payload) {
  const { data } = await apiClient.patch(`/rental/expenses/${expenseId}`, payload);
  return data;
}

/**
 * Cancel a rental expense. It stays in the history.
 *
 * @param {string} expenseId Identifier.
 * @param {string} reason Why it is cancelled.
 * @returns {Promise<object>} The expense.
 */
export async function cancelRentalExpense(expenseId, reason) {
  const { data } = await apiClient.post(`/rental/expenses/${expenseId}/cancel`, { reason });
  return data;
}

/**
 * Blank expense form, dated today.
 *
 * @param {string} [categoryId] Category preselected.
 * @returns {object} The form state.
 */
export function emptyExpenseForm(categoryId = '') {
  return {
    id: null,
    categoryId,
    amount: '',
    date: todayInDakar(),
    method: 'CASH',
    description: '',
  };
}

/**
 * Form state of an existing expense.
 *
 * @param {object} expense The expense as the API returns it.
 * @returns {object} The form state.
 */
export function expenseToForm(expense) {
  return {
    id: expense.id,
    categoryId: expense.category_id,
    amount: String(expense.amount),
    date: expense.expense_date,
    method: expense.method,
    description: expense.description,
  };
}

/**
 * Tell whether an expense form can be sent.
 *
 * @param {object} form The form state.
 * @returns {boolean} True when category, amount, date and description are set.
 */
export function isExpenseFormValid(form) {
  return (
    Boolean(form.categoryId) &&
    isValidAmount(form.amount) &&
    Number.isInteger(Number(form.amount)) &&
    Boolean(form.date) &&
    requiredText(form.description).length >= 2
  );
}

/**
 * Turn an expense form into the API payload.
 *
 * @param {object} form The form state.
 * @returns {object} The payload.
 */
export function toExpensePayload(form) {
  return {
    category_id: form.categoryId,
    amount: amountValue(form.amount),
    expense_date: form.date,
    method: form.method,
    description: requiredText(form.description),
  };
}
