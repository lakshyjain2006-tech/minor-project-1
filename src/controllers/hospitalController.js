// =====================================
// BLOOD-BRIDGE HOSPITAL CONTROLLER
// =====================================

const { db } = require("../config/firebase");


// =====================================
// REGISTER HOSPITAL
// =====================================

const registerHospital = async (req, res) => {

    try {

        const {
            hospitalName,
            registrationNumber,
            phone,
            email,
            address,
            city,
            latitude,
            longitude,
            bloodBankAvailable,
            bloodBankContact
        } = req.body;


        // =====================================
        // REQUIRED FIELD VALIDATION
        // =====================================

        if (
            !hospitalName ||
            hospitalName.trim().length < 2
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Hospital name is required"

            });

        }


        if (
            !registrationNumber ||
            registrationNumber.trim().length < 3
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Hospital registration number is required"

            });

        }


        if (!phone) {

            return res.status(400).json({

                success: false,

                message:
                    "Hospital phone number is required"

            });

        }


        // =====================================
        // PHONE VALIDATION
        // =====================================

        const phoneRegex =
            /^[6-9]\d{9}$/;


        if (
            !phoneRegex.test(
                String(phone).trim()
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Enter a valid 10-digit Indian phone number"

            });

        }


        // =====================================
        // EMAIL VALIDATION
        // =====================================

        if (email) {

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (
                !emailRegex.test(
                    String(email).trim()
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Enter a valid email address"

                });

            }

        }


        // =====================================
        // ADDRESS VALIDATION
        // =====================================

        if (
            !address ||
            address.trim().length < 5
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Hospital address is required"

            });

        }


        if (
            !city ||
            city.trim().length < 2
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Hospital city is required"

            });

        }


        // =====================================
        // LOCATION VALIDATION
        // =====================================

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
                    "Valid hospital latitude and longitude are required"

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


        // =====================================
        // BLOOD BANK
        // =====================================

        const hasBloodBank =
            bloodBankAvailable === true ||
            bloodBankAvailable === "true";


        if (
            hasBloodBank &&
            bloodBankContact
        ) {

            const bloodBankPhoneRegex =
                /^[6-9]\d{9}$/;


            if (
                !bloodBankPhoneRegex.test(
                    String(
                        bloodBankContact
                    ).trim()
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Enter a valid blood bank contact number"

                });

            }

        }


        // =====================================
        // CHECK DUPLICATE REGISTRATION
        // =====================================

        const existingHospitalSnapshot =
            await db
                .collection("hospitals")
                .where(
                    "registrationNumber",
                    "==",
                    registrationNumber
                        .trim()
                )
                .limit(1)
                .get();


        if (
            !existingHospitalSnapshot.empty
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "A hospital with this registration number is already registered"

            });

        }


        // =====================================
        // CREATE HOSPITAL
        // =====================================

        const hospitalData = {

            hospitalName:
                hospitalName.trim(),

            registrationNumber:
                registrationNumber.trim(),

            phone:
                String(phone).trim(),

            email:
                email
                    ? String(email)
                        .trim()
                        .toLowerCase()
                    : "",

            address:
                address.trim(),

            city:
                city.trim(),

            location: {

                latitude:
                    lat,

                longitude:
                    lon

            },

            bloodBankAvailable:
                hasBloodBank,

            bloodBankContact:
                hasBloodBank &&
                bloodBankContact
                    ? String(
                        bloodBankContact
                    ).trim()
                    : "",

            // =================================
            // VERIFICATION
            // =================================

            verificationStatus:
                "pending",

            verifiedAt:
                null,

            verifiedBy:
                null,

            // =================================
            // STATUS
            // =================================

            status:
                "pending",

            createdAt:
                new Date(),

            updatedAt:
                new Date()

        };


        // =====================================
        // SAVE TO FIRESTORE
        // =====================================

        const hospitalRef =
            await db
                .collection("hospitals")
                .add(
                    hospitalData
                );


        console.log(
            "================================="
        );

        console.log(
            "🏥 HOSPITAL REGISTERED"
        );

        console.log(
            "Hospital ID:",
            hospitalRef.id
        );

        console.log(
            "Hospital:",
            hospitalData.hospitalName
        );

        console.log(
            "Verification: pending"
        );

        console.log(
            "================================="
        );


        // =====================================
        // RESPONSE
        // =====================================

        return res.status(201).json({

            success: true,

            message:
                "Hospital registered successfully. Waiting for verification.",

            hospitalId:
                hospitalRef.id,

            hospital: {

                id:
                    hospitalRef.id,

                hospitalName:
                    hospitalData.hospitalName,

                registrationNumber:
                    hospitalData.registrationNumber,

                phone:
                    hospitalData.phone,

                email:
                    hospitalData.email,

                address:
                    hospitalData.address,

                city:
                    hospitalData.city,

                location:
                    hospitalData.location,

                bloodBankAvailable:
                    hospitalData.bloodBankAvailable,

                verificationStatus:
                    hospitalData.verificationStatus,

                status:
                    hospitalData.status

            }

        });


    } catch (error) {

        console.error(
            "❌ Hospital registration error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to register hospital"

        });

    }

};


// =====================================
// GET HOSPITAL BY ID
// =====================================

const getHospitalById = async (
    req,
    res
) => {

    try {

        const {
            hospitalId
        } = req.params;


        if (!hospitalId) {

            return res.status(400).json({

                success: false,

                message:
                    "Hospital ID is required"

            });

        }


        const hospitalRef =
            db
                .collection("hospitals")
                .doc(hospitalId);


        const snapshot =
            await hospitalRef.get();


        if (!snapshot.exists) {

            return res.status(404).json({

                success: false,

                message:
                    "Hospital not found"

            });

        }


        const hospital =
            snapshot.data();


        return res.json({

            success: true,

            hospital: {

                id:
                    snapshot.id,

                ...hospital

            }

        });


    } catch (error) {

        console.error(
            "❌ Get hospital error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to get hospital"

        });

    }

};


// =====================================
// GET VERIFIED HOSPITALS
// =====================================

const getVerifiedHospitals =
    async (
        req,
        res
    ) => {

        try {

            const snapshot =
                await db
                    .collection("hospitals")
                    .where(
                        "verificationStatus",
                        "==",
                        "verified"
                    )
                    .where(
                        "status",
                        "==",
                        "active"
                    )
                    .get();


            const hospitals =
                snapshot.docs.map(
                    doc => ({

                        id:
                            doc.id,

                        hospitalName:
                            doc.data()
                                .hospitalName,

                        city:
                            doc.data()
                                .city,

                        address:
                            doc.data()
                                .address,

                        location:
                            doc.data()
                                .location,

                        bloodBankAvailable:
                            doc.data()
                                .bloodBankAvailable

                    })
                );


            return res.json({

                success: true,

                count:
                    hospitals.length,

                hospitals

            });


        } catch (error) {

            console.error(
                "❌ Get verified hospitals error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to get verified hospitals"

            });

        }

    };


// =====================================
// EXPORT
// =====================================

module.exports = {

    registerHospital,

    getHospitalById,

    getVerifiedHospitals

};