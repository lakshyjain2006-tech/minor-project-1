// =====================================
// BLOOD-BRIDGE EMERGENCY CONTROLLER
// =====================================

const { db } = require("../config/firebase");

const {
    findNearbyDonors
} = require("../services/nearbyDonorService");

const {
    getCompatibleGroups,
    isCompatible
} = require("../utils/bloodCompatibility");


// =====================================
// CREATE EMERGENCY REQUEST
// =====================================

const createEmergencyRequest = async (req, res) => {

    try {

        const {
            patientName,
            bloodGroup,
            unitsRequired,
            hospitalName,
            latitude,
            longitude,
            radius
        } = req.body;


        // =====================================
        // BASIC VALIDATION
        // =====================================

        if (
            !patientName ||
            patientName.trim().length < 2
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Patient name is required"
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


        const units =
            Number(unitsRequired);


        if (
            !Number.isFinite(units) ||
            units <= 0 ||
            units > 10
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Units required must be between 1 and 10"
            });

        }


        // =====================================
        // LOCATION
        // =====================================

        const lat =
            Number(latitude);

        const lon =
            Number(longitude);

        const searchRadius =
            Number(radius);


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


        if (
            !Number.isFinite(searchRadius) ||
            searchRadius < 1 ||
            searchRadius > 50
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Radius must be between 1 and 50 km"
            });

        }


        // =====================================
        // BLOOD COMPATIBILITY
        // =====================================

        const compatibleGroups =
            getCompatibleGroups(
                bloodGroup
            );


        console.log(
            "🩸 Recipient blood group:",
            bloodGroup
        );


        console.log(
            "🩸 Compatible donor groups:",
            compatibleGroups
        );


        // =====================================
        // FIND NEARBY COMPATIBLE DONORS
        // =====================================

        let donors = [];


        for (
            const donorBloodGroup
            of compatibleGroups
        ) {

            const matchingDonors =
                await findNearbyDonors(
                    donorBloodGroup,
                    lat,
                    lon,
                    searchRadius
                );


            donors.push(
                ...matchingDonors
            );

        }


        // =====================================
        // REMOVE UNAVAILABLE DONORS
        // =====================================

        donors =
            donors.filter(
                donor =>
                    donor.availability !== false
            );


        // =====================================
        // REMOVE DUPLICATE DONORS
        // =====================================

        const uniqueDonors =
            new Map();


        donors.forEach(
            donor => {

                const id =
                    donor.id ||
                    donor.donorId ||
                    donor.authUid ||
                    donor.phone ||
                    donor.name;


                if (!uniqueDonors.has(id)) {

                    uniqueDonors.set(
                        id,
                        donor
                    );

                }

            }
        );


        donors =
            Array.from(
                uniqueDonors.values()
            );


        // =====================================
        // SORT BY DISTANCE
        // =====================================

        donors.sort(
            (a, b) =>
                Number(a.distance) -
                Number(b.distance)
        );


        console.log(
            `✅ ${donors.length} compatible available donor(s) found`
        );


        // =====================================
        // CREATE EMERGENCY REQUEST
        // =====================================

        const emergencyRequest = {

            patientName:
                patientName.trim(),

            bloodGroup,

            unitsRequired:
                units,

            hospitalName:
                hospitalName
                    ? hospitalName.trim()
                    : "",

            location: {

                latitude:
                    lat,

                longitude:
                    lon

            },

            radius:
                searchRadius,

            status:
                "active",

            donorsFound:
                donors.length,

            compatibleBloodGroups:
                compatibleGroups,

            donorResponses:
                [],

            matchedDonorId:
                null,

            matchedDonorName:
                null,

            createdAt:
                new Date(),

            updatedAt:
                new Date()

        };


        // =====================================
        // SAVE TO FIRESTORE
        // =====================================

        const docRef =
            await db
                .collection(
                    "emergencyRequests"
                )
                .add(
                    emergencyRequest
                );


        console.log(
            "================================="
        );

        console.log(
            "🧪 EMERGENCY REQUEST CREATED"
        );

        console.log(
            "Firestore Document ID:",
            docRef.id
        );

        console.log(
            "================================="
        );


        // =====================================
        // RESPONSE
        // =====================================

        res.status(201).json({

            success: true,

            message:
                "Emergency request created successfully",

            requestId:
                docRef.id,

            request: {

                id:
                    docRef.id,

                patientName:
                    emergencyRequest.patientName,

                bloodGroup:
                    emergencyRequest.bloodGroup,

                unitsRequired:
                    emergencyRequest.unitsRequired,

                hospitalName:
                    emergencyRequest.hospitalName,

                latitude:
                    lat,

                longitude:
                    lon,

                radius:
                    searchRadius,

                status:
                    "active",

                donorsFound:
                    donors.length,

                compatibleBloodGroups:
                    compatibleGroups

            },

            donors

        });


    } catch (error) {

        console.error(
            "❌ Emergency request error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to create emergency request"

        });

    }

};


// =====================================
// DONOR ACCEPT / REJECT EMERGENCY
// =====================================

const respondToEmergency = async (
    req,
    res
) => {

    try {

        const {
            requestId
        } = req.params;


        const {
            donorId,
            response
        } = req.body;


        // =====================================
        // VALIDATION
        // =====================================

        if (!requestId) {

            return res.status(400).json({

                success: false,

                message:
                    "Emergency request ID is required"

            });

        }


        if (!donorId) {

            return res.status(400).json({

                success: false,

                message:
                    "Donor ID is required"

            });

        }


        if (
            ![
                "accepted",
                "rejected"
            ].includes(response)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Response must be accepted or rejected"

            });

        }


        // =====================================
        // REFERENCES
        // =====================================

        const requestRef =
            db
                .collection(
                    "emergencyRequests"
                )
                .doc(requestId);


        const donorRef =
            db
                .collection(
                    "donors"
                )
                .doc(donorId);


        // =====================================
        // REJECT
        // =====================================

        if (
            response === "rejected"
        ) {

            await db.runTransaction(
                async transaction => {

                    const requestSnapshot =
                        await transaction.get(
                            requestRef
                        );


                    const donorSnapshot =
                        await transaction.get(
                            donorRef
                        );


                    if (
                        !requestSnapshot.exists
                    ) {

                        throw new Error(
                            "REQUEST_NOT_FOUND"
                        );

                    }


                    if (
                        !donorSnapshot.exists
                    ) {

                        throw new Error(
                            "DONOR_NOT_FOUND"
                        );

                    }


                    const requestData =
                        requestSnapshot.data();


                    const donorData =
                        donorSnapshot.data();


                    if (
                        requestData.status !==
                        "active"
                    ) {

                        throw new Error(
                            "REQUEST_NOT_ACTIVE"
                        );

                    }


                    const existingResponses =
                        Array.isArray(
                            requestData.donorResponses
                        )
                            ? requestData.donorResponses
                            : [];


                    const alreadyResponded =
                        existingResponses.some(
                            item =>
                                item.donorId ===
                                donorId
                        );


                    if (
                        alreadyResponded
                    ) {

                        throw new Error(
                            "ALREADY_RESPONDED"
                        );

                    }


                    const compatible =
                        isCompatible(
                            donorData.bloodGroup,
                            requestData.bloodGroup
                        );


                    if (!compatible) {

                        throw new Error(
                            "INCOMPATIBLE_BLOOD"
                        );

                    }


                    const donorResponse = {

                        donorId,

                        donorName:
                            donorData.name ||
                            "Unknown",

                        bloodGroup:
                            donorData.bloodGroup ||
                            "",

                        response:
                            "rejected",

                        respondedAt:
                            new Date()

                    };


                    transaction.update(
                        requestRef,
                        {

                            donorResponses: [
                                ...existingResponses,
                                donorResponse
                            ],

                            updatedAt:
                                new Date()

                        }
                    );

                }
            );


            return res.json({

                success: true,

                message:
                    "Emergency request rejected",

                requestId,

                donorId,

                response:
                    "rejected",

                requestStatus:
                    "active"

            });

        }


        // =====================================
        // ACCEPT
        // =====================================

        const result =
            await db.runTransaction(
                async transaction => {

                    // IMPORTANT:
                    // Read both documents BEFORE updating.
                    // This allows Firestore transaction
                    // protection against double booking.

                    const requestSnapshot =
                        await transaction.get(
                            requestRef
                        );


                    const donorSnapshot =
                        await transaction.get(
                            donorRef
                        );


                    // =================================
                    // REQUEST EXISTS
                    // =================================

                    if (
                        !requestSnapshot.exists
                    ) {

                        throw new Error(
                            "REQUEST_NOT_FOUND"
                        );

                    }


                    // =================================
                    // DONOR EXISTS
                    // =================================

                    if (
                        !donorSnapshot.exists
                    ) {

                        throw new Error(
                            "DONOR_NOT_FOUND"
                        );

                    }


                    const requestData =
                         requestSnapshot.data();

                    const donorData =
                        donorSnapshot.data();

                    // Donor must be verified before accepting
                    if (donorData.verificationStatus !== "verified") {
                        throw new Error("DONOR_NOT_VERIFIED");
                    }


                    // =================================
                    // REQUEST MUST BE ACTIVE
                    // =================================

                    if (
                        requestData.status !==
                        "active"
                    ) {

                        throw new Error(
                            "REQUEST_NOT_ACTIVE"
                        );

                    }


                    // =================================
                    // DONOR MUST BE AVAILABLE
                    // =================================

                    if (
                        donorData.availability ===
                        false
                    ) {

                        throw new Error(
                            "DONOR_UNAVAILABLE"
                        );

                    }


                    // =================================
                    // BLOOD COMPATIBILITY
                    // =================================

                    const compatible =
                        isCompatible(
                            donorData.bloodGroup,
                            requestData.bloodGroup
                        );


                    if (!compatible) {

                        throw new Error(
                            "INCOMPATIBLE_BLOOD"
                        );

                    }


                    // =================================
                    // PREVENT DUPLICATE RESPONSE
                    // =================================

                    const existingResponses =
                        Array.isArray(
                            requestData.donorResponses
                        )
                            ? requestData.donorResponses
                            : [];


                    const alreadyResponded =
                        existingResponses.some(
                            item =>
                                item.donorId ===
                                donorId
                        );


                    if (
                        alreadyResponded
                    ) {

                        throw new Error(
                            "ALREADY_RESPONDED"
                        );

                    }


                    // =================================
                    // DONOR RESPONSE
                    // =================================

                    const donorResponse = {

                        donorId,

                        donorName:
                            donorData.name ||
                            "Unknown",

                        bloodGroup:
                            donorData.bloodGroup ||
                            "",

                        response:
                            "accepted",

                        respondedAt:
                            new Date()

                    };


                    const updatedResponses = [

                        ...existingResponses,

                        donorResponse

                    ];


                    // =================================
                    // LOCK DONOR
                    // =================================

                    transaction.update(
                        donorRef,
                        {

                            availability:
                                false,

                            currentEmergencyId:
                                requestId,

                            currentEmergencyStatus:
                                "matched",

                            updatedAt:
                                new Date()

                        }
                    );


                    // =================================
                    // MATCH EMERGENCY
                    // =================================

                    transaction.update(
                        requestRef,
                        {

                            status:
                                "matched",

                            matchedDonorId:
                                donorId,

                            matchedDonorName:
                                donorData.name ||
                                "Unknown",

                            donorResponses:
                                updatedResponses,

                            updatedAt:
                                new Date()

                        }
                    );


                    return {

                        donorName:
                            donorData.name ||
                            "Unknown",

                        donorBloodGroup:
                            donorData.bloodGroup ||
                            ""

                    };

                }
            );


        // =====================================
        // SUCCESS
        // =====================================

        console.log(
            "================================="
        );

        console.log(
            "🤝 EMERGENCY MATCHED"
        );

        console.log(
            "Request ID:",
            requestId
        );

        console.log(
            "Donor ID:",
            donorId
        );

        console.log(
            "Donor availability: false"
        );

        console.log(
            "================================="
        );


        res.json({

            success: true,

            message:
                "Emergency request accepted",

            requestId,

            donorId,

            donorName:
                result.donorName,

            donorBloodGroup:
                result.donorBloodGroup,

            response:
                "accepted",

            requestStatus:
                "matched",

            donorAvailability:
                false

        });


    } catch (error) {

        console.error(
            "❌ Donor response error:",
            error
        );


        // =====================================
        // FRIENDLY ERRORS
        // =====================================

        if (error.message === "DONOR_NOT_VERIFIED") {
return res.status(403).json({
success: false,
message:
"Your donor account must be verified before accepting an emergency."
});
}

        if (
            error.message ===
            "REQUEST_NOT_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Emergency request not found"

            });

        }


        if (
            error.message ===
            "DONOR_NOT_FOUND"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Donor not found"

            });

        }


        if (
            error.message ===
            "REQUEST_NOT_ACTIVE"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "This emergency request is no longer active"

            });

        }


        if (
            error.message ===
            "DONOR_UNAVAILABLE"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "This donor is already assigned to another emergency"

            });

        }


        if (
            error.message ===
            "ALREADY_RESPONDED"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "This donor has already responded"

            });

        }


        if (
            error.message ===
            "INCOMPATIBLE_BLOOD"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Donor blood group is not compatible with this request"

            });

        }


        res.status(500).json({

            success: false,

            message:
                "Unable to process donor response"

        });

    }

};


// =====================================
// GET EMERGENCY REQUESTS FOR DONOR
// =====================================

const getEmergencyRequestsForDonor =
    async (
        req,
        res
    ) => {

        try {

            const requestedId =
                req.params.donorId;


            if (!requestedId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Donor ID or Firebase UID is required"

                });

            }


            // =====================================
            // FIND DONOR BY DOCUMENT ID
            // =====================================

            let donorSnapshot;

            let donorId;


            const directDonorRef =
                db
                    .collection("donors")
                    .doc(requestedId);


            const directSnapshot =
                await directDonorRef.get();


            if (
                directSnapshot.exists
            ) {

                donorSnapshot =
                    directSnapshot;

                donorId =
                    requestedId;

            } else {

                // =================================
                // FIND BY AUTH UID
                // =================================

                const authSnapshot =
                    await db
                        .collection("donors")
                        .where(
                            "authUid",
                            "==",
                            requestedId
                        )
                        .limit(1)
                        .get();


                if (
                    authSnapshot.empty
                ) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "No donor account is linked with this Firebase user"

                    });

                }


                donorSnapshot =
                    authSnapshot.docs[0];

                donorId =
                    donorSnapshot.id;

            }


            // =====================================
            // DONOR DATA
            // =====================================

            const donor =
                donorSnapshot.data();


            const donorBloodGroup =
                donor.bloodGroup;


            const donorLatitude =
                Number(
                    donor.location?.latitude
                );


            const donorLongitude =
                Number(
                    donor.location?.longitude
                );


            if (
                !Number.isFinite(
                    donorLatitude
                ) ||
                !Number.isFinite(
                    donorLongitude
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Donor location is not available"

                });

            }


            // =====================================
            // GET ACTIVE REQUESTS
            // =====================================

            const snapshot =
                await db
                    .collection(
                        "emergencyRequests"
                    )
                    .where(
                        "status",
                        "==",
                        "active"
                    )
                    .get();


            const requests = [];


            // =====================================
            // DISTANCE FUNCTION
            // =====================================

            function calculateDistance(
                lat1,
                lon1,
                lat2,
                lon2
            ) {

                const R =
                    6371;


                const dLat =
                    (
                        lat2 -
                        lat1
                    ) *
                    Math.PI /
                    180;


                const dLon =
                    (
                        lon2 -
                        lon1
                    ) *
                    Math.PI /
                    180;


                const a =
                    Math.sin(
                        dLat / 2
                    ) *
                    Math.sin(
                        dLat / 2
                    ) +

                    Math.cos(
                        lat1 *
                        Math.PI /
                        180
                    ) *

                    Math.cos(
                        lat2 *
                        Math.PI /
                        180
                    ) *

                    Math.sin(
                        dLon / 2
                    ) *
                    Math.sin(
                        dLon / 2
                    );


                const c =
                    2 *
                    Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                    );


                return R * c;

            }


            // =====================================
            // CHECK REQUESTS
            // =====================================

            snapshot.forEach(
                doc => {

                    const request =
                        doc.data();


                    // =================================
                    // BLOOD COMPATIBILITY
                    // =================================

                    const compatible =
                        isCompatible(
                            donorBloodGroup,
                            request.bloodGroup
                        );


                    if (!compatible) {

                        return;

                    }


                    // =================================
                    // REQUEST LOCATION
                    // =================================

                    const requestLatitude =
                        Number(
                            request.location?.latitude
                        );


                    const requestLongitude =
                        Number(
                            request.location?.longitude
                        );


                    if (
                        !Number.isFinite(
                            requestLatitude
                        ) ||
                        !Number.isFinite(
                            requestLongitude
                        )
                    ) {

                        return;

                    }


                    // =================================
                    // DISTANCE
                    // =================================

                    const distance =
                        calculateDistance(
                            donorLatitude,
                            donorLongitude,
                            requestLatitude,
                            requestLongitude
                        );


                    const requestRadius =
                        Number(
                            request.radius
                        );


                    // =================================
                    // RADIUS CHECK
                    // =================================

                    if (
                        !Number.isFinite(
                            requestRadius
                        ) ||
                        distance >
                        requestRadius
                    ) {

                        return;

                    }


                    // =================================
                    // PREVIOUS RESPONSE CHECK
                    // =================================

                    const donorResponses =
                        Array.isArray(
                            request.donorResponses
                        )
                            ? request.donorResponses
                            : [];


                    const alreadyResponded =
                        donorResponses.some(
                            item =>
                                item.donorId ===
                                donorId
                        );


                    if (
                        alreadyResponded
                    ) {

                        return;

                    }


                    // =================================
                    // ADD REQUEST
                    // =================================

                    requests.push({

                        requestId:
                            doc.id,

                        patientName:
                            request.patientName,

                        bloodGroup:
                            request.bloodGroup,

                        unitsRequired:
                            request.unitsRequired,

                        hospitalName:
                            request.hospitalName,

                        distance:
                            Number(
                                distance.toFixed(2)
                            ),

                        radius:
                            requestRadius,

                        latitude:
                            requestLatitude,

                        longitude:
                            requestLongitude,

                        status:
                            request.status,

                        createdAt:
                            request.createdAt

                    });

                }
            );


            // =====================================
            // SORT BY DISTANCE
            // =====================================

            requests.sort(
                (a, b) =>
                    a.distance -
                    b.distance
            );


            // =====================================
            // RESPONSE
            // =====================================

            res.json({

                success: true,

                donorId,

                authUid:
                    donor.authUid ||
                    null,

                donorName:
                    donor.name ||
                    "Unknown",

                donorBloodGroup,

                donorAvailability:
                    donor.availability !== false,

                currentEmergencyId:
                    donor.currentEmergencyId ||
                    null,

                currentEmergencyStatus:
                    donor.currentEmergencyStatus ||
                    null,

                count:
                    requests.length,

                requests

            });


        } catch (error) {

            console.error(
                "❌ Get donor emergency requests error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to fetch emergency requests"

            });

        }

    };


// =====================================
// GET EMERGENCY REQUEST STATUS
// =====================================

const getEmergencyRequestStatus =
    async (
        req,
        res
    ) => {

        try {

            const {
                requestId
            } = req.params;


            console.log(
                "🔎 Checking emergency request:",
                requestId
            );


            if (!requestId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Request ID is required"

                });

            }


            const docRef =
                db
                    .collection(
                        "emergencyRequests"
                    )
                    .doc(requestId);


            const docSnapshot =
                await docRef.get();


            console.log(
                "================================="
            );

            console.log(
                "🔎 STATUS CHECK"
            );

            console.log(
                "Request ID:",
                requestId
            );

            console.log(
                "Collection: emergencyRequests"
            );

            console.log(
                "Document exists:",
                docSnapshot.exists
            );

            console.log(
                "================================="
            );


            if (!docSnapshot.exists) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Emergency request not found",

                    requestId

                });

            }


            const data =
                docSnapshot.data();


            res.status(200).json({

                success: true,

                request: {

                    id:
                        docSnapshot.id,

                    ...data

                }

            });


        } catch (error) {

            console.error(
                "❌ Get emergency request status error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to get emergency request status"

            });

        }

    };


// =====================================
// CANCEL EMERGENCY REQUEST
// =====================================

const cancelEmergencyRequest =
    async (
        req,
        res
    ) => {

        try {

            const {
                requestId
            } = req.params;


            if (!requestId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Request ID is required"

                });

            }


            const requestRef =
                db
                    .collection(
                        "emergencyRequests"
                    )
                    .doc(requestId);


            const snapshot =
                await requestRef.get();


            if (!snapshot.exists) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Emergency request not found"

                });

            }


            const requestData =
                snapshot.data();


            if (
                requestData.status ===
                "completed"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This emergency request is already completed"

                });

            }


            if (
                requestData.status ===
                "cancelled"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This emergency request is already cancelled"

                });

            }


            // =====================================
            // RELEASE MATCHED DONOR IF ANY
            // =====================================

            if (
                requestData.matchedDonorId
            ) {

                const donorRef =
                    db
                        .collection("donors")
                        .doc(
                            requestData.matchedDonorId
                        );


                const donorSnapshot =
                    await donorRef.get();


                if (
                    donorSnapshot.exists
                ) {

                    const donorData =
                        donorSnapshot.data();


                    // Only release if this donor
                    // belongs to THIS emergency

                    if (
                        donorData.currentEmergencyId ===
                        requestId
                    ) {

                        await donorRef.update({

                            availability:
                                true,

                            currentEmergencyId:
                                null,

                            currentEmergencyStatus:
                                null,

                            updatedAt:
                                new Date()

                        });

                    }

                }

            }


            // =====================================
            // CANCEL REQUEST
            // =====================================

            await requestRef.update({

                status:
                    "cancelled",

                updatedAt:
                    new Date()

            });


            console.log(
                "❌ Emergency request cancelled:",
                requestId
            );


            res.json({

                success: true,

                message:
                    "Emergency request cancelled successfully",

                requestId,

                status:
                    "cancelled"

            });


        } catch (error) {

            console.error(
                "❌ Cancel emergency error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to cancel emergency request"

            });

        }

    };


// =====================================
// COMPLETE EMERGENCY REQUEST
// =====================================

const completeEmergencyRequest =
    async (
        req,
        res
    ) => {

        try {

            const {
                requestId
            } = req.params;


            if (!requestId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Request ID is required"

                });

            }


            const requestRef =
                db
                    .collection(
                        "emergencyRequests"
                    )
                    .doc(requestId);


            const snapshot =
                await requestRef.get();


            if (!snapshot.exists) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Emergency request not found"

                });

            }


            const requestData =
                snapshot.data();


            if (
                requestData.status ===
                "cancelled"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "A cancelled request cannot be completed"

                });

            }


            if (
                requestData.status ===
                "completed"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This emergency request is already completed"

                });

            }


            if (
                requestData.status !==
                "matched"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Emergency request must be matched before completion"

                });

            }


            // =====================================
            // RELEASE MATCHED DONOR
            // =====================================

            if (
                requestData.matchedDonorId
            ) {

                const donorRef =
                    db
                        .collection("donors")
                        .doc(
                            requestData.matchedDonorId
                        );


                const donorSnapshot =
                    await donorRef.get();


                if (
                    donorSnapshot.exists
                ) {

                    const donorData =
                        donorSnapshot.data();


                    // Only release the donor if
                    // they are currently locked
                    // to this emergency.

                    if (
                        donorData.currentEmergencyId ===
                        requestId
                    ) {

                        await donorRef.update({

                            availability:
                                true,

                            currentEmergencyId:
                                null,

                            currentEmergencyStatus:
                                null,

                            lastEmergencyCompletedAt:
                                new Date(),

                            updatedAt:
                                new Date()

                        });


                        console.log(
                            "🟢 Donor released:",
                            requestData.matchedDonorId
                        );

                    }

                }

            }


            // =====================================
            // COMPLETE REQUEST
            // =====================================

            await requestRef.update({

                status:
                    "completed",

                completedAt:
                    new Date(),

                updatedAt:
                    new Date()

            });


            console.log(
                "================================="
            );

            console.log(
                "✅ EMERGENCY COMPLETED"
            );

            console.log(
                "Request ID:",
                requestId
            );

            console.log(
                "Matched Donor:",
                requestData.matchedDonorId ||
                "None"
            );

            console.log(
                "================================="
            );


            res.json({

                success: true,

                message:
                    "Emergency request completed successfully",

                requestId,

                status:
                    "completed",

                donorReleased:
                    Boolean(
                        requestData.matchedDonorId
                    )

            });


        } catch (error) {

            console.error(
                "❌ Complete emergency error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to complete emergency request"

            });

        }

    };


// =====================================
// EXPORTS
// =====================================

module.exports = {

    createEmergencyRequest,

    getEmergencyRequestStatus,

    respondToEmergency,

    getEmergencyRequestsForDonor,

    cancelEmergencyRequest,

    completeEmergencyRequest

};