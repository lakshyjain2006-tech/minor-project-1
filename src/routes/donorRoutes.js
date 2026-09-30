const express = require("express");

const {
    registerDonor
} = require("../controllers/donorController");

const router = express.Router();

router.post("/register", registerDonor);

module.exports = router;
