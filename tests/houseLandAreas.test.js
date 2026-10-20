import test from 'node:test';
import assert from 'node:assert/strict';
import { sellPropertySchema } from '../src/schemas/formSchemas.js';
import {
  HOUSE_BUILDING_AREA_UNITS,
  LAND_AREA_UNITS,
  getHouseLandAreaFormValues,
  getHouseLandAreaPayload,
  selectHouseLandAreaUnit
} from '../src/utils/houseLandAreas.js';

const unitField = id => sellPropertySchema.find(field => field.id === id);

test('House + Land selectors keep their distinct supported units and consistent labels', () => {
  const houseArea = unitField('houseArea');
  const landArea = unitField('landArea');

  assert.deepEqual(houseArea.unitOptions, ['Cent', 'Acre', 'Sq. Ft.', 'Sq. Meter', 'Sq. Yard']);
  assert.deepEqual(landArea.unitOptions, ['Cent', 'Acre', 'Sq. Ft.', 'Sq. Meter', 'Sq. Yard']);
  assert.deepEqual(HOUSE_BUILDING_AREA_UNITS, houseArea.unitOptions);
  assert.deepEqual(LAND_AREA_UNITS, landArea.unitOptions);
  assert.equal(houseArea.label, 'House / Building Area');
  assert.equal(landArea.label, 'Land Area');
  assert.equal(houseArea.defaultUnit, 'Cent');
  assert.equal(landArea.defaultUnit, 'Cent');
});

test('property creation form still requires location and owner contact, and keeps the legacy area for other types', () => {
  assert.equal(unitField('locationSelector').locationFieldName, 'location');
  assert.equal(unitField('locationSelector').required, true);
  assert.equal(unitField('ownerName').required, true);
  assert.equal(unitField('phoneNumber').required, true);
  assert.equal(unitField('area').required, true);
  assert.equal(unitField('area').showIf({ propertyType: 'House + Land' }), false);
});

test('changing either selected unit never transforms its numeric area value', () => {
  const initial = { propertyType: 'House + Land', houseArea: '1234.5', houseAreaUnit: 'Sq. Ft.', landArea: '7.25', landAreaUnit: 'Cent' };
  const selectedLandUnit = selectHouseLandAreaUnit(initial, 'landAreaUnit', 'Sq. Yard');

  assert.equal(selectedLandUnit.landArea, initial.landArea);
  assert.equal(selectedLandUnit.landAreaUnit, 'Sq. Yard');
  for (const unit of HOUSE_BUILDING_AREA_UNITS) {
    const selected = selectHouseLandAreaUnit(initial, 'houseAreaUnit', unit);
    assert.equal(selected.houseArea, initial.houseArea);
    assert.equal(selected.houseAreaUnit, unit);
  }
});

test('create and edit payloads retain numeric values and units independently', () => {
  const form = {
    propertyType: 'House + Land',
    houseArea: '1400.5',
    houseAreaUnit: 'Sq. Meter',
    landArea: '2.75',
    landAreaUnit: 'Acre'
  };
  const payload = getHouseLandAreaPayload(form);

  assert.deepEqual(payload, {
    houseArea: 1400.5,
    houseAreaUnit: 'Sq. Meter',
    landArea: 2.75,
    landAreaUnit: 'Acre'
  });
  assert.deepEqual(getHouseLandAreaFormValues(payload), {
    houseArea: '1400.5',
    houseAreaUnit: 'Sq. Meter',
    landArea: '2.75',
    landAreaUnit: 'Acre'
  });
});

test('editing reloads every supported unit from camelCase and database snake_case fields', () => {
  for (const houseAreaUnit of HOUSE_BUILDING_AREA_UNITS) {
    for (const landAreaUnit of LAND_AREA_UNITS) {
      const saved = getHouseLandAreaPayload({
        propertyType: 'House + Land',
        houseArea: '875.25',
        houseAreaUnit,
        landArea: '3.5',
        landAreaUnit
      });
      assert.deepEqual(getHouseLandAreaFormValues(saved), {
        houseArea: '875.25',
        houseAreaUnit,
        landArea: '3.5',
        landAreaUnit
      });
      assert.equal(saved.houseAreaUnit, houseAreaUnit);
      assert.deepEqual(getHouseLandAreaFormValues({
        house_area: '875.25',
        house_area_unit: houseAreaUnit,
        land_area: '3.5',
        land_area_unit: landAreaUnit
      }), {
        houseArea: '875.25',
        houseAreaUnit,
        landArea: '3.5',
        landAreaUnit
      });
    }
  }
});

test('editing other property types clears House + Land payload fields', () => {
  assert.deepEqual(getHouseLandAreaPayload({ propertyType: 'House/Villa', houseArea: '900', houseAreaUnit: 'Sq. Ft.', landArea: '4', landAreaUnit: 'Cent' }), {
    houseArea: null,
    houseAreaUnit: null,
    landArea: null,
    landAreaUnit: null
  });
});
