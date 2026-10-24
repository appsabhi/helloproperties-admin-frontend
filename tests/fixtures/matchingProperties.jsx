import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Properties from '../../src/pages/Properties';
import { AuthContext } from '../../src/context/AuthContext';
import { PropertyContext } from '../../src/context/PropertyContext';

export const sampleMatchingProperties = [
  {
    id: 42,
    propertyId: 'HP-042',
    title: 'Seaside Villa with Beach View',
    location: 'Marine Drive',
    district: 'Ernakulam',
    ownerName: 'Rahul Menon',
    phoneNumber: '9876543210',
    listingType: 'Sale',
    expectedPrice: 15000000,
    matchScore: 92
  },
  {
    id: 108,
    propertyId: 'HP-108',
    title: 'Modern Highrise Apartment',
    location: 'Kakkanad',
    district: 'Ernakulam',
    ownerName: 'Deepa Nair',
    phoneNumber: '9123456780',
    listingType: 'Rent',
    monthlyRent: 25000,
    monthlyRentUnit: '/ Month',
    matchScore: 84
  }
];

export function renderMatchingPropertiesScreen(props = {}) {
  const authValue = {
    user: { role: 'Staff', username: 'staff1' },
    isAuthenticated: true,
    isLoadingAuth: false
  };

  const propertyValue = {
    properties: sampleMatchingProperties,
    requirements: [],
    propertyFilters: {},
    requirementFilters: {},
    isPropertySharingEnabled: false
  };

  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/properties/requirements']}>
      <AuthContext.Provider value={authValue}>
        <PropertyContext.Provider value={propertyValue}>
          <Properties
            initialView="addRequirement"
            initialAddRequirementResult={{
              success: true,
              matches: sampleMatchingProperties
            }}
            {...props}
          />
        </PropertyContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

export function captureMatchingPropertiesVNodes(props = {}) {
  let captured = null;
  const authValue = {
    user: { role: 'Staff', username: 'staff1' },
    isAuthenticated: true,
    isLoadingAuth: false
  };

  const propertyValue = {
    properties: sampleMatchingProperties,
    requirements: [],
    propertyFilters: {},
    requirementFilters: {},
    isPropertySharingEnabled: false
  };

  function TestHarness() {
    captured = Properties({
      initialView: 'addRequirement',
      initialAddRequirementResult: {
        success: true,
        matches: sampleMatchingProperties
      },
      ...props
    });
    return null;
  }

  renderToStaticMarkup(
    <MemoryRouter initialEntries={['/properties/requirements']}>
      <AuthContext.Provider value={authValue}>
        <PropertyContext.Provider value={propertyValue}>
          <TestHarness />
        </PropertyContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );

  return captured;
}
