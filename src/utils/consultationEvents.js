/**
 * Window event that asks the lawyer's call listener to bring a minimized live
 * chat back to the front. Kept in its own module so the portal chrome can fire
 * it without importing the listener.
 */
export const RESTORE_CONSULTATION_EVENT = 'jl:consultation-restore';

export function restoreConsultation() {
  window.dispatchEvent(new Event(RESTORE_CONSULTATION_EVENT));
}
