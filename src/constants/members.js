/**
 * Choice standing for "no category" in a category picker.
 *
 * A select cannot hold null, so this value is sent as null to the API, which
 * then takes the member out of any category.
 */
export const NO_CATEGORY = 'none';

/** Sex of a member, as the API stores it. */
export const MEMBER_GENDERS = {
  FEMALE: 'FEMALE',
  MALE: 'MALE',
};
