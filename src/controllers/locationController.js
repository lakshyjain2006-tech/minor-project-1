const {
    searchAddress,
    reverseGeocode
} = require("../services/geocodingService");

const {
    calculateDistance
} = require("../utils/distance");


// ==========================================
// SEARCH LOCATION
// ==========================================

const searchLocation = async (req, res) => {

    try {

        const query =
            req.query.q;


        if (!query || query.trim().length < 3) {

            return res.status(400).json({

                success: false,

                message:
                    "Search query must contain at least 3 characters"

            });

        }


        const results =
            await searchAddress(
                query.trim()
            );


        const locations =
            results.map(place => ({

                displayName:
                    place.display_name,

                latitude:
                    Number(place.lat),

                longitude:
                    Number(place.lon),

                type:
                    place.type,

                address:
                    place.address || {}

            }));


        res.json({

            success: true,

            count:
                locations.length,

            locations

        });

    }

    catch (error) {

        console.error(
            "Location search error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to search location"

        });

    }

};


// ==========================================
// REVERSE LOCATION
// ==========================================

const reverseLocation = async (req, res) => {

    try {

        const {
            latitude,
            longitude
        } = req.query;


        const lat =
            Number(latitude);

        const lon =
            Number(longitude);


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
            lat > 90 ||
            lon < -180 ||
            lon > 180
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid coordinates"

            });

        }


        const result =
            await reverseGeocode(
                lat,
                lon
            );


        res.json({

            success: true,

            location: {

                displayName:
                    result.display_name,

                latitude:
                    Number(result.lat),

                longitude:
                    Number(result.lon),

                address:
                    result.address || {}

            }

        });

    }

    catch (error) {

        console.error(
            "Reverse geocoding error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to identify this location"

        });

    }

};
// CALCULATE DISTANCE
const getDistance = (req, res) => {

    try {

        const {
            latitude1,
            longitude1,
            latitude2,
            longitude2
        } = req.query;


        const lat1 =
            Number(latitude1);

        const lon1 =
            Number(longitude1);

        const lat2 =
            Number(latitude2);

        const lon2 =
            Number(longitude2);


        // Validate numbers
        if (
            !Number.isFinite(lat1) ||
            !Number.isFinite(lon1) ||
            !Number.isFinite(lat2) ||
            !Number.isFinite(lon2)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Valid coordinates are required"
            });

        }


        // Validate latitude
        if (
            lat1 < -90 ||
            lat1 > 90 ||
            lat2 < -90 ||
            lat2 > 90
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid latitude"
            });

        }


        // Validate longitude
        if (
            lon1 < -180 ||
            lon1 > 180 ||
            lon2 < -180 ||
            lon2 > 180
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid longitude"
            });

        }


        const distance =
            calculateDistance(
                lat1,
                lon1,
                lat2,
                lon2
            );


        res.json({

            success: true,

            distance: Number(
                distance.toFixed(2)
            ),

            unit: "km"

        });

    } catch (error) {

        console.error(
            "Distance calculation error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to calculate distance"

        });

    }

};


module.exports = {
    searchLocation,
    reverseLocation,
    getDistance
};