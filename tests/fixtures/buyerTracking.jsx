import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import BuyerRequirementPropertyTracking from '../../src/components/BuyerRequirementPropertyTracking';

export const sampleLinkedProperties = [
  {
    linkId: 101,
    id: 10,
    propertyId: 10,
    propertyCode: 'HP-010',
    title: 'Marine Drive Sea Villa',
    location: 'Marine Drive',
    district: 'Ernakulam',
    expectedPrice: 15000000,
    transactionType: 'Purchase',
    currentStage: 'Property Selected',
    imageUrl: 'https://images.example.com/prop1.jpg',
    latestActivity: {
      stage: 'Property Selected',
      title: 'Initial Property Selection',
      actorName: 'Staff One',
      createdAt: '2026-10-24T10:00:00Z'
    }
  },
  {
    linkId: 102,
    id: 20,
    propertyId: 20,
    propertyCode: 'HP-020',
    title: 'Panampilly Nagar Apartment',
    location: 'Panampilly Nagar',
    district: 'Ernakulam',
    expectedPrice: 9500000,
    transactionType: 'Purchase',
    currentStage: 'Visit Scheduled',
    imageUrl: null,
    latestActivity: {
      stage: 'Visit Scheduled',
      title: 'Site Visit Arranged',
      actorName: 'Staff One',
      createdAt: '2026-10-24T11:00:00Z'
    }
  }
];

export const sampleTimelineData = {
  link: { propertyId: 10, currentStage: 'Property Selected' },
  timeline: [
    {
      id: 501,
      stage: 'Property Selected',
      eventType: 'PROPERTY_SELECTED',
      title: 'Initial Property Selection',
      notes: 'Buyer liked the sea view photos',
      actorName: 'Staff One',
      createdAt: '2026-10-24T10:00:00Z'
    }
  ]
};

export const sampleTimelineData2 = {
  link: { propertyId: 20, currentStage: 'Visit Scheduled' },
  timeline: [
    {
      id: 502,
      stage: 'Visit Scheduled',
      eventType: 'VISIT_SCHEDULED',
      title: 'Site Visit Arranged',
      notes: 'Customer scheduled a weekend walkthrough',
      actorName: 'Staff One',
      createdAt: '2026-10-24T11:00:00Z'
    }
  ]
};

export function renderBuyerTrackingComponent(props = {}) {
  const defaultRequirement = {
    id: 1,
    requirementId: 'HP-B001',
    requirementTitle: 'Marine Drive House Search',
    requirementType: 'Buy',
    propertyType: 'House/Villa',
    preferredLocation: 'Marine Drive',
    district: 'Ernakulam',
    budget: 15000000,
    buyerName: 'Vijay Kumar'
  };

  const defaultUser = {
    userId: 'staff-1',
    fullName: 'Staff One',
    role: 'Staff'
  };

  return renderToStaticMarkup(
    <MemoryRouter>
      <BuyerRequirementPropertyTracking
        requirement={defaultRequirement}
        properties={[]}
        user={defaultUser}
        showToast={() => {}}
        {...props}
      />
    </MemoryRouter>
  );
}

export function captureBuyerTrackingVNodes(props = {}) {
  const defaultRequirement = {
    id: 1,
    requirementId: 'HP-B001',
    requirementTitle: 'Marine Drive House Search',
    requirementType: 'Buy',
    propertyType: 'House/Villa',
    preferredLocation: 'Marine Drive',
    district: 'Ernakulam',
    budget: 15000000,
    buyerName: 'Vijay Kumar'
  };

  const defaultUser = {
    userId: 'staff-1',
    fullName: 'Staff One',
    role: 'Staff'
  };

  let captured = null;
  function CaptureHarness() {
    captured = BuyerRequirementPropertyTracking({
      requirement: defaultRequirement,
      properties: [],
      user: defaultUser,
      showToast: () => {},
      initialLinkedProperties: sampleLinkedProperties,
      initialSelectedPropertyId: 10,
      initialTimelineData: sampleTimelineData,
      ...props
    });
    return null;
  }

  renderToStaticMarkup(<CaptureHarness />);
  return captured;
}
