const { db } = require("../config/firebase");
const { geohashForLocation } = require("geofire-common");
const { validateDonor } = require("../utils/donorValidation");

const registerDonor = async (req, res) => {
    try {
        const errors = validateDonor(req.body);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors
            });
        }

        const {
            name,
            phone,
            bloodGroup,
            age,
            gender,
            latitude,
            longitude
        } = req.body;

        const lat = Number(latitude);
        const lng = Number(longitude);

        const geohash = geohashForLocation([lat, lng]);

        const donorData = {
            name: name.trim(),
            phone: phone.trim(),
            bloodGroup,
            age: Number(age),
            gender: gender || null,

            location: {
                latitude: lat,
                longitude: lng,
                geohash
            },

            availability: true,
            verificationStatus: "pending",
            donationCount: 0,

            createdAt: new Date(),
            updatedAt: new Date()
        };

        const donorRef = await db
            .collection("donors")
            .add(donorData);

        return res.status(201).json({
            success: true,
            message: "Donor registered successfully",
            donorId: donorRef.id
        });

    } catch (error) {
        console.error("Donor registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to register donor"
        });
    }
};

module.exports = {
    registerDonor
};