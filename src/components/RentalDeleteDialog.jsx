import React, { useRef, useState } from 'react';
import Modal from './Modal';
import { deletionPresentation, validateDeletionReason, submitRentalDeletion } from '../utils/rentalDeletion';

export default function RentalDeleteDialog({ agreement, currentVersion, request, onClose, onSuccess, onConflict }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const policy = deletionPresentation(agreement);
  const stale = currentVersion !== agreement.version;
  async function submit(event) {
    event.preventDefault();
    if (pending.current || stale || policy.blocked) return;
    const invalid = validateDeletionReason(reason);
    if (invalid) { setError(invalid); return; }
    pending.current = true; setBusy(true); setError('');
    try {
      const result = await submitRentalDeletion(request, agreement, reason);
      onSuccess(result.message);
    } catch (failure) {
      setError(failure.message);
      if (failure.status === 409) await onConflict();
    } finally { pending.current = false; setBusy(false); }
  }
  return <Modal title="Delete Agreement" subtitle={'RA-' + agreement.id} onClose={busy ? undefined : onClose} closeOnEscape={!busy} closeOnOverlayClick={!busy}>
    <form onSubmit={submit} className="space-y-4">
      <dl className="space-y-2 text-sm"><div><dt className="font-semibold">Agreement</dt><dd>{'RA-' + agreement.id}</dd></div><div><dt className="font-semibold">Tenant</dt><dd>{agreement.tenant_name}</dd></div><div><dt className="font-semibold">Property</dt><dd>{agreement.property_id} ? {agreement.title}</dd></div></dl>
      <p className="rounded-lg bg-amber-50 p-3 text-sm">{policy.message}</p>
      {(error || stale) && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error || 'The agreement changed. Close this dialog and reopen it to review the latest record.'}</p>}
      {!policy.blocked && <label className="block text-sm font-medium">Reason (required)<textarea value={reason} onChange={event => setReason(event.target.value)} disabled={busy} minLength={5} maxLength={2000} rows={3} required className="mt-1 w-full rounded-lg border p-2" /></label>}
      <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button><button type="submit" disabled={busy || stale || policy.blocked} className="rounded-lg bg-red-700 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Saving?' : policy.button}</button></div>
    </form>
  </Modal>;
}
