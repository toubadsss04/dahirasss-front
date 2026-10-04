import { GAMOU_POT, MIN_LABEL_LENGTH, POT_FILTERS } from '../constants/finance';
import {
  amountValue,
  buildChanges,
  isValidAmount,
  optionalText,
  requiredDate,
  requiredText,
} from '../utils/formChanges';
import { apiClient } from './apiClient';

/* ---------- Exercices ---------- */

/**
 * Read one exercise.
 *
 * @param {string} exerciseId Identifier.
 * @returns {Promise<object>} The exercise.
 */
export async function fetchExercise(exerciseId) {
  const { data } = await apiClient.get(`/exercises/${exerciseId}`);
  return data;
}

/**
 * Read the financial position of an exercise.
 *
 * @param {string} exerciseId Identifier.
 * @returns {Promise<object>} The recap.
 */
export async function fetchExerciseSummary(exerciseId) {
  const { data } = await apiClient.get(`/exercises/${exerciseId}/summary`);
  return data;
}

/**
 * Create an exercise in draft state.
 *
 * @param {object} payload Name, year and dates.
 * @returns {Promise<object>} The created exercise.
 */
export async function createExercise(payload) {
  const { data } = await apiClient.post('/exercises', payload);
  return data;
}

/**
 * Move a draft exercise into the open state.
 *
 * @param {string} exerciseId Identifier.
 * @returns {Promise<object>} The opened exercise.
 */
export async function openExercise(exerciseId) {
  const { data } = await apiClient.post(`/exercises/${exerciseId}/open`);
  return data;
}

/**
 * Close an exercise.
 *
 * @param {string} exerciseId Identifier.
 * @returns {Promise<object>} The final position.
 */
export async function closeExercise(exerciseId) {
  const { data } = await apiClient.post(`/exercises/${exerciseId}/close`);
  return data;
}

/**
 * Reopen a closed exercise. The reason is mandatory.
 *
 * @param {string} exerciseId Identifier.
 * @param {string} reason Why the exercise is reopened.
 * @returns {Promise<object>} The reopened exercise.
 */
export async function reopenExercise(exerciseId, reason) {
  const { data } = await apiClient.post(`/exercises/${exerciseId}/reopen`, { reason });
  return data;
}

/**
 * State the money held when an exercise starts without a carried balance.
 *
 * @param {string} exerciseId Identifier.
 * @param {{amount: number, reason: string}} payload The amount and where it comes from.
 * @returns {Promise<object>} The exercise.
 */
export async function setOpeningBalance(exerciseId, payload) {
  const { data } = await apiClient.put(`/exercises/${exerciseId}/opening-balance`, payload);
  return data;
}

/**
 * Carry the closing balance into another exercise.
 *
 * @param {string} exerciseId Source exercise.
 * @param {object} payload Target exercise and note.
 * @returns {Promise<object>} The carried balance.
 */
export async function transferBalance(exerciseId, payload) {
  const { data } = await apiClient.post(`/exercises/${exerciseId}/transfer`, payload);
  return data;
}

/**
 * Read the carried balance an exercise received.
 *
 * @param {string} exerciseId Identifier.
 * @returns {Promise<object|null>} The carried balance, or null.
 */
export async function fetchIncomingTransfer(exerciseId) {
  const { data } = await apiClient.get(`/exercises/${exerciseId}/transfer`);
  return data;
}

/* ---------- Rencontres ---------- */

/**
 * List meetings.
 *
 * @param {object} [params] Filters and pagination.
 * @returns {Promise<{items: Array<object>, total: number}>} A page of meetings.
 */
export async function fetchMeetings(params = {}) {
  const { data } = await apiClient.get('/meetings', { params });
  return data;
}

/**
 * Read one meeting.
 *
 * @param {string} meetingId Identifier.
 * @returns {Promise<object>} The meeting.
 */
export async function fetchMeeting(meetingId) {
  const { data } = await apiClient.get(`/meetings/${meetingId}`);
  return data;
}

/**
 * Create a meeting of the whole Dahira.
 *
 * @param {object} payload Exercise, date and subject.
 * @returns {Promise<object>} The created meeting.
 */
export async function createMeeting(payload) {
  const { data } = await apiClient.post('/meetings', payload);
  return data;
}

/**
 * Cancel a meeting.
 *
 * @param {string} meetingId Identifier.
 * @param {string} reason Why the meeting is cancelled.
 * @returns {Promise<object>} The cancelled meeting.
 */
export async function cancelMeeting(meetingId, reason) {
  const { data } = await apiClient.post(`/meetings/${meetingId}/cancel`, { reason });
  return data;
}

/**
 * List everything given at a meeting, to the Gamou pot and to projects.
 *
 * @param {string} meetingId Identifier.
 * @returns {Promise<Array<object>>} Every gift, cancelled ones included.
 */
export async function fetchMeetingGifts(meetingId) {
  const { data } = await apiClient.get(`/meetings/${meetingId}/gifts`);
  return data;
}

/**
 * List the pots a meeting may collect for: its Gamou and the open projects.
 *
 * @param {string} meetingId Identifier.
 * @returns {Promise<Array<object>>} The pots, the Gamou first.
 */
export async function fetchGiftTargets(meetingId) {
  const { data } = await apiClient.get(`/meetings/${meetingId}/gift-targets`);
  return data;
}

/**
 * Record everything one member gave at a meeting, all or nothing.
 *
 * @param {string} meetingId Identifier.
 * @param {{member_id: string, lines: Array<object>}} payload The member and one line per pot.
 * @returns {Promise<Array<object>>} Every gift of the meeting after recording.
 */
export async function recordMeetingGifts(meetingId, payload) {
  const { data } = await apiClient.post(`/meetings/${meetingId}/gifts`, payload);
  return data;
}

/**
 * Key identifying the pot of a gift line or of a pot offered by a meeting.
 *
 * @param {{target: string, project_id?: string|null}} item A gift, a line or a pot.
 * @returns {string} The Gamou pot, or the project it names.
 */
export function giftTargetKey(item) {
  return item.target === 'PROJECT' ? `PROJECT:${item.project_id}` : 'GAMOU';
}

/**
 * Turn the lines typed for one member into the payload the API expects.
 *
 * Lines without a pot or with no amount are left out, so an empty row added
 * by mistake never blocks the others.
 *
 * @param {string} memberId The member who gave.
 * @param {Array<{targetKey: string, amount: string}>} lines What was typed.
 * @returns {{member_id: string, lines: Array<object>}} The payload.
 */
export function toGiftBatch(memberId, lines) {
  return {
    member_id: memberId,
    lines: lines
      .filter((line) => line.targetKey && Number(line.amount) > 0)
      .map((line) => {
        const amount = Math.round(Number(line.amount));
        if (line.targetKey === 'GAMOU') return { target: 'GAMOU', amount };
        return {
          target: 'PROJECT',
          project_id: line.targetKey.slice('PROJECT:'.length),
          amount,
        };
      }),
  };
}

/**
 * Sum the active gifts of a meeting per pot, in the order the pots come.
 *
 * @param {Array<object>} gifts Every gift of the meeting.
 * @returns {Array<{key: string, label: string, isGamou: boolean, total: number}>} One row per pot.
 */
export function totalsByTarget(gifts) {
  const totals = new Map();
  gifts
    .filter((gift) => gift.status === 'ACTIVE')
    .forEach((gift) => {
      const key = giftTargetKey(gift);
      const current = totals.get(key) ?? {
        key,
        label: gift.target_label,
        isGamou: gift.is_gamou,
        total: 0,
      };
      current.total += gift.amount;
      totals.set(key, current);
    });
  return [...totals.values()];
}

/* ---------- Contributions ---------- */

/**
 * List contributions.
 *
 * @param {object} [params] Filters and pagination.
 * @returns {Promise<{items: Array<object>, total: number}>} A page of contributions.
 */
export async function fetchContributions(params = {}) {
  const { data } = await apiClient.get('/contributions', { params });
  return data;
}

/**
 * Record a contribution.
 *
 * @param {object} payload Meeting, member and amount.
 * @returns {Promise<object>} The created contribution.
 */
export async function createContribution(payload) {
  const { data } = await apiClient.post('/contributions', payload);
  return data;
}

/**
 * Correct a contribution.
 *
 * @param {string} contributionId Identifier.
 * @param {object} payload Fields to change and reason.
 * @returns {Promise<object>} The updated contribution.
 */
export async function updateContribution(contributionId, payload) {
  const { data } = await apiClient.patch(`/contributions/${contributionId}`, payload);
  return data;
}

/**
 * Cancel a contribution.
 *
 * @param {string} contributionId Identifier.
 * @param {string} reason Why the contribution is cancelled.
 * @returns {Promise<object>} The cancelled contribution.
 */
export async function cancelContribution(contributionId, reason) {
  const { data } = await apiClient.post(`/contributions/${contributionId}/cancel`, {
    reason,
  });
  return data;
}

/**
 * Put a contribution in the shape of the entry form.
 *
 * Only the amount is correctable: the member is fixed once the contribution
 * is recorded, and correcting it means cancelling and recording it again.
 *
 * @param {object} contribution The contribution as returned by the API.
 * @returns {{amount: string}} The form values.
 */
export function toContributionForm(contribution) {
  return { amount: String(contribution.amount) };
}

/**
 * Build the partial update of a contribution from the fields that changed.
 *
 * @param {ReturnType<typeof toContributionForm>} initial The form as it was opened.
 * @param {ReturnType<typeof toContributionForm>} form The form as it stands.
 * @returns {object} Only the changed fields, in API form.
 */
export function toContributionUpdate(initial, form) {
  return buildChanges(initial, form, { amount: amountValue });
}

/* ---------- Barkelou ---------- */

/**
 * List Barkelou.
 *
 * @param {object} [params] Filters and pagination.
 * @returns {Promise<{items: Array<object>, total: number}>} A page of donations.
 */
export async function fetchDonations(params = {}) {
  const { data } = await apiClient.get('/donations', { params });
  return data;
}

/**
 * Record a Barkelou.
 *
 * @param {object} payload Exercise, donor and amount.
 * @returns {Promise<object>} The created donation.
 */
export async function createDonation(payload) {
  const { data } = await apiClient.post('/donations', payload);
  return data;
}

/**
 * Cancel a Barkelou.
 *
 * @param {string} donationId Identifier.
 * @param {string} reason Why the donation is cancelled.
 * @returns {Promise<object>} The cancelled donation.
 */
export async function cancelDonation(donationId, reason) {
  const { data } = await apiClient.post(`/donations/${donationId}/cancel`, { reason });
  return data;
}

/**
 * Correct a Barkelou.
 *
 * @param {string} donationId Identifier.
 * @param {object} payload Only the fields to change.
 * @returns {Promise<object>} The corrected donation.
 */
export async function updateDonation(donationId, payload) {
  const { data } = await apiClient.patch(`/donations/${donationId}`, payload);
  return data;
}

/** How each correctable Barkelou field is sent to the API. */
const DONATION_CONVERTERS = {
  donor_name: requiredText,
  amount: amountValue,
  donation_date: requiredDate,
  comment: optionalText,
};

/**
 * Key of the pot an operation went to: the Gamou, or the project it names.
 *
 * @param {{project_id?: string|null}} operation An expense, a gift or a form.
 * @returns {string} The Gamou key, or the project identifier.
 */
export function potKey(operation) {
  return operation.project_id || GAMOU_POT;
}

/**
 * Turn the pot chosen on a form into what the API files the operation under.
 *
 * A project brings its own exercise when it is tied to a Gamou, so only the
 * Gamou itself is sent with the exercise.
 *
 * @param {string} pot The pot key chosen.
 * @param {string} exerciseId The exercise selected in the interface.
 * @returns {{exercise_id?: string, project_id?: string}} The pot fields.
 */
export function potFields(pot, exerciseId) {
  return pot === GAMOU_POT ? { exercise_id: exerciseId } : { project_id: pot };
}

/**
 * Turn the pot filter of a listing into the API parameters.
 *
 * The Gamou and its projects are read on the selected exercise; the projects
 * standing apart belong to none.
 *
 * @param {string} filter One of the pot filters, or empty for every pot of the exercise.
 * @param {string} exerciseId The exercise selected in the interface.
 * @returns {object} Query parameters.
 */
export function potFilterParams(filter, exerciseId) {
  if (filter === POT_FILTERS.APART) return { gamou: false };
  return { exercise_id: exerciseId };
}

/**
 * Keep the rows a pot filter designates, among those read on the exercise.
 *
 * @param {Array<object>} rows Operations returned by the API.
 * @param {string} filter The pot filter chosen.
 * @returns {Array<object>} The rows to show.
 */
export function filterByPot(rows, filter) {
  if (filter === POT_FILTERS.GAMOU) return rows.filter((row) => !row.project_id);
  if (filter === POT_FILTERS.PROJECTS) return rows.filter((row) => Boolean(row.project_id));
  return rows;
}

/**
 * The pots an expense or a gift of the selected exercise can go to.
 *
 * The Gamou of the exercise comes first, then every open project that counts
 * in this exercise or stands apart from any Gamou. A project tied to another
 * Gamou is left out, since its money belongs to that other exercise.
 *
 * @param {Array<object>} projects Open projects as returned by the API.
 * @param {string} exerciseId The exercise selected in the interface.
 * @returns {Array<{value: string, project: object|null}>} The pots, the Gamou first.
 */
export function availablePots(projects, exerciseId) {
  return [
    { value: GAMOU_POT, project: null },
    ...projects
      .filter((project) => !project.exercise_id || project.exercise_id === exerciseId)
      .map((project) => ({ value: project.id, project })),
  ];
}

/**
 * Put a Barkelou in the shape of the entry form.
 *
 * @param {object} donation The donation as returned by the API.
 * @returns {object} The form values, every field as the inputs hold it.
 */
export function toDonationForm(donation) {
  return {
    pot: potKey(donation),
    donor_name: donation.donor_name ?? '',
    amount: String(donation.amount),
    donation_date: donation.donation_date ?? '',
    comment: donation.comment ?? '',
  };
}

/**
 * Tell whether a Barkelou entry can be sent, on creation as on correction.
 *
 * @param {ReturnType<typeof toDonationForm>} form The form as it stands.
 * @returns {boolean} True when every mandatory field holds a usable value.
 */
export function isDonationFormValid(form) {
  return (
    Boolean(form.pot) &&
    form.donor_name.trim().length >= MIN_LABEL_LENGTH &&
    isValidAmount(form.amount) &&
    Boolean(form.donation_date)
  );
}

/**
 * Build the partial update of a Barkelou from the fields that changed.
 *
 * The pot is not corrected: a gift filed in the wrong pot is cancelled and
 * recorded again, which keeps both facts in the trail.
 *
 * @param {ReturnType<typeof toDonationForm>} initial The form as it was opened.
 * @param {ReturnType<typeof toDonationForm>} form The form as it stands.
 * @returns {object} Only the changed fields, in API form.
 */
export function toDonationUpdate(initial, form) {
  return buildChanges(initial, form, DONATION_CONVERTERS);
}

/* ---------- Dépenses ---------- */

/**
 * List expense categories.
 *
 * @param {boolean} [onlyActive] Restrict to active categories.
 * @returns {Promise<Array<object>>} The categories.
 */
export async function fetchExpenseCategories(onlyActive = false) {
  const { data } = await apiClient.get('/expense-categories', {
    params: { only_active: onlyActive },
  });
  return data;
}

/**
 * Create an expense category.
 *
 * @param {string} name Category name.
 * @returns {Promise<object>} The created category.
 */
export async function createExpenseCategory(name) {
  const { data } = await apiClient.post('/expense-categories', { name });
  return data;
}

/**
 * List expenses.
 *
 * @param {object} [params] Filters and pagination.
 * @returns {Promise<{items: Array<object>, total: number}>} A page of expenses.
 */
export async function fetchExpenses(params = {}) {
  const { data } = await apiClient.get('/expenses', { params });
  return data;
}

/**
 * Record an expense.
 *
 * @param {object} payload Exercise, category, scope and amount.
 * @returns {Promise<object>} The created expense.
 */
export async function createExpense(payload) {
  const { data } = await apiClient.post('/expenses', payload);
  return data;
}

/**
 * Cancel an expense.
 *
 * @param {string} expenseId Identifier.
 * @param {string} reason Why the expense is cancelled.
 * @returns {Promise<object>} The cancelled expense.
 */
export async function cancelExpense(expenseId, reason) {
  const { data } = await apiClient.post(`/expenses/${expenseId}/cancel`, { reason });
  return data;
}

/**
 * Correct an expense.
 *
 * @param {string} expenseId Identifier.
 * @param {object} payload Only the fields to change.
 * @returns {Promise<object>} The corrected expense.
 */
export async function updateExpense(expenseId, payload) {
  const { data } = await apiClient.patch(`/expenses/${expenseId}`, payload);
  return data;
}

/**
 * How each correctable expense field is sent to the API.
 *
 * The pot is left out on purpose: the API does not move an expense from one
 * pot to another.
 */
const EXPENSE_CONVERTERS = {
  category_id: (value) => value,
  amount: amountValue,
  expense_date: requiredDate,
  description: requiredText,
};

/**
 * Put an expense in the shape of the entry form.
 *
 * @param {object} expense The expense as returned by the API.
 * @returns {object} The form values, every field as the inputs hold it.
 */
export function toExpenseForm(expense) {
  return {
    pot: potKey(expense),
    category_id: expense.category_id ?? '',
    amount: String(expense.amount),
    expense_date: expense.expense_date ?? '',
    description: expense.description ?? '',
  };
}

/**
 * Tell whether an expense entry can be sent, on creation as on correction.
 *
 * @param {ReturnType<typeof toExpenseForm>} form The form as it stands.
 * @returns {boolean} True when every mandatory field holds a usable value.
 */
export function isExpenseFormValid(form) {
  return (
    Boolean(form.pot) &&
    Boolean(form.category_id) &&
    isValidAmount(form.amount) &&
    Boolean(form.expense_date) &&
    form.description.trim().length >= MIN_LABEL_LENGTH
  );
}

/**
 * Build the partial update of an expense from the fields that changed.
 *
 * @param {ReturnType<typeof toExpenseForm>} initial The form as it was opened.
 * @param {ReturnType<typeof toExpenseForm>} form The form as it stands.
 * @returns {object} Only the changed fields, in API form.
 */
export function toExpenseUpdate(initial, form) {
  return buildChanges(initial, form, EXPENSE_CONVERTERS);
}
