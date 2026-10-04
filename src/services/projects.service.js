import { CONTRIBUTOR_KINDS, MIN_NAME_LENGTH } from '../constants/projects';
import {
  amountValue,
  buildChanges,
  isValidAmount,
  optionalText,
  requiredDate,
  requiredText,
} from '../utils/formChanges';
import { SHARE_MODES } from '../constants/projects';
import { todayInDakar } from '../utils/format';
import { apiClient } from './apiClient';

/**
 * List projects, newest first, one page at a time.
 *
 * @param {{year?: number, status?: string, search?: string, limit?: number, offset?: number}} [params]
 *   Filters and pagination.
 * @returns {Promise<{items: Array<object>, total: number}>} A page of projects.
 */
export async function fetchProjects(params = {}) {
  const { data } = await apiClient.get('/projects', { params });
  return data;
}

/**
 * List the years in which projects were created, most recent first.
 *
 * @returns {Promise<number[]>} The years.
 */
export async function fetchProjectYears() {
  const { data } = await apiClient.get('/projects/years');
  return data;
}

/**
 * Read one project with its collected totals.
 *
 * @param {string} projectId Identifier.
 * @returns {Promise<object>} The project.
 */
export async function fetchProject(projectId) {
  const { data } = await apiClient.get(`/projects/${projectId}`);
  return data;
}

/**
 * Create a project.
 *
 * @param {object} payload Name, description, cost and share per member.
 * @returns {Promise<object>} The created project.
 */
export async function createProject(payload) {
  const { data } = await apiClient.post('/projects', payload);
  return data;
}

/**
 * Correct a project.
 *
 * @param {string} projectId Identifier.
 * @param {object} payload Only the fields to change.
 * @returns {Promise<object>} The corrected project.
 */
export async function updateProject(projectId, payload) {
  const { data } = await apiClient.patch(`/projects/${projectId}`, payload);
  return data;
}

/**
 * Close a project.
 *
 * @param {string} projectId Identifier.
 * @param {{reason: string, closed_amount: number}} payload Reason and final amount.
 * @returns {Promise<object>} The closed project.
 */
export async function closeProject(projectId, payload) {
  const { data } = await apiClient.post(`/projects/${projectId}/close`, payload);
  return data;
}

/**
 * List the people who gave to a project.
 *
 * @param {string} projectId Identifier.
 * @param {{search?: string, limit?: number, offset?: number}} [params] Search and pagination.
 * @returns {Promise<{items: Array<object>, total: number}>} A page of contributors.
 */
export async function fetchProjectContributors(projectId, params = {}) {
  const { data } = await apiClient.get(`/projects/${projectId}/contributors`, { params });
  return data;
}

/**
 * List every payment of one contributor.
 *
 * @param {string} projectId Project identifier.
 * @param {string} contributorId Contributor identifier.
 * @returns {Promise<Array<object>>} The payments, newest first.
 */
export async function fetchContributorPayments(projectId, contributorId) {
  const { data } = await apiClient.get(
    `/projects/${projectId}/contributors/${contributorId}/payments`,
  );
  return data;
}

/**
 * List every active member, whatever their daara, to choose a contributor.
 *
 * Projects belong to the whole Daara, so this list is not narrowed to the
 * daaras of the account, unlike the member pages.
 *
 * @returns {Promise<Array<object>>} The members with their daara name.
 */
export async function fetchProjectMemberOptions() {
  const { data } = await apiClient.get('/projects/member-options');
  return data;
}

/**
 * Find recent payments that look like the one about to be recorded.
 *
 * @param {string} projectId Identifier.
 * @param {object} payload The payment as it would be sent.
 * @returns {Promise<Array<object>>} Same contributor, same amount, close in time.
 */
export async function fetchSimilarPayments(projectId, payload) {
  const { data } = await apiClient.post(`/projects/${projectId}/payments/similar`, payload);
  return data;
}

/**
 * Record a payment towards a project.
 *
 * @param {string} projectId Identifier.
 * @param {object} payload Contributor designation, amount and date.
 * @returns {Promise<object>} The recorded payment.
 */
export async function createProjectPayment(projectId, payload) {
  const { data } = await apiClient.post(`/projects/${projectId}/payments`, payload);
  return data;
}

/**
 * Correct a payment typed wrongly.
 *
 * @param {string} projectId Project identifier.
 * @param {string} paymentId Payment identifier.
 * @param {object} payload Only the fields to change.
 * @returns {Promise<object>} The corrected payment.
 */
export async function updateProjectPayment(projectId, paymentId, payload) {
  const { data } = await apiClient.patch(
    `/projects/${projectId}/payments/${paymentId}`,
    payload,
  );
  return data;
}

/**
 * Cancel a payment.
 *
 * @param {string} projectId Project identifier.
 * @param {string} paymentId Payment identifier.
 * @param {string} reason Why the payment is cancelled.
 * @returns {Promise<object>} The cancelled payment.
 */
export async function cancelProjectPayment(projectId, paymentId, reason) {
  const { data } = await apiClient.post(
    `/projects/${projectId}/payments/${paymentId}/cancel`,
    { reason },
  );
  return data;
}

/**
 * Turn an optional amount typed as digits into its API value.
 *
 * @param {string} value The digits as typed.
 * @returns {number|null} The amount, or null when the field is empty.
 */
function optionalAmount(value) {
  return value === '' || value == null ? null : amountValue(value);
}

/**
 * Tell whether an optional amount field holds something acceptable.
 *
 * @param {string} value The digits as typed.
 * @returns {boolean} True when empty or a positive amount.
 */
function isOptionalAmountValid(value) {
  return value === '' || isValidAmount(value);
}

/**
 * Turn an optional choice into its API value.
 *
 * @param {string} value The identifier chosen, or an empty string.
 * @returns {string|null} The identifier, or null when nothing is chosen.
 */
function optionalId(value) {
  return value || null;
}

/**
 * How each project field is sent to the API.
 *
 * The share asked of members is left out: it is one choice spread over
 * several inputs, and is sent whole by shareFields.
 */
const PROJECT_CONVERTERS = {
  name: requiredText,
  description: optionalText,
  cost: optionalAmount,
  exercise_id: optionalId,
};

/**
 * Turn the share typed on the form into its API fields.
 *
 * A share for everyone clears the amounts per category, and amounts per
 * category clear the share for everyone, so both fields are always sent.
 * A category left empty asks nothing of its members.
 *
 * @param {object} form The project form.
 * @returns {{amount_per_member: number|null, category_amounts: Array<object>}} The share.
 */
function shareFields(form) {
  if (form.share_mode === SHARE_MODES.CATEGORY) {
    return {
      amount_per_member: null,
      category_amounts: Object.entries(form.category_amounts)
        .filter(([, amount]) => amount !== '')
        .map(([entityId, amount]) => ({ entity_id: entityId, amount: amountValue(amount) })),
    };
  }
  return { amount_per_member: optionalAmount(form.amount_per_member), category_amounts: [] };
}

/**
 * The exercises a project can be tied to: every one not yet closed.
 *
 * @param {Array<object>} exercises Every exercise loaded.
 * @returns {Array<{value: string, label: string}>} Choices for the form.
 */
export function gamouExerciseOptions(exercises = []) {
  return exercises
    .filter((exercise) => exercise.status !== 'CLOSED')
    .map((exercise) => ({ value: exercise.id, label: exercise.name }));
}

/**
 * An empty project form. An empty exercise_id means the project stands
 * apart from the Gamou.
 *
 * @returns {object} The form values.
 */
export function emptyProjectForm() {
  return {
    name: '',
    description: '',
    cost: '',
    share_mode: SHARE_MODES.SAME,
    amount_per_member: '',
    category_amounts: {},
    exercise_id: '',
  };
}

/**
 * Put a project in the shape of its form.
 *
 * @param {object} project The project as returned by the API.
 * @returns {object} The form values, every field as the inputs hold it.
 */
export function toProjectForm(project) {
  return {
    name: project.name ?? '',
    description: project.description ?? '',
    cost: project.cost == null ? '' : String(project.cost),
    share_mode:
      project.category_amounts?.length > 0 ? SHARE_MODES.CATEGORY : SHARE_MODES.SAME,
    amount_per_member:
      project.amount_per_member == null ? '' : String(project.amount_per_member),
    category_amounts: Object.fromEntries(
      (project.category_amounts ?? []).map((item) => [item.entity_id, String(item.amount)]),
    ),
    exercise_id: project.exercise_id ?? '',
  };
}

/**
 * Tell whether a project form can be sent.
 *
 * @param {ReturnType<typeof emptyProjectForm>} form The form as it stands.
 * @returns {boolean} True when the name is usable and amounts are valid.
 */
export function isProjectFormValid(form) {
  return (
    form.name.trim().length >= MIN_NAME_LENGTH &&
    isOptionalAmountValid(form.cost) &&
    isOptionalAmountValid(form.amount_per_member) &&
    Object.values(form.category_amounts).every(isOptionalAmountValid)
  );
}

/**
 * Build the creation payload of a project.
 *
 * @param {ReturnType<typeof emptyProjectForm>} form The form as it stands.
 * @returns {object} The API payload.
 */
export function toProjectCreate(form) {
  return {
    name: requiredText(form.name),
    description: optionalText(form.description),
    cost: optionalAmount(form.cost),
    exercise_id: optionalId(form.exercise_id),
    ...shareFields(form),
  };
}

/**
 * Build the partial update of a project from the fields that changed.
 *
 * @param {ReturnType<typeof toProjectForm>} initial The form as it was opened.
 * @param {ReturnType<typeof toProjectForm>} form The form as it stands.
 * @returns {object} Only the changed fields, in API form.
 */
export function toProjectUpdate(initial, form) {
  const changes = buildChanges(initial, form, PROJECT_CONVERTERS);
  const before = shareFields(initial);
  const after = shareFields(form);
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    Object.assign(changes, after);
  }
  return changes;
}

/**
 * Describe the share a project asks, per category when it has amounts per
 * category.
 *
 * @param {object} project The project as returned by the API.
 * @returns {Array<{label: string|null, amount: number}>} One entry for everyone, or one per category.
 */
export function projectShares(project) {
  if (project.category_amounts?.length > 0) {
    return project.category_amounts.map((item) => ({
      label: item.entity_name,
      amount: item.amount,
    }));
  }
  return project.amount_per_member ? [{ label: null, amount: project.amount_per_member }] : [];
}

/**
 * An empty payment form.
 *
 * @param {object|null} [contributor] An existing contributor paying a new instalment.
 * @returns {object} The form values.
 */
export function emptyPaymentForm(contributor = null) {
  return {
    contributor,
    kind: CONTRIBUTOR_KINDS.MEMBER,
    member: null,
    external_name: '',
    external_phone: '',
    amount: '',
    payment_date: todayInDakar(),
    comment: '',
  };
}

/** How each correctable payment field is sent to the API. */
const PAYMENT_CONVERTERS = {
  amount: amountValue,
  payment_date: requiredDate,
  comment: optionalText,
};

/**
 * Put a recorded payment in the shape of the payment form.
 *
 * The contributor is fixed: a payment filed under the wrong person is
 * cancelled and recorded again.
 *
 * @param {object} payment The payment as returned by the API.
 * @param {object} contributor The contributor it belongs to.
 * @returns {object} The form values.
 */
export function toPaymentForm(payment, contributor) {
  return {
    ...emptyPaymentForm(contributor),
    amount: String(payment.amount),
    payment_date: payment.payment_date ?? '',
    comment: payment.comment ?? '',
  };
}

/**
 * Build the partial update of a payment from the fields that changed.
 *
 * @param {ReturnType<typeof toPaymentForm>} initial The form as it was opened.
 * @param {ReturnType<typeof toPaymentForm>} form The form as it stands.
 * @returns {object} Only the changed fields, in API form.
 */
export function toPaymentUpdate(initial, form) {
  return buildChanges(initial, form, PAYMENT_CONVERTERS);
}

/**
 * Tell whether a payment form can be sent.
 *
 * @param {ReturnType<typeof emptyPaymentForm>} form The form as it stands.
 * @returns {boolean} True when a contributor is designated and the amount is valid.
 */
export function isPaymentFormValid(form) {
  const hasContributor =
    Boolean(form.contributor) ||
    (form.kind === CONTRIBUTOR_KINDS.MEMBER
      ? Boolean(form.member)
      : form.external_name.trim().length >= MIN_NAME_LENGTH);
  return hasContributor && isValidAmount(form.amount) && Boolean(form.payment_date);
}

/**
 * Build the payload of a payment from its form.
 *
 * The contributor is designated in exactly one way: an existing contributor,
 * a member of the Daara, or an outsider by name and optional phone.
 *
 * @param {ReturnType<typeof emptyPaymentForm>} form The form as it stands.
 * @returns {object} The API payload.
 */
export function toPaymentCreate(form) {
  const base = {
    amount: amountValue(form.amount),
    payment_date: form.payment_date,
    comment: optionalText(form.comment),
  };
  if (form.contributor) {
    return { ...base, contributor_id: form.contributor.id };
  }
  if (form.kind === CONTRIBUTOR_KINDS.MEMBER) {
    return { ...base, member_id: form.member.id };
  }
  return {
    ...base,
    external_name: requiredText(form.external_name),
    external_phone: optionalText(form.external_phone),
  };
}

/**
 * Share of the collected amount against a target.
 *
 * Not capped: giving more than asked is allowed and shows as more than 100.
 *
 * @param {number} paid What has been collected.
 * @param {number|null} target What is expected, if known.
 * @returns {number|null} The percentage, or null when there is no target.
 */
export function progressPercent(paid, target) {
  if (!target) return null;
  return Math.round((paid / target) * 100);
}

/**
 * Tell whether every payment of a contributor was cancelled.
 *
 * Such a contributor has given nothing, but stays listed so the cancellation
 * remains visible, the way a cancelled expense stays in the pot movements.
 *
 * @param {{payments_count: number, cancelled_payments_count: number}} contributor
 *   A contributor as listed by the API.
 * @returns {boolean} True when nothing active remains.
 */
export function isFullyCancelled(contributor) {
  return contributor.payments_count === 0 && contributor.cancelled_payments_count > 0;
}

/**
 * What was given beyond a target.
 *
 * @param {number} paid What has been collected.
 * @param {number|null} target What is expected, if known.
 * @returns {number} The surplus, zero when the target is not exceeded or unknown.
 */
export function excessAmount(paid, target) {
  if (!target) return 0;
  return Math.max(0, paid - target);
}

/**
 * What remains to be collected against a target.
 *
 * @param {number} paid What has been collected.
 * @param {number|null} target What is expected, if known.
 * @returns {number|null} The remainder, never negative, or null without a target.
 */
export function remainingAmount(paid, target) {
  if (!target) return null;
  return Math.max(0, target - paid);
}

/**
 * Merge the Barkelou and the expenses of a project into one list of movements.
 *
 * Gifts come in positive and expenses negative, newest first, so the list
 * reads as the ledger of the project's pot. Cancelled ones stay, marked.
 *
 * @param {Array<object>} donations Barkelou filed under the project.
 * @param {Array<object>} expenses Expenses paid from the project.
 * @returns {Array<object>} The movements, newest first.
 */
export function projectPotMovements(donations = [], expenses = []) {
  return [
    ...donations.map((donation) => ({
      id: donation.id,
      kind: 'DONATION',
      date: donation.donation_date,
      label: donation.donor_name,
      amount: donation.amount,
      signed: donation.amount,
      status: donation.status,
    })),
    ...expenses.map((expense) => ({
      id: expense.id,
      kind: 'EXPENSE',
      date: expense.expense_date,
      label: expense.description,
      amount: expense.amount,
      signed: -expense.amount,
      status: expense.status,
    })),
  ].sort((left, right) => (left.date < right.date ? 1 : left.date > right.date ? -1 : 0));
}
