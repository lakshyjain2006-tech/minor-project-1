// =====================================
// BLOOD-BRIDGE DOCUMENT CONTROLLER
// =====================================

const fs = require("fs");
const path = require("path");

const {
    db
} = require("../config/firebase");


// =====================================
// UPLOAD DIRECTORIES
// =====================================

const uploadsRoot =
    path.join(
        __dirname,
        "../../uploads"
    );

const donorsDirectory =
    path.join(
        uploadsRoot,
        "donors"
    );

const hospitalsDirectory =
    path.join(
        uploadsRoot,
        "hospitals"
    );


// =====================================
// CREATE DIRECTORIES
// =====================================

fs.mkdirSync(
    donorsDirectory,
    {
        recursive: true
    }
);

fs.mkdirSync(
    hospitalsDirectory,
    {
        recursive: true
    }
);


// =====================================
// ALLOWED DOCUMENT TYPES
// =====================================

const allowedDocumentTypes = {

    donor: [

        "blood_group_report",

        "medical_report"

    ],

    hospital: [

        "hospital_registration_certificate",

        "hospital_license",

        "blood_bank_certificate"

    ]

};


// =====================================
// SAFE FILE DELETE
// =====================================

function deleteFile(
    filePath
) {

    try {

        if (
            filePath &&
            fs.existsSync(
                filePath
            )
        ) {

            fs.unlinkSync(
                filePath
            );

        }

    } catch (error) {

        console.error(
            "File cleanup error:",
            error
        );

    }

}


// =====================================
// UPLOAD DOCUMENT
// =====================================

const uploadDocument = async (
    req,
    res
) => {

    try {

        console.log(
            "================================="
        );

        console.log(
            "📄 DOCUMENT UPLOAD REQUEST"
        );

        console.log(
            "Body:",
            req.body
        );

        console.log(
            "File:",
            req.file
                ? req.file.originalname
                : "NO FILE"
        );


        // =================================
        // FILE REQUIRED
        // =================================

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "Document file is required"

            });

        }


        // =================================
        // FORM DATA
        // =================================

        const {
            ownerType,
            ownerId,
            documentType
        } = req.body;


        // =================================
        // OWNER TYPE
        // =================================

        if (
            ![
                "donor",
                "hospital"
            ].includes(
                ownerType
            )
        ) {

            deleteFile(
                req.file.path
            );

            return res.status(400).json({

                success: false,

                message:
                    "ownerType must be donor or hospital"

            });

        }


        // =================================
        // OWNER ID
        // =================================

        if (
            !ownerId ||
            String(ownerId)
                .trim()
                .length < 3
        ) {

            deleteFile(
                req.file.path
            );

            return res.status(400).json({

                success: false,

                message:
                    "Valid ownerId is required"

            });

        }


        // =================================
        // DOCUMENT TYPE
        // =================================

        const allowedTypes =
            allowedDocumentTypes[
                ownerType
            ];


        if (
            !allowedTypes ||
            !allowedTypes.includes(
                documentType
            )
        ) {

            deleteFile(
                req.file.path
            );

            return res.status(400).json({

                success: false,

                message:
                    "Invalid document type"

            });

        }


        // =================================
        // CHECK OWNER
        // =================================

        const collectionName =
            ownerType === "donor"
                ? "donors"
                : "hospitals";


        const ownerRef =
            db
                .collection(
                    collectionName
                )
                .doc(
                    ownerId
                );


        const ownerSnapshot =
            await ownerRef.get();


        if (
            !ownerSnapshot.exists
        ) {

            deleteFile(
                req.file.path
            );

            return res.status(404).json({

                success: false,

                message:
                    `${ownerType} not found`

            });

        }


        // =================================
        // FINAL DIRECTORY
        // =================================

        const finalDirectory =
            ownerType === "donor"
                ? donorsDirectory
                : hospitalsDirectory;


        const finalPath =
            path.join(
                finalDirectory,
                req.file.filename
            );


        // =================================
        // MOVE FILE
        // =================================

        fs.renameSync(
            req.file.path,
            finalPath
        );


        // =================================
        // DOCUMENT METADATA
        // =================================

        const documentData = {

            ownerId:
                String(
                    ownerId
                ).trim(),

            ownerType,

            documentType,

            originalFileName:
                req.file.originalname,

            storedFileName:
                req.file.filename,

            mimeType:
                req.file.mimetype,

            fileSize:
                req.file.size,

            filePath:
                finalPath,

            verificationStatus:
                "pending",

            verifiedBy:
                null,

            verifiedAt:
                null,

            rejectionReason:
                null,

            createdAt:
                new Date(),

            updatedAt:
                new Date()

        };


        // =================================
        // SAVE METADATA
        // =================================

        const documentRef =
            await db
                .collection(
                    "medicalDocuments"
                )
                .add(
                    documentData
                );


        console.log(
            "📄 Document ID:",
            documentRef.id
        );

        console.log(
            "Owner:",
            ownerType,
            ownerId
        );

        console.log(
            "Type:",
            documentType
        );

        console.log(
            "Verification: pending"
        );

        console.log(
            "================================="
        );


        return res.status(201).json({

            success: true,

            message:
                "Document uploaded successfully and is waiting for verification",

            documentId:
                documentRef.id,

            document: {

                id:
                    documentRef.id,

                ownerId,

                ownerType,

                documentType,

                originalFileName:
                    req.file.originalname,

                mimeType:
                    req.file.mimetype,

                fileSize:
                    req.file.size,

                verificationStatus:
                    "pending"

            }

        });


    } catch (error) {

        console.error(
            "❌ Document upload error:",
            error
        );


        if (
            req.file &&
            req.file.path
        ) {

            deleteFile(
                req.file.path
            );

        }


        return res.status(500).json({

            success: false,

            message:
                "Unable to upload document"

        });

    }

};


// =====================================
// GET DOCUMENTS FOR OWNER
// =====================================

const getDocumentsForOwner =
    async (
        req,
        res
    ) => {

        try {

            const {
                ownerType,
                ownerId
            } = req.params;


            if (
                ![
                    "donor",
                    "hospital"
                ].includes(
                    ownerType
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid owner type"

                });

            }


            if (!ownerId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Owner ID is required"

                });

            }


            const snapshot =
                await db
                    .collection(
                        "medicalDocuments"
                    )
                    .where(
                        "ownerType",
                        "==",
                        ownerType
                    )
                    .where(
                        "ownerId",
                        "==",
                        ownerId
                    )
                    .get();


            const documents =
                snapshot.docs.map(
                    doc => {

                        const data =
                            doc.data();


                        return {

                            id:
                                doc.id,

                            ownerType:
                                data.ownerType,

                            ownerId:
                                data.ownerId,

                            documentType:
                                data.documentType,

                            originalFileName:
                                data.originalFileName,

                            mimeType:
                                data.mimeType,

                            fileSize:
                                data.fileSize,

                            verificationStatus:
                                data.verificationStatus,

                            rejectionReason:
                                data.rejectionReason ||
                                null,

                            createdAt:
                                data.createdAt,

                            verifiedAt:
                                data.verifiedAt ||
                                null

                        };

                    }
                );


            return res.json({

                success: true,

                count:
                    documents.length,

                documents

            });


        } catch (error) {

            console.error(
                "❌ Get documents error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to get documents"

            });

        }

    };


// =====================================
// ADMIN AUTHENTICATION
// =====================================

function checkAdminKey(
    req
) {

    const configuredKey =
        process.env.ADMIN_KEY;

    const receivedKey =
        req.headers[
            "x-admin-key"
        ];


    if (
        !configuredKey
    ) {

        return false;

    }


    return (
        receivedKey ===
        configuredKey
    );

}


// =====================================
// GET PENDING DOCUMENTS
// =====================================

const getPendingDocuments =
    async (
        req,
        res
    ) => {

        try {

            if (
                !checkAdminKey(req)
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Admin authorization required"

                });

            }


            const snapshot =
                await db
                    .collection(
                        "medicalDocuments"
                    )
                    .where(
                        "verificationStatus",
                        "==",
                        "pending"
                    )
                    .get();


            const documents = [];


            for (
                const doc of snapshot.docs
            ) {

                const data =
                    doc.data();


                let owner = null;


                // =============================
                // GET HOSPITAL
                // =============================

                if (
                    data.ownerType ===
                    "hospital"
                ) {

                    const hospitalSnapshot =
                        await db
                            .collection(
                                "hospitals"
                            )
                            .doc(
                                data.ownerId
                            )
                            .get();


                    if (
                        hospitalSnapshot.exists
                    ) {

                        const hospital =
                            hospitalSnapshot.data();


                        owner = {

                            id:
                                hospitalSnapshot.id,

                            hospitalName:
                                hospital.hospitalName ||
                                "",

                            registrationNumber:
                                hospital.registrationNumber ||
                                "",

                            phone:
                                hospital.phone ||
                                "",

                            email:
                                hospital.email ||
                                "",

                            address:
                                hospital.address ||
                                "",

                            city:
                                hospital.city ||
                                "",

                            bloodBankAvailable:
                                hospital.bloodBankAvailable ??
                                false,

                            verificationStatus:
                                hospital.verificationStatus ||
                                "pending"

                        };

                    }

                }


                // =============================
                // GET DONOR
                // =============================

                if (
                    data.ownerType ===
                    "donor"
                ) {

                    const donorSnapshot =
                        await db
                            .collection(
                                "donors"
                            )
                            .doc(
                                data.ownerId
                            )
                            .get();


                    if (
                        donorSnapshot.exists
                    ) {

                        const donor =
                            donorSnapshot.data();


                        owner = {

                            id:
                                donorSnapshot.id,

                            name:
                                donor.name ||
                                "",

                            bloodGroup:
                                donor.bloodGroup ||
                                "",

                            phone:
                                donor.phone ||
                                "",

                            verificationStatus:
                                donor.verificationStatus ||
                                "pending"

                        };

                    }

                }


                documents.push({

                    id:
                        doc.id,

                    ownerId:
                        data.ownerId,

                    ownerType:
                        data.ownerType,

                    documentType:
                        data.documentType,

                    originalFileName:
                        data.originalFileName,

                    mimeType:
                        data.mimeType,

                    fileSize:
                        data.fileSize,

                    verificationStatus:
                        data.verificationStatus,

                    rejectionReason:
                        data.rejectionReason ||
                        null,

                    createdAt:
                        data.createdAt,

                    owner

                });

            }


            return res.json({

                success: true,

                count:
                    documents.length,

                documents

            });


        } catch (error) {

            console.error(
                "❌ Pending documents error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to get pending documents"

            });

        }

    };


// =====================================
// VIEW DOCUMENT
// =====================================

const viewDocument =
    async (
        req,
        res
    ) => {

        try {

            if (
                !checkAdminKey(req)
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Admin authorization required"

                });

            }


            const {
                documentId
            } = req.params;


            if (!documentId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Document ID is required"

                });

            }


            const documentRef =
                db
                    .collection(
                        "medicalDocuments"
                    )
                    .doc(
                        documentId
                    );


            const snapshot =
                await documentRef.get();


            if (
                !snapshot.exists
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Document not found"

                });

            }


            const data =
                snapshot.data();


            if (
                !data.filePath ||
                !fs.existsSync(
                    data.filePath
                )
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Document file not found"

                });

            }


            res.setHeader(
                "Content-Type",
                data.mimeType ||
                "application/octet-stream"
            );


            res.setHeader(
                "Content-Disposition",
                `inline; filename="${data.originalFileName}"`
            );


            return res.sendFile(
                path.resolve(
                    data.filePath
                )
            );


        } catch (error) {

            console.error(
                "❌ View document error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to open document"

            });

        }

    };


// =====================================
// VERIFY DOCUMENT
// =====================================

const verifyDocument =
    async (
        req,
        res
    ) => {

        try {

            if (
                !checkAdminKey(req)
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Admin authorization required"

                });

            }


            const {
                documentId
            } = req.params;


            if (!documentId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Document ID is required"

                });

            }


            const documentRef =
                db
                    .collection(
                        "medicalDocuments"
                    )
                    .doc(
                        documentId
                    );


            const documentSnapshot =
                await documentRef.get();


            if (
                !documentSnapshot.exists
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Document not found"

                });

            }


            const documentData =
                documentSnapshot.data();


            if (
                documentData.verificationStatus !==
                "pending"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This document has already been processed"

                });

            }


            const now =
                new Date();


            // =================================
            // VERIFY DOCUMENT
            // =================================

            await documentRef.update({

                verificationStatus:
                    "verified",

                verifiedBy:
                    "admin",

                verifiedAt:
                    now,

                rejectionReason:
                    null,

                updatedAt:
                    now

            });


            // =================================
            // UPDATE OWNER
            // =================================

            const ownerCollection =
                documentData.ownerType ===
                "hospital"
                    ? "hospitals"
                    : "donors";


            const ownerRef =
                db
                    .collection(
                        ownerCollection
                    )
                    .doc(
                        documentData.ownerId
                    );


            await ownerRef.update({

                verificationStatus:
                    "verified",

                updatedAt:
                    now

            });


            return res.json({

                success: true,

                message:
                    "Document verified successfully",

                documentId,

                verificationStatus:
                    "verified",

                ownerId:
                    documentData.ownerId,

                ownerType:
                    documentData.ownerType

            });


        } catch (error) {

            console.error(
                "❌ Verify document error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to verify document"

            });

        }

    };


// =====================================
// REJECT DOCUMENT
// =====================================

const rejectDocument =
    async (
        req,
        res
    ) => {

        try {

            if (
                !checkAdminKey(req)
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Admin authorization required"

                });

            }


            const {
                documentId
            } = req.params;


            const {
                rejectionReason
            } = req.body;


            if (!documentId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Document ID is required"

                });

            }


            if (
                !rejectionReason ||
                String(
                    rejectionReason
                )
                    .trim()
                    .length < 5
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "A rejection reason of at least 5 characters is required"

                });

            }


            const documentRef =
                db
                    .collection(
                        "medicalDocuments"
                    )
                    .doc(
                        documentId
                    );


            const documentSnapshot =
                await documentRef.get();


            if (
                !documentSnapshot.exists
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Document not found"

                });

            }


            const documentData =
                documentSnapshot.data();


            if (
                documentData.verificationStatus !==
                "pending"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This document has already been processed"

                });

            }


            const now =
                new Date();


            // =================================
            // REJECT DOCUMENT
            // =================================

            await documentRef.update({

                verificationStatus:
                    "rejected",

                verifiedBy:
                    "admin",

                verifiedAt:
                    now,

                rejectionReason:
                    String(
                        rejectionReason
                    ).trim(),

                updatedAt:
                    now

            });


            // =================================
            // UPDATE OWNER
            // =================================

            const ownerCollection =
                documentData.ownerType ===
                "hospital"
                    ? "hospitals"
                    : "donors";


            const ownerRef =
                db
                    .collection(
                        ownerCollection
                    )
                    .doc(
                        documentData.ownerId
                    );


            await ownerRef.update({

                verificationStatus:
                    "rejected",

                verificationRejectionReason:
                    String(
                        rejectionReason
                    ).trim(),

                updatedAt:
                    now

            });


            return res.json({

                success: true,

                message:
                    "Document rejected successfully",

                documentId,

                verificationStatus:
                    "rejected",

                rejectionReason:
                    String(
                        rejectionReason
                    ).trim()

            });


        } catch (error) {

            console.error(
                "❌ Reject document error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to reject document"

            });

        }

    };


// =====================================
// EXPORT
// =====================================

module.exports = {

    uploadDocument,

    getDocumentsForOwner,

    getPendingDocuments,

    viewDocument,

    verifyDocument,

    rejectDocument

};