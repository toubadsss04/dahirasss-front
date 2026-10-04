import { apiClient } from './apiClient';

/**
 * List accounts. Reserved to the super administrator.
 *
 * @returns {Promise<Array<object>>} The accounts.
 */
export async function fetchUsers() {
  const { data } = await apiClient.get('/users');
  return data;
}

/**
 * Create an account without a password.
 *
 * The person chooses their own password on first sign-in.
 *
 * @param {object} payload Identifier, name, role and daara.
 * @returns {Promise<object>} The created account.
 */
export async function createUser(payload) {
  const { data } = await apiClient.post('/users', payload);
  return data;
}

/**
 * Update an account.
 *
 * @param {string} userId Identifier.
 * @param {object} payload Fields to change.
 * @returns {Promise<object>} The updated account.
 */
export async function updateUser(userId, payload) {
  const { data } = await apiClient.patch(`/users/${userId}`, payload);
  return data;
}

/**
 * Clear a password so the person may choose a new one.
 *
 * @param {string} userId Identifier.
 * @returns {Promise<object>} The updated account.
 */
export async function resetUserPassword(userId) {
  const { data } = await apiClient.post(`/users/${userId}/reset-password`);
  return data;
}

/**
 * Find the members already carrying a name, before an account is created.
 *
 * @param {string} firstName First name typed on the form.
 * @param {string} lastName Surname typed on the form.
 * @returns {Promise<Array<object>>} The matching members, each saying whether
 *   they already have an account.
 */
export async function fetchMemberMatches(firstName, lastName) {
  const { data } = await apiClient.get('/users/member-matches', {
    params: { first_name: firstName, last_name: lastName },
  });
  return data;
}

/**
 * Keep the members that are not yet anyone's account.
 *
 * @param {Array<object>} members Every member loaded.
 * @param {Array<object>} users Every account loaded.
 * @returns {Array<object>} The members an account can still be made from.
 */
export function membersWithoutAccount(members, users) {
  const linked = new Set(users.map((user) => user.member_id).filter(Boolean));
  return members.filter((member) => !linked.has(member.id));
}

/**
 * Fill the account form from the member it is made from.
 *
 * The name and phone come from the member, whose section stays their own.
 *
 * @param {object} form The form as it stands.
 * @param {object|null} member The member chosen, or null to clear the choice.
 * @returns {object} The updated form.
 */
export function withMember(form, member) {
  if (!member) return { ...form, member: null };
  return {
    ...form,
    member,
    first_name: member.first_name,
    last_name: member.last_name,
    phone: member.phone ?? '',
    member_entity_id: '',
  };
}
