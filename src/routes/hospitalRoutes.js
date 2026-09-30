const express = require("express");

const {
    registerHospital,
    getHospitalById,
    getVerifiedHospitals
} = require("../controllers/hospitalController");


const router =
    express.Router();


// =====================================
// REGISTER HOSPITAL
// =====================================

router.post(
    "/register",
    registerHospital
);


// =====================================
// GET VERIFIED HOSPITALS
// =====================================

router.get(
    "/verified",
    getVerifiedHospitals
);


// =====================================
// GET HOSPITAL BY ID
// =====================================

router.get(
    "/:hospitalId",
    getHospitalById
);


module.exports = router;