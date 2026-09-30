// =====================================
// BLOOD-BRIDGE DONOR DASHBOARD
// =====================================

console.log(
    "🩸 Blood-Bridge donor dashboard loading..."
);


// =====================================
// FIREBASE IMPORTS
// =====================================

import {
    initializeApp
} from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    signOut
} from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


// =====================================
// FIREBASE CONFIG
// =====================================

const firebaseConfig = {
    apiKey:
        "AIzaSyD1uRIZ09WvkiFZbPsgeH2mBD0CaMPOKeg",

    authDomain:
        "blood-bridge-2.firebaseapp.com",

    projectId:
        "blood-bridge-2",

    storageBucket:
        "blood-bridge-2.firebasestorage.app",

    messagingSenderId:
        "330431934061",

    appId:
        "1:330431934061:web:f9eb2d0b1f6e42539a5964"
};


// =====================================
// INITIALIZE FIREBASE
// =====================================

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

console.log(
    "✅ Firebase initialized"
);


// =====================================
// DONOR ID
// =====================================

// Firestore donor document ID
let donorId = null;

// Firebase authenticated user
let currentUser = null;


// =====================================
// GET ELEMENTS
// =====================================

const donorName =
    document.getElementById(
        "donorName"
    );

const donorBloodGroup =
    document.getElementById(
        "donorBloodGroup"
    );

const loading =
    document.getElementById(
        "loading"
    );

const requestsContainer =
    document.getElementById(
        "requestsContainer"
    );

const noRequests =
    document.getElementById(
        "noRequests"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );

const refreshButton =
    document.getElementById(
        "refreshButton"
    );


// =====================================
// CHECK ELEMENTS
// =====================================

console.log(
    "Donor name element:",
    donorName
);

console.log(
    "Blood group element:",
    donorBloodGroup
);

console.log(
    "Requests container:",
    requestsContainer
);


// =====================================
// LOAD DONOR REQUESTS
// =====================================

async function loadDonorRequests() {

    if (!currentUser) {

        console.error(
            "❌ No authenticated user"
        );

        return;

    }


    console.log(
        "🔐 Firebase UID:",
        currentUser.uid
    );


    if (loading) {

        loading.style.display =
            "block";

    }


    if (requestsContainer) {

        requestsContainer.innerHTML =
            "";

    }


    if (noRequests) {

        noRequests.style.display =
            "none";

    }


    if (errorMessage) {

        errorMessage.style.display =
            "none";

    }


    try {

        // =====================================
        // USE FIREBASE UID
        // =====================================

        const response =
            await fetch(
                `/api/emergency/for-donor/${encodeURIComponent(
                    currentUser.uid
                )}`
            );


        console.log(
            "📡 Donor API status:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "📥 Donor API response:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load donor information"
            );

        }


        // =====================================
        // SAVE REAL FIRESTORE DONOR ID
        // =====================================

        donorId =
            data.donorId;


        console.log(
            "🆔 Firestore donor ID:",
            donorId
        );


        // =====================================
        // DONOR INFORMATION
        // =====================================

        if (donorName) {

            donorName.textContent =
                data.donorName ||
                "Unknown";

        }


        if (donorBloodGroup) {

            donorBloodGroup.textContent =
                data.donorBloodGroup ||
                "Unknown";

        }


        // =====================================
        // NO REQUESTS
        // =====================================

        if (
            !Array.isArray(
                data.requests
            ) ||
            data.requests.length === 0
        ) {

            if (loading) {

                loading.style.display =
                    "none";

            }


            if (noRequests) {

                noRequests.style.display =
                    "block";

            }


            console.log(
                "ℹ️ No emergency requests found"
            );


            return;

        }


        // =====================================
        // DISPLAY REQUESTS
        // =====================================

        displayRequests(
            data.requests
        );


    } catch (error) {

        console.error(
            "❌ Dashboard error:",
            error
        );


        if (errorMessage) {

            errorMessage.textContent =
                `❌ ${error.message}`;

            errorMessage.style.display =
                "block";

        }


    } finally {

        if (loading) {

            loading.style.display =
                "none";

        }

    }

}


// =====================================
// DISPLAY REQUESTS
// =====================================

function displayRequests(
    requests
) {

    if (!requestsContainer) {

        console.error(
            "❌ Requests container not found"
        );

        return;

    }


    requestsContainer.innerHTML =
        "";


    requests.forEach(
        function(request) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "request-card";


            card.innerHTML = `

                <div class="request-card-header">

                    <h3>
                        🚨 ${escapeHTML(
                            request.patientName
                        )}
                    </h3>

                    <span class="emergency-label">
                        ACTIVE
                    </span>

                </div>


                <div class="request-details">

                    <div class="detail">

                        <span>
                            🩸 Blood Group
                        </span>

                        <strong>
                            ${escapeHTML(
                                request.bloodGroup
                            )}
                        </strong>

                    </div>


                    <div class="detail">

                        <span>
                            💉 Units Required
                        </span>

                        <strong>
                            ${request.unitsRequired}
                        </strong>

                    </div>


                    <div class="detail">

                        <span>
                            🏥 Hospital
                        </span>

                        <strong>
                            ${
                                escapeHTML(
                                    request.hospitalName ||
                                    "Not provided"
                                )
                            }
                        </strong>

                    </div>


                    <div class="detail">

                        <span>
                            📍 Distance
                        </span>

                        <strong class="distance">
                            ${request.distance} km
                        </strong>

                    </div>

                </div>


                <div class="request-actions">

                    <button
                        class="accept-btn"
                        data-request-id="${escapeHTML(
                            request.requestId
                        )}"
                    >
                        ✅ Accept
                    </button>


                    <button
                        class="reject-btn"
                        data-request-id="${escapeHTML(
                            request.requestId
                        )}"
                    >
                        ❌ Reject
                    </button>

                </div>

            `;


            requestsContainer.appendChild(
                card
            );

        }
    );


    // =====================================
    // ACCEPT BUTTONS
    // =====================================

    document
        .querySelectorAll(
            ".accept-btn"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        respondToRequest(
                            button.dataset.requestId,
                            "accepted",
                            button
                        );

                    }
                );

            }
        );


    // =====================================
    // REJECT BUTTONS
    // =====================================

    document
        .querySelectorAll(
            ".reject-btn"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        respondToRequest(
                            button.dataset.requestId,
                            "rejected",
                            button
                        );

                    }
                );

            }
        );

}


// =====================================
// ACCEPT / REJECT REQUEST
// =====================================

async function respondToRequest(
    requestId,
    responseType,
    clickedButton
) {

    // =====================================
    // CHECK DONOR
    // =====================================

    if (!donorId) {

        alert(
            "❌ Donor information is not loaded yet."
        );

        return;

    }


    console.log(
        "📤 Sending donor response:",
        {
            requestId,
            donorId,
            response: responseType
        }
    );


    // =====================================
    // GET CARD
    // =====================================

    const card =
        clickedButton.closest(
            ".request-card"
        );


    if (!card) {

        console.error(
            "❌ Request card not found"
        );

        return;

    }


    // =====================================
    // DISABLE BUTTONS
    // =====================================

    const buttons =
        card.querySelectorAll(
            "button"
        );


    buttons.forEach(
        function(button) {

            button.disabled =
                true;

        }
    );


    clickedButton.textContent =
        responseType === "accepted"
            ? "⏳ Accepting..."
            : "⏳ Rejecting...";


    try {

        // =====================================
        // SEND RESPONSE TO BACKEND
        // =====================================

        const response =
            await fetch(
                `/api/emergency/${encodeURIComponent(
                    requestId
                )}/respond`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            donorId:
                                donorId,

                            response:
                                responseType

                        })

                }
            );


        console.log(
            "📡 Response status:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "📥 Response API:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to respond"
            );

        }


        // =====================================
        // ACCEPTED
        // =====================================

        if (
            responseType === "accepted"
        ) {

            card.innerHTML = `

                <div class="response-success">

                    ✅
                    <strong>
                        Emergency request accepted!
                    </strong>

                    <br><br>

                    You have been matched with
                    this emergency request.

                </div>

            `;


            console.log(
                "✅ Emergency request accepted"
            );

        }


        // =====================================
        // REJECTED
        // =====================================

        else {

            card.innerHTML = `

                <div class="response-success">

                    ❌
                    <strong>
                        Emergency request rejected.
                    </strong>

                </div>

            `;


            console.log(
                "❌ Emergency request rejected"
            );


            setTimeout(
                function() {

                    card.remove();


                    if (
                        requestsContainer &&
                        requestsContainer
                            .children
                            .length === 0
                    ) {

                        if (noRequests) {

                            noRequests.style.display =
                                "block";

                        }

                    }

                },
                800
            );

        }


    } catch (error) {

        console.error(
            "❌ Response error:",
            error
        );


        // =====================================
        // ENABLE BUTTONS AGAIN
        // =====================================

        buttons.forEach(
            function(button) {

                button.disabled =
                    false;

            }
        );


        clickedButton.textContent =
            responseType === "accepted"
                ? "✅ Accept"
                : "❌ Reject";


        alert(
            `❌ ${error.message}`
        );

    }

}


// =====================================
// ESCAPE HTML
// =====================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================
// REFRESH BUTTON
// =====================================

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        function() {

            console.log(
                "🔄 Refreshing donor requests..."
            );

            loadDonorRequests();

        }
    );

}


// =====================================
// FIREBASE AUTHENTICATION
// =====================================

console.log(
    "🔐 Checking Firebase authentication..."
);


async function initializeDashboardAuth() {

    try {

        // =====================================
        // ENABLE LOCAL AUTH PERSISTENCE
        // =====================================

        await setPersistence(
            auth,
            browserLocalPersistence
        );


        console.log(
            "💾 Firebase local persistence enabled"
        );


        // =====================================
        // AUTH STATE LISTENER
        // =====================================

        onAuthStateChanged(
            auth,
            function(user) {

                console.log(
                    "🔐 Firebase auth state:",
                    user
                );


                // =====================================
                // NO USER
                // =====================================

                if (!user) {

                    console.log(
                        "⚠️ Firebase user not available yet."
                    );


                    /*
                     * Firebase sometimes needs a short
                     * moment to restore the saved session.
                     */

                    setTimeout(
                        function() {

                            if (
                                !auth.currentUser
                            ) {

                                console.log(
                                    "➡️ No authenticated user. Redirecting to login..."
                                );


                                window.location.href =
                                    "/login.html";

                            }

                        },
                        1500
                    );


                    return;

                }


                // =====================================
                // USER FOUND
                // =====================================

                currentUser =
                    user;


                console.log(
                    "✅ Logged-in user:",
                    user.email
                );


                console.log(
                    "🔐 Firebase UID:",
                    user.uid
                );


                // =====================================
                // LOAD DONOR REQUESTS
                // =====================================

                loadDonorRequests();

            }
        );


    } catch (error) {

        console.error(
            "❌ Dashboard authentication error:",
            error
        );


        if (errorMessage) {

            errorMessage.textContent =
                `❌ Authentication error: ${error.message}`;

            errorMessage.style.display =
                "block";

        }

    }

}


// =====================================
// START DASHBOARD AUTH
// =====================================

initializeDashboardAuth();