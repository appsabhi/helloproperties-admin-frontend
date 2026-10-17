export const HOUSE_BUILDING_AREA_UNITS = Object.freeze(['Cent', 'Acre', 'Sq. Ft.', 'Sq. Meter', 'Sq. Yard']);
export const LAND_AREA_UNITS = Object.freeze(['Cent', 'Acre', 'Sq. Ft.', 'Sq. Meter', 'Sq. Yard']);

const DEFAULT_HOUSE_AREA_UNIT = HOUSE_BUILDING_AREA_UNITS[0];
const DEFAULT_LAND_AREA_UNIT = LAND_AREA_UNITS[0];

export function selectHouseLandAreaUnit(formData, unitField, unit) {
  const units = unitField === 'houseAreaUnit'
    ? HOUSE_BUILDING_AREA_UNITS
    : unitField === 'landAreaUnit'
      ? LAND_AREA_UNITS
      : null;

  if (!units || !units.includes(unit)) {
    throw new RangeError(`Unsupported House + Land area unit selection: ${unit}`);
  }

  return {
    ...formData,
    [unitField]: unit,
    ...(unitField === 'landAreaUnit'
      ? { expectedPriceUnit: `/ ${unit}`, monthlyRentUnit: `/ ${unit}` }
      : {})
  };
}

const readArea = (value, unitValue, supportedUnits, defaultUnit) => {
  const text = value === undefined || value === null ? '' : String(value).trim();
  const match = text.match(/^([\d]+(?:\.\d+)?)(?:\s*(.*))?$/);
  const suffixUnit = match?.[2]?.trim();
  const unit = supportedUnits.includes(unitValue)
    ? unitValue
    : supportedUnits.includes(suffixUnit)
      ? suffixUnit
      : defaultUnit;

  return { value: match ? match[1] : text, unit };
};

export function getHouseLandAreaFormValues(property = {}) {
  const houseArea = readArea(
    property.houseArea ?? property.house_area,
    property.houseAreaUnit || property.house_area_unit,
    HOUSE_BUILDING_AREA_UNITS,
    DEFAULT_HOUSE_AREA_UNIT
  );
  const landArea = readArea(
    property.landArea ?? property.land_area,
    property.landAreaUnit || property.land_area_unit,
    LAND_AREA_UNITS,
    DEFAULT_LAND_AREA_UNIT
  );

  return {
    houseArea: houseArea.value,
    houseAreaUnit: houseArea.unit,
    landArea: landArea.value,
    landAreaUnit: landArea.unit
  };
}

export function getHouseLandAreaPayload(property = {}) {
  if (property.propertyType !== 'House + Land') {
    return { houseArea: null, houseAreaUnit: null, landArea: null, landAreaUnit: null };
  }

  return {
    houseArea: Number(property.houseArea),
    houseAreaUnit: property.houseAreaUnit,
    landArea: Number(property.landArea),
    landAreaUnit: property.landAreaUnit
  };
}
