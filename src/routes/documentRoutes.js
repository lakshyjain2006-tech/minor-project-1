// =====================================
// BLOOD-BRIDGE DOCUMENT ROUTES
// =====================================

const express =
    require("express");


const {
    uploadDocument,
    getDocumentsForOwner,
    getPendingDocuments,
    viewDocument,
    verifyDocument,
    rejectDocument
} =
    require(
        "../controllers/documentController"
    );


const {
    uploadDocumentFile
} =
    require(
        "../middleware/documentUpload"
    );


const router =
    express.Router();


// =====================================
// UPLOAD DOCUMENT
// =====================================

router.post(

    "/upload",

    uploadDocumentFile.single(
        "document"
    ),

    uploadDocument

);


// =====================================
// ADMIN - PENDING DOCUMENTS
// =====================================

router.get(

    "/admin/pending",

    getPendingDocuments

);


// =====================================
// ADMIN - VIEW DOCUMENT
// =====================================

router.get(

    "/admin/:documentId/file",

    viewDocument

);


// =====================================
// ADMIN - VERIFY
// =====================================

router.patch(

    "/admin/:documentId/verify",

    verifyDocument

);


// =====================================
// ADMIN - REJECT
// =====================================

router.patch(

    "/admin/:documentId/reject",

    rejectDocument

);


// =====================================
// GET OWNER DOCUMENTS
// =====================================

router.get(

    "/:ownerType/:ownerId",

    getDocumentsForOwner

);


module.exports =
    router;