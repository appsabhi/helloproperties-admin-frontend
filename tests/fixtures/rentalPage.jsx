import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import RentalAgreements from '../../src/pages/RentalAgreements';
import RentalDeleteDialog from '../../src/components/RentalDeleteDialog';
import RentalReminders from '../../src/pages/RentalReminders';
import Layout from '../../src/components/Layout';
import { AuthContext } from '../../src/context/AuthContext';
import { RentalContext } from '../../src/context/RentalContext';
import { PropertyContext } from '../../src/context/PropertyContext';

export function renderRentalPage(overrides = {}, { reminders = false, layout = false, path = '/rentals', role = 'Staff' } = {}) {
  const rental = { agreements: [], alerts: [], unread: [], readIds: [], error: '', loading: false, syncing: false, refresh() {}, request() {}, markRead() {}, today: '2026-10-16', capabilities: { edit: true, renew: true, unread: true }, remindersAvailable: true, canManage: true, ...overrides };
  const page = reminders ? <RentalReminders /> : <RentalAgreements />;
  return renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={{ user: { role, username: 'test' }, logout() {} }}><RentalContext.Provider value={rental}><PropertyContext.Provider value={{ properties: [], fetchFromBackend() {} }}>{layout ? <Layout>{page}</Layout> : page}</PropertyContext.Provider></RentalContext.Provider></AuthContext.Provider></MemoryRouter>);
}

export function renderRentalDeleteDialog(agreement, currentVersion = agreement.version) {
  return renderToStaticMarkup(<RentalDeleteDialog agreement={agreement} currentVersion={currentVersion} request={async () => ({})} onClose={() => {}} onSuccess={() => {}} onConflict={async () => {}} />);
}
