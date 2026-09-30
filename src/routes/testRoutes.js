const express = require("express");
const { db } = require("../config/firebase");

const router = express.Router();

router.post("/add", async (req, res) => {
    try {
        const testData = {
            name: "Blood-Bridge Test",
            message: "Firestore is working!",
            createdAt: new Date()
        };

        const docRef = await db.collection("test").add(testData);

        res.status(201).json({
            success: true,
            message: "Data added to Firestore",
            id: docRef.id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Firestore error"
        });
    }
});

module.exports = router;