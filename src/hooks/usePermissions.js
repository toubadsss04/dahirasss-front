import { DAHIRA_ROLES, RENTAL_ROLES, ROLES } from '../constants/navigation';
import { useAuthStore } from '../store/authStore';

/**
 * Permission flags for the current account.
 *
 * The Dahira puts no section in anyone's charge: every account reads and
 * records across all sections. What remains is what the super administrator
 * alone may do. These flags only shape the interface: the API enforces the
 * same rules and remains the authority, so hiding a button is never the
 * security mechanism.
 *
 * @returns {object} What the current account may do.
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  return {
    user,
    isSuperAdmin,
    /** The Dahira itself: members, finances, projects and reports. */
    canSeeDahira: DAHIRA_ROLES.includes(user?.role),
    /** The rental business, which stands apart from the Dahira finances. */
    canSeeRental: RENTAL_ROLES.includes(user?.role),
    canManageUsers: isSuperAdmin,
    canManageDaaras: isSuperAdmin,
    canManageExercises: isSuperAdmin,
    /** Projects are created, corrected and closed by the super administrator. */
    canManageProjects: isSuperAdmin,
    /** Every account records and corrects project payments; the audit trail keeps who did it. */
    canRecordProjectPayments: true,
    /**
     * A project payment is corrected by whoever recorded it, or by the super
     * administrator, so no one rewrites what another typed.
     *
     * @param {{created_by?: string|null}} payment The payment as returned by the API.
     * @returns {boolean} True when the account may correct it.
     */
    canCorrectProjectPayment(payment) {
      return isSuperAdmin || (Boolean(user?.id) && payment?.created_by === user.id);
    },
    /**
     * A Gamou expense is corrected by whoever recorded it, or by the super
     * administrator, since every account records them.
     *
     * @param {{created_by?: string|null}} expense The expense as returned by the API.
     * @returns {boolean} True when the account may correct it.
     */
    canCorrectGamouExpense(expense) {
      return isSuperAdmin || (Boolean(user?.id) && expense?.created_by === user.id);
    },
    /** Cancelling a Gamou expense changes the common pot, so it stays with the super administrator. */
    canCancelGamouExpense: isSuperAdmin,
    /** Cancelling a project payment removes money from it, so it stays with the super administrator. */
    canCancelProjectPayments: isSuperAdmin,
    canSeeAudit: isSuperAdmin,
    /**
     * Choosing the interface language is held back to the super administrator
     * for now, so the Dahira settles on one before opening it to everyone.
     */
    canChooseLanguage: isSuperAdmin,
    canCloseExercise: isSuperAdmin || Boolean(user?.can_close_exercise),
  };
}
