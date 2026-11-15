const { db } = require("../config/firebase");
const { geohashForLocation } = require("geofire-common");
const { validateDonor } = require("../utils/donorValidation");

const DONATION_GAP_DAYS = 90;


// =====================================
// CALCULATE NEXT ELIGIBLE DATE
// =====================================

function calculateNextEligibleDate(
    lastDonationDate
) {
    if (!lastDonationDate) {
        return null;
    }

    const date =
        new Date(lastDonationDate);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    date.setDate(
        date.getDate() +
        DONATION_GAP_DAYS
    );

    return date;
}


// =====================================
// REGISTER DONOR
// =====================================

const registerDonor = async (
    req,
    res
) => {

    try {

        const errors =
            validateDonor(
                req.body
            );

        if (errors.length > 0) {

            return res.status(400).json({
                success: false,
                message:
                    "Validation failed",
                errors
            });

        }


        const {
            name,
            phone,
            bloodGroup,
            age,
            gender,
            weight,
            healthEligible,
            lastDonationDate,
            latitude,
            longitude
        } = req.body;


        const lat =
            Number(latitude);

        const lng =
            Number(longitude);


        const geohash =
            geohashForLocation([
                lat,
                lng
            ]);


        const nextEligibleDate =
            calculateNextEligibleDate(
                lastDonationDate
            );


        // =====================================
        // DONOR DATA
        // =====================================

        const donorData = {

            name:
                name.trim(),

            phone:
                phone.trim(),

            bloodGroup,

            age:
                Number(age),

            gender:
                gender || null,

            weight:
                Number(weight),

            healthEligible:
                Boolean(
                    healthEligible
                ),

            lastDonationDate:
                lastDonationDate
                    ? new Date(
                        lastDonationDate
                    )
                    : null,

            nextEligibleDate,

            donationCount:
                0,

            location: {

                latitude: lat,

                longitude: lng,

                geohash

            },

            availability:
                true,

            verificationStatus:
                "pending",

            eligibilityStatus:
                healthEligible
                    ? "eligible"
                    : "ineligible",

            currentEmergencyId:
                null,

            currentEmergencyStatus:
                null,

            createdAt:
                new Date(),

            updatedAt:
                new Date()
        };


        // =====================================
        // SAVE DONOR
        // =====================================

        const donorRef =
            await db
                .collection("donors")
                .add(
                    donorData
                );


        // =====================================
        // RESPONSE
        // =====================================

        return res.status(201).json({

            success: true,

            message:
                "Donor registered successfully",

            donorId:
                donorRef.id

        });

    }

    catch (error) {

        console.error(
            "Donor registration error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to register donor"

        });

    }
};


module.exports = {
    registerDonor
};