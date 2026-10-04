/** Lifecycle of a project, as stored by the API. */
export const PROJECT_STATUSES = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
};

/** Who a payment comes from, as chosen on the payment form. */
export const CONTRIBUTOR_KINDS = {
  MEMBER: 'MEMBER',
  EXTERNAL: 'EXTERNAL',
};

/** Projects shown per page, matching the API default. */
export const PROJECTS_PAGE_SIZE = 20;

/** Contributors shown per page on a project. */
export const CONTRIBUTORS_PAGE_SIZE = 50;

/** Delay before a typed search is sent to the API, in milliseconds. */
export const SEARCH_DEBOUNCE_MS = 350;

/** Shortest project or contributor name the API accepts. */
export const MIN_NAME_LENGTH = 2;

/** The two ways a project states the share asked of members. */
export const SHARE_MODES = {
  SAME: 'SAME',
  CATEGORY: 'CATEGORY',
};
