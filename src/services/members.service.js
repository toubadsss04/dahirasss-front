import { memberGenderKey } from '../constants/labels';
import { MEMBER_GENDERS } from '../constants/members';
import { matchesSearch } from '../utils/format';
import { buildChanges, optionalDate, optionalText, requiredText } from '../utils/formChanges';
import { apiClient } from './apiClient';

/** Largest page the API serves, so a daara is loaded in as few calls as possible. */
const MEMBERS_PAGE_SIZE = 200;

/**
 * Read one page of a member listing.
 *
 * @param {string} path Listing to read, the regular one or the directory.
 * @param {object} params Filters, limit and offset.
 * @returns {Promise<{items: Array<object>, total: number}>} The page.
 */
async function fetchMembersPage(path, params) {
  const { data } = await apiClient.get(path, { params });
  return data;
}

/**
 * Load every page of a member listing, the pages after the first together.
 *
 * @param {string} path Listing to read.
 * @param {object} filters Filters sent with every page.
 * @returns {Promise<Array<object>>} All the matching members.
 */
async function fetchEveryPage(path, filters) {
  const first = await fetchMembersPage(path, {
    ...filters,
    limit: MEMBERS_PAGE_SIZE,
    offset: 0,
  });
  const rest = await Promise.all(
    pageOffsets(first.total, MEMBERS_PAGE_SIZE).map((offset) =>
      fetchMembersPage(path, { ...filters, limit: MEMBERS_PAGE_SIZE, offset }),
    ),
  );
  return mergePages([first, ...rest]);
}

/**
 * List where the pages after the first one start.
 *
 * @param {number} total How many members there are in all.
 * @param {number} size How many a page holds.
 * @returns {number[]} The offsets left to read, empty when one page was enough.
 */
export function pageOffsets(total, size) {
  const offsets = [];
  for (let offset = size; offset < total; offset += size) {
    offsets.push(offset);
  }
  return offsets;
}

/**
 * Join the pages into one list, keeping the first copy of each member.
 *
 * A member recorded by someone else between two pages shifts the ones after
 * it, which can hand back the same member twice. Keeping the first copy is
 * what stops that from showing as a duplicated row until the next refresh.
 *
 * @param {Array<{items: Array<object>}>} pages The pages as they came back.
 * @returns {Array<object>} The members, each appearing once.
 */
export function mergePages(pages) {
  const seen = new Set();
  return pages
    .flatMap((page) => page.items)
    .filter((member) => !seen.has(member.id) && seen.add(member.id));
}

/**
 * Load every member matching the filters, in the order the API lists them.
 *
 * Searching happens in the browser, over this list, so it has to be whole: a
 * member left on a page never loaded would silently never be found. The first
 * page says how many there are, and the pages left are read together rather
 * than one after the other.
 *
 * @param {{entity_id?: string, status?: string, gender?: string}} [filters] Section,
 *   status and sex.
 * @returns {Promise<Array<object>>} All the matching members.
 */
export async function fetchAllMembers(filters = {}) {
  return fetchEveryPage('/members', filters);
}

/**
 * Build the choices of a sex picker, women first.
 *
 * @param {(key: string) => string} t Translation function.
 * @returns {Array<{value: string, label: string}>} The two choices.
 */
export function memberGenderOptions(t) {
  return [MEMBER_GENDERS.FEMALE, MEMBER_GENDERS.MALE].map((gender) => ({
    value: gender,
    label: t(memberGenderKey(gender)),
  }));
}

/**
 * Order members by section, then by name, so a list can be grouped per section.
 *
 * @param {Array<object>} members Members carrying their section name.
 * @returns {Array<object>} A sorted copy.
 */
export function sortBySection(members) {
  const byName = (member) => `${member.first_name} ${member.last_name}`.trim();
  return [...members].sort(
    (left, right) =>
      (left.entity_name ?? '').localeCompare(right.entity_name ?? '', 'fr') ||
      byName(left).localeCompare(byName(right), 'fr'),
  );
}

/**
 * Keep the members a search designates, without asking the server.
 *
 * The fields searched are the ones the API searches: first name, surname and
 * phone number, folded the same way, each typed word matched on its own.
 *
 * @param {Array<object>} members Members already loaded.
 * @param {string} term What was typed.
 * @returns {Array<object>} The matching members, in their original order.
 */
export function filterMembers(members, term) {
  return members.filter((member) =>
    matchesSearch(`${member.first_name} ${member.last_name} ${member.phone ?? ''}`, term),
  );
}

/**
 * Read one member.
 *
 * @param {string} memberId Identifier.
 * @returns {Promise<object>} The member.
 */
export async function fetchMember(memberId) {
  const { data } = await apiClient.get(`/members/${memberId}`);
  return data;
}

/**
 * Create a member.
 *
 * @param {object} payload Names, phone and daara.
 * @returns {Promise<object>} The created member.
 */
export async function createMember(payload) {
  const { data } = await apiClient.post('/members', payload);
  return data;
}

/**
 * Update a member.
 *
 * @param {string} memberId Identifier.
 * @param {object} payload Fields to change.
 * @returns {Promise<object>} The updated member.
 */
export async function updateMember(memberId, payload) {
  const { data } = await apiClient.patch(`/members/${memberId}`, payload);
  return data;
}

/** How each correctable member field is sent to the API. */
const MEMBER_CONVERTERS = {
  first_name: requiredText,
  last_name: requiredText,
  phone: optionalText,
  gender: requiredText,
  joined_on: optionalDate,
};

/**
 * Put a member in the shape of the correction form.
 *
 * Every field is a string, as the inputs hold it, so the form can later be
 * compared field by field with what the person typed.
 *
 * @param {object} member The member as returned by the API.
 * @returns {{first_name: string, last_name: string, phone: string, gender: string,
 *   joined_on: string}} The form values, gender empty while it was never recorded.
 */
export function toMemberForm(member) {
  return {
    first_name: member.first_name ?? '',
    last_name: member.last_name ?? '',
    phone: member.phone ?? '',
    gender: member.gender ?? '',
    joined_on: member.joined_on ?? '',
  };
}

/**
 * Tell whether a member correction can be sent.
 *
 * Both names are mandatory in the database, so a correction that empties one
 * is held back here rather than refused by the server.
 *
 * @param {ReturnType<typeof toMemberForm>} form The form as it stands.
 * @returns {boolean} True when both names are filled in.
 */
export function isMemberFormValid(form) {
  return Boolean(form.first_name.trim() && form.last_name.trim());
}

/**
 * Build the partial update of a member from the fields that changed.
 *
 * @param {ReturnType<typeof toMemberForm>} initial The form as it was opened.
 * @param {ReturnType<typeof toMemberForm>} form The form as it stands.
 * @returns {object} Only the changed fields, in API form.
 */
export function toMemberUpdate(initial, form) {
  return buildChanges(initial, form, MEMBER_CONVERTERS);
}

/**
 * Move a member to another daara, keeping their financial history.
 *
 * @param {string} memberId Identifier.
 * @param {object} payload Target daara and reason.
 * @returns {Promise<object>} The updated member.
 */
export async function transferMember(memberId, payload) {
  const { data } = await apiClient.post(`/members/${memberId}/transfer`, payload);
  return data;
}

/**
 * Read every daara a member has belonged to.
 *
 * @param {string} memberId Identifier.
 * @returns {Promise<Array<object>>} The assignment periods.
 */
export async function fetchMemberHistory(memberId) {
  const { data } = await apiClient.get(`/members/${memberId}/history`);
  return data;
}

/**
 * Read the month by month contributions of a member.
 *
 * @param {string} memberId Identifier.
 * @param {string} [exerciseId] Restrict to one exercise.
 * @returns {Promise<Array<object>>} The monthly totals.
 */
export async function fetchMemberMonthly(memberId, exerciseId) {
  const { data } = await apiClient.get(`/members/${memberId}/monthly`, {
    params: exerciseId ? { exercise_id: exerciseId } : {},
  });
  return data;
}
