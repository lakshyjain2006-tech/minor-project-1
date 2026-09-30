const express = require("express");

const {
    searchLocation,
    reverseLocation,
    getDistance
} = require("../controllers/locationController");

const router =
    express.Router();


// Search location
router.get(
    "/search",
    searchLocation
);


// Reverse geocoding
router.get(
    "/reverse",
    reverseLocation
);


// Calculate distance
router.get(
    "/distance",
    getDistance
);


module.exports = router;