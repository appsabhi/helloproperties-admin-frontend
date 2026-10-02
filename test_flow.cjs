const assert = require('assert');

// Simulate the flow
let formData = { location: "" };

function setFormData(updater) {
    if (typeof updater === 'function') {
        formData = updater(formData);
    } else {
        formData = updater;
    }
}

// 1. MapPickerModal selected location
const locationDetails = {
    locality: "Pokkunnu",
    district: "Kozhikode",
    state: "Kerala",
    latitude: 11.25,
    longitude: 75.8
};

// 2. handleMapConfirm -> handleSelectSuggestion
const lat = locationDetails.latitude || null;
const lon = locationDetails.longitude || null;

const batchObj = {
    location: locationDetails.locality,
    district: locationDetails.district,
    state: locationDetails.state,
    latitude: lat,
    longitude: lon
};

// 3. SchemaForm handleChange
setFormData(prev => ({ ...prev, ...batchObj }));

// 4. Properties.jsx handleAddPropertySubmit
const formattedData = {
    ...formData,
    imageUrl: ''
};

// 5. PropertyContext.jsx addProperty
const propertyData = formattedData;
const payload = {
    title: propertyData.title,
    latitude: propertyData.latitude || propertyData.lat || null,
    longitude: propertyData.longitude || propertyData.lng || null
};

console.log("Payload:", payload);
