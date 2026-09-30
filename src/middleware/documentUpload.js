// =====================================
// BLOOD-BRIDGE DOCUMENT UPLOAD MIDDLEWARE
// =====================================

const multer = require("multer");
const path = require("path");
const fs = require("fs");


// =====================================
// UPLOAD DIRECTORIES
// =====================================

const uploadsRoot = path.join(
    __dirname,
    "../../uploads"
);

const tempDirectory = path.join(
    uploadsRoot,
    "temp"
);


// =====================================
// CREATE TEMP DIRECTORY
// =====================================

fs.mkdirSync(
    tempDirectory,
    {
        recursive: true
    }
);


// =====================================
// STORAGE
// =====================================

const storage = multer.diskStorage({

    destination: (
        req,
        file,
        callback
    ) => {

        // Always upload to temporary
        // directory first.
        //
        // We do NOT depend on req.body here
        // because multipart/form-data fields
        // may arrive after the file.

        callback(
            null,
            tempDirectory
        );

    },


    filename: (
        req,
        file,
        callback
    ) => {

        const extension =
            path.extname(
                file.originalname
            ).toLowerCase();


        const uniqueName =
            `${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 12)}${extension}`;


        callback(
            null,
            uniqueName
        );

    }

});


// =====================================
// ALLOWED MIME TYPES
// =====================================

const allowedMimeTypes = [

    "application/pdf",

    "image/jpeg",

    "image/png"

];


// =====================================
// FILE FILTER
// =====================================

const fileFilter = (
    req,
    file,
    callback
) => {

    if (
        !allowedMimeTypes.includes(
            file.mimetype
        )
    ) {

        return callback(
            new Error(
                "Only PDF, JPG, JPEG and PNG files are allowed"
            ),
            false
        );

    }


    callback(
        null,
        true
    );

};


// =====================================
// MULTER
// =====================================

const uploadDocumentFile =
    multer({

        storage,

        fileFilter,

        limits: {

            // Maximum 5 MB

            fileSize:
                5 * 1024 * 1024,

            files:
                1

        }

    });


// =====================================
// EXPORT
// =====================================

module.exports = {

    uploadDocumentFile

};