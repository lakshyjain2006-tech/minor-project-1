const {
    findNearbyDonors
} = require("../services/nearbyDonorService");


// Find nearby donors
const getNearbyDonors = async (req, res) => {

    try {

        const {
            bloodGroup,
            latitude,
            longitude,
            radius
        } = req.query;


        // Basic validation
        if (!bloodGroup) {

            return res.status(400).json({
                success: false,
                message:
                    "Blood group is required"
            });

        }


        const lat =
            Number(latitude);

        const lon =
            Number(longitude);

        const searchRadius =
            Number(radius);


        // Coordinate validation
        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Valid latitude and longitude are required"
            });

        }


        if (
            lat < -90 ||
            lat > 90
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid latitude"
            });

        }


        if (
            lon < -180 ||
            lon > 180
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid longitude"
            });

        }


        // Radius validation
        if (
            !Number.isFinite(searchRadius) ||
            searchRadius <= 0 ||
            searchRadius > 50
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Radius must be between 1 and 50 km"
            });

        }


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


        if (
            !validBloodGroups.includes(
                bloodGroup
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid blood group"
            });

        }


        const donors =
            await findNearbyDonors(
                bloodGroup,
                lat,
                lon,
                searchRadius
            );


        res.json({

            success: true,

            search: {
                bloodGroup,
                latitude: lat,
                longitude: lon,
                radius: searchRadius
            },

            count:
                donors.length,

            donors

        });

    } catch (error) {

        console.error(
            "Nearby donor search error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to find nearby donors"

        });

    }

};


module.exports = {
    getNearbyDonors
};