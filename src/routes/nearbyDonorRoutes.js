const express = require("express");

const {
    getNearbyDonors
} = require("../controllers/nearbyDonorController");


const router =
    express.Router();


router.get(
    "/",
    getNearbyDonors
);


module.exports = router;