import { useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateDomain } from '../constants/queryKeys';
import { notify } from '../store/notificationStore';

/**
 * A write that refreshes everything it affects and says what it did.
 *
 * The caller names the domain it writes to and the sentence to show. What that
 * domain touches is declared once, next to the keys, so a screen cannot forget
 * a listing it does not know about.
 *
 * Failures are not announced here on purpose. Every write happens inside a
 * dialog that shows the reason in place, next to the fields concerned, which
 * is more useful than a notice that disappears.
 *
 * @param {string} domain Domain written to, as declared in the invalidation map.
 * @param {(variables: unknown) => Promise<unknown>} mutationFn The API call.
 * @param {object} [options] Extra options.
 * @param {string} [options.successMessage] Confirmation shown once it succeeds.
 * @param {Function} [options.onSuccess] Additional work after a success.
 * @returns {import('@tanstack/react-query').UseMutationResult} The mutation.
 */
export function useDomainMutation(domain, mutationFn, options = {}) {
  const queryClient = useQueryClient();
  const { successMessage, onSuccess, ...rest } = options;

  return useMutation({
    ...rest,
    mutationFn,
    onSuccess: async (data, variables, context) => {
      await invalidateDomain(queryClient, domain);
      if (successMessage) {
        notify(successMessage, 'success');
      }
      await onSuccess?.(data, variables, context);
    },
  });
}
