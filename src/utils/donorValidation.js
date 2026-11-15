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
        weight,
        healthEligible,
        lastDonationDate,
        latitude,
        longitude
    } = data;

    const errors = [];

    // -----------------------------
    // NAME
    // -----------------------------
    if (!name || name.trim().length < 2) {
        errors.push(
            "Name must contain at least 2 characters"
        );
    }

    // -----------------------------
    // PHONE
    // -----------------------------
    if (
        !phone ||
        !/^[6-9]\d{9}$/.test(phone)
    ) {
        errors.push(
            "Enter a valid 10-digit Indian phone number"
        );
    }

    // -----------------------------
    // BLOOD GROUP
    // -----------------------------
    if (
        !validBloodGroups.includes(
            bloodGroup
        )
    ) {
        errors.push(
            "Invalid blood group"
        );
    }

    // -----------------------------
    // AGE
    // -----------------------------
    const numericAge = Number(age);

    if (
        !Number.isInteger(numericAge) ||
        numericAge < 18 ||
        numericAge > 65
    ) {
        errors.push(
            "Age must be between 18 and 65"
        );
    }

    // -----------------------------
    // WEIGHT
    // -----------------------------
    const numericWeight = Number(weight);

    if (
        !Number.isFinite(numericWeight) ||
        numericWeight < 45 ||
        numericWeight > 250
    ) {
        errors.push(
            "Weight must be between 45 and 250 kg"
        );
    }

    // -----------------------------
    // HEALTH ELIGIBILITY
    // -----------------------------
    if (
        typeof healthEligible !== "boolean"
    ) {
        errors.push(
            "Health eligibility information is required"
        );
    }

    // -----------------------------
    // LAST DONATION DATE
    // -----------------------------
    if (lastDonationDate) {

        const donationDate =
            new Date(lastDonationDate);

        if (
            Number.isNaN(
                donationDate.getTime()
            )
        ) {
            errors.push(
                "Invalid last donation date"
            );
        } else if (
            donationDate > new Date()
        ) {
            errors.push(
                "Last donation date cannot be in the future"
            );
        }
    }

    // -----------------------------
    // LOCATION
    // -----------------------------
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
        !Number.isFinite(lat) ||
        lat < -90 ||
        lat > 90
    ) {
        errors.push(
            "Invalid latitude"
        );
    }

    if (
        !Number.isFinite(lng) ||
        lng < -180 ||
        lng > 180
    ) {
        errors.push(
            "Invalid longitude"
        );
    }

    return errors;
}

module.exports = {
    validateDonor,
    validBloodGroups
};