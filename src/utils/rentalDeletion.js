export function deletionPresentation(agreement) {
  const policy = agreement.deletion;
  return { blocked: policy?.mode !== 'void', button: 'Void agreement', message: policy?.message || 'Deletion eligibility is unavailable. Refresh the agreement before continuing.' };
}
export function validateDeletionReason(reason) {
  return typeof reason !== 'string' || reason.trim().length < 5 || reason.trim().length > 2000 ? 'Provide a reason between 5 and 2000 characters.' : '';
}
export async function submitRentalDeletion(request, agreement, reason) {
  const invalid = validateDeletionReason(reason);
  if (invalid) throw new Error(invalid);
  const result = await request('/' + agreement.id + '/delete', 'POST', { version: agreement.version, reason: reason.trim() });
  if (!result.success || result.data?.outcome !== 'voided') throw new Error('The server did not confirm the action. Refresh before retrying.');
  return { message: 'Agreement voided. History and notifications were preserved.' };
}
