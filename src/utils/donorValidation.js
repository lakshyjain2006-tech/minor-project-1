const validBloodGroups = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-"
];

function validateDonor(data) {
    const {
        name,
        phone,
        bloodGroup,
        age,
        latitude,
        longitude
    } = data;

    const errors = [];

    if (!name || name.trim().length < 2) {
        errors.push("Name must contain at least 2 characters");
    }

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        errors.push("Enter a valid 10-digit Indian phone number");
    }

    if (!validBloodGroups.includes(bloodGroup)) {
        errors.push("Invalid blood group");
    }

    const numericAge = Number(age);

    if (!Number.isInteger(numericAge) || numericAge < 18 || numericAge > 65) {
        errors.push("Age must be between 18 and 65");
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        errors.push("Invalid latitude");
    }

    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        errors.push("Invalid longitude");
    }

    return errors;
}

module.exports = {
    validateDonor,
    validBloodGroups
};