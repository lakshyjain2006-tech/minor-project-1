const express = require("express");
const cors = require("cors");
const path = require("path");

// =====================================
// LOAD ENVIRONMENT
// =====================================

require("./config/env");


// =====================================
// FIREBASE
// =====================================

const {
    db
} = require("./config/firebase");


// =====================================
// ROUTES
// =====================================

const testRoutes =
    require("./routes/testRoutes");

const donorRoutes =
    require("./routes/donorRoutes");

const locationRoutes =
    require("./routes/locationRoutes");

const emergencyRoutes =
    require("./routes/emergencyRoutes");

const hospitalRoutes =
    require("./routes/hospitalRoutes");

const documentRoutes =
    require("./routes/documentRoutes");

const nearbyDonorRoutes =
    require("./routes/nearbyDonorRoutes");


// =====================================
// APP
// =====================================

const app =
    express();


// =====================================
// MIDDLEWARE
// =====================================

app.use(
    cors()
);

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// =====================================
// STATIC FRONTEND
// =====================================

app.use(
    express.static(
        path.join(
            __dirname,
            "../public"
        )
    )
);


// =====================================
// API ROUTES
// =====================================

app.use(
    "/api/test",
    testRoutes
);

app.use(
    "/api/donors",
    donorRoutes
);

app.use(
    "/api/location",
    locationRoutes
);

app.use(
    "/api/emergency",
    emergencyRoutes
);

app.use(
    "/api/hospitals",
    hospitalRoutes
);

app.use(
    "/api/documents",
    documentRoutes
);

app.use(
    "/api/nearby-donors",
    nearbyDonorRoutes
);


// =====================================
// HOME
// =====================================

app.get(
    "/",
    (req, res) => {

        res.json({

            success: true,

            message:
                "Blood-Bridge API is running",

            version:
                "2.0"

        });

    }
);


// =====================================
// SERVER
// =====================================

const PORT =
    process.env.PORT ||
    3336;


// =====================================
// ENV CHECK
// =====================================

console.log(
    "================================="
);

console.log(
    "🔐 ADMIN KEY LOADED:",
    process.env.ADMIN_KEY
        ? "YES"
        : "NO"
);

console.log(
    "🌐 PORT:",
    PORT
);

console.log(
    "================================="
);


// =====================================
// START SERVER
// =====================================

app.listen(
    PORT,
    () => {

        console.log(
            "🩸 Blood-Bridge running on port",
            PORT
        );

        console.log(
            "🏥 Hospital API:",
            `http://localhost:${PORT}/api/hospitals`
        );

        console.log(
            "📄 Document API:",
            `http://localhost:${PORT}/api/documents`
        );

        console.log(
            "================================="
        );

    }
);