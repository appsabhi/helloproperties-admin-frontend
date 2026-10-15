import test from 'node:test';
import assert from 'node:assert/strict';
import { submissionPriceDisplay } from '../../backend/services/submissionPriceDisplay.js';

const payload = {
  expectedPrice: 500000, expectedPriceUnit: '/ Cent', area: 3.5, areaUnit: 'Cent',
  location: {}, images: [], monthlyRent: 0, monthlyRentUnit: '/ Month'
};

test('approved sale displays the submitted per-cent amount without changing its stored total', () => {
  const row = { listing_type: 'Sale', expected_price: '1750000.00', submitted_sale_payload: payload };
  assert.deepEqual(submissionPriceDisplay(row), { displayPrice: 500000, displayPriceUnit: '/ Cent' });
  assert.equal(row.expected_price, '1750000.00');
});

test('preserves original unit even when price and area units differ', () => {
  const row = { listing_type: 'Sale', expected_price: 500000, submitted_sale_payload: { ...payload, area: 1, areaUnit: 'Acre', expectedPrice: 5000 } };
  assert.deepEqual(submissionPriceDisplay(row), { displayPrice: 5000, displayPriceUnit: '/ Cent' });
});

test('total amount remains a total and never acquires an area unit', () => {
  const row = { listing_type: 'Sale', expected_price: 500000, submitted_sale_payload: { ...payload, expectedPriceUnit: 'Total Amount' } };
  assert.deepEqual(submissionPriceDisplay(row), { displayPrice: 500000, displayPriceUnit: 'All Properties' });
});

test('does not override edited prices, manual listings, rentals, or invalid payloads', () => {
  for (const row of [
    { listing_type: 'Sale', expected_price: 2000000, submitted_sale_payload: payload },
    { listing_type: 'Sale', expected_price: 500000 },
    { listing_type: 'Rent', expected_price: 1750000, submitted_sale_payload: payload },
    { listing_type: 'Sale', expected_price: 1750000, submitted_sale_payload: {} }
  ]) assert.deepEqual(submissionPriceDisplay(row), {});
});
