const express = require("express");

const {
    createEmergencyRequest,
    getEmergencyRequestStatus,
    respondToEmergency,
    getEmergencyRequestsForDonor,
    cancelEmergencyRequest,
    completeEmergencyRequest
} = require("../controllers/emergencyController");

const router = express.Router();


// =====================================
// CREATE EMERGENCY REQUEST
// =====================================

router.post(
    "/create",
    createEmergencyRequest
);


// =====================================
// GET EMERGENCY REQUEST STATUS
// =====================================

router.get(
    "/status/:requestId",
    getEmergencyRequestStatus
);


// =====================================
// DONOR ACCEPT / REJECT
// =====================================

router.post(
    "/:requestId/respond",
    respondToEmergency
);


// =====================================
// GET REQUESTS FOR DONOR
// =====================================

router.get(
    "/for-donor/:donorId",
    getEmergencyRequestsForDonor
);


// =====================================
// CANCEL EMERGENCY REQUEST
// =====================================

router.post(
    "/:requestId/cancel",
    cancelEmergencyRequest
);


// =====================================
// COMPLETE EMERGENCY REQUEST
// =====================================

router.post(
    "/:requestId/complete",
    completeEmergencyRequest
);


module.exports = router;