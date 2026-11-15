
const { db } = require("../config/firebase");
const { calculateDistance } = require("../utils/distance");

// =====================================
// DONOR ELIGIBILITY
// =====================================

function isDonorEligible(data) {
    // Explicitly ineligible donors are excluded.
    if (data.eligibilityStatus === "ineligible") {
        return false;
    }

    // Exclude donors who have not confirmed health eligibility.
    // Legacy donor records without this field remain eligible
    // for matching only if they have no explicit false value.
    if (data.healthEligible === false) {
        return false;
    }

    // Check next eligible date when one exists.
    if (data.nextEligibleDate) {
        const nextDate =
            data.nextEligibleDate.toDate
                ? data.nextEligibleDate.toDate()
                : new Date(data.nextEligibleDate);

        if (
            Number.isNaN(nextDate.getTime()) ||
            nextDate > new Date()
        ) {
            return false;
        }
    }

    // Check last donation date as a fallback for older records.
    if (data.lastDonationDate) {
        const lastDate =
            data.lastDonationDate.toDate
                ? data.lastDonationDate.toDate()
                : new Date(data.lastDonationDate);

        if (Number.isNaN(lastDate.getTime())) {
            return false;
        }

        const daysSinceDonation =
            (Date.now() - lastDate.getTime()) /
            (1000 * 60 * 60 * 24);

        if (daysSinceDonation < 90) {
            return false;
        }
    }

    return true;
}


// =====================================
// FIND NEARBY DONORS
// =====================================

async function findNearbyDonors(
    bloodGroup,
    latitude,
    longitude,
    radius
) {
    const snapshot = await db
        .collection("donors")
        .where("bloodGroup", "==", bloodGroup)
        .where("availability", "==", true)
        .get();

    const donors = [];

    snapshot.forEach((doc) => {
        const data = doc.data();

        // Only verified donors can appear in emergency matches
        if (data.verificationStatus !== "verified") {
         return;
        }

        // Exclude donors assigned to an emergency.
        if (data.currentEmergencyId) {
            return;
        }

        if (!isDonorEligible(data)) {
            return;
        }

        if (
            !data.location ||
            !Number.isFinite(data.location.latitude) ||
            !Number.isFinite(data.location.longitude)
        ) {
            return;
        }

        const distance = calculateDistance(
            latitude,
            longitude,
            data.location.latitude,
            data.location.longitude
        );

        if (distance > radius) {
            return;
        }

        // Do not expose exact donor coordinates in the result.
        donors.push({
            id: doc.id,
            name: data.name || "Blood Donor",
            bloodGroup: data.bloodGroup,
            age: data.age ?? null,
            gender: data.gender ?? null,
            availability: data.availability,
            verificationStatus:
                data.verificationStatus || "pending",
            distance: Number(distance.toFixed(2))
        });
    });

    // Prioritize verified donors, then nearest distance.
    donors.sort((a, b) => {
        const aVerified =
            a.verificationStatus === "verified" ? 1 : 0;

        const bVerified =
            b.verificationStatus === "verified" ? 1 : 0;

        if (aVerified !== bVerified) {
            return bVerified - aVerified;
        }

        return a.distance - b.distance;
    });

    return donors;
}

module.exports = {
    findNearbyDonors
};
