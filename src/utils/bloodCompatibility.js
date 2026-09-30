// =====================================
// BLOOD COMPATIBILITY
// =====================================

const compatibility = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],

    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],

    "AB+": [
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-"
    ],

    "AB-": [
        "A-",
        "B-",
        "AB-",
        "O-"
    ],

    "O+": ["O+", "O-"],
    "O-": ["O-"]
};


// Check whether donor can donate to recipient
function isCompatible(
    donorBloodGroup,
    recipientBloodGroup
) {
    const allowedDonors =
        compatibility[recipientBloodGroup];

    if (!allowedDonors) {
        return false;
    }

    return allowedDonors.includes(
        donorBloodGroup
    );
}


// Get compatible donor groups
function getCompatibleGroups(
    recipientBloodGroup
) {
    return compatibility[
        recipientBloodGroup
    ] || [];
}


module.exports = {
    isCompatible,
    getCompatibleGroups
};