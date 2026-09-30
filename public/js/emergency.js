// =====================================
// BLOOD-BRIDGE EMERGENCY PAGE
// CLEAN VERSION
// =====================================


// =====================================
// GLOBAL VARIABLES
// =====================================

let latitude = null;
let longitude = null;

let map = null;
let marker = null;

let donorMarkers = [];
let focusedDonorMarker = null;

let searchTimer = null;

let currentRequestId = null;
let statusTrackingTimer = null;


// =====================================
// GET HTML ELEMENTS
// =====================================

const emergencyForm =
    document.getElementById("emergencyForm");

const emergencyButton =
    document.getElementById("emergencyButton");

const patientName =
    document.getElementById("patientName");

const bloodGroup =
    document.getElementById("bloodGroup");

const unitsRequired =
    document.getElementById("unitsRequired");

const hospitalName =
    document.getElementById("hospitalName");

const radius =
    document.getElementById("radius");

const locationSearch =
    document.getElementById("locationSearch");

const searchSuggestions =
    document.getElementById("searchSuggestions");

const locationButton =
    document.getElementById("locationButton");

const locationStatus =
    document.getElementById("locationStatus");

const result =
    document.getElementById("result");


// =====================================
// CHECK PAGE
// =====================================

console.log(
    "🩸 Blood-Bridge emergency.js loaded"
);

console.log(
    "Emergency form:",
    emergencyForm
);

console.log(
    "Emergency button:",
    emergencyButton
);


// =====================================
// INITIALIZE MAP
// =====================================

function initializeMap() {

    if (!document.getElementById("emergencyMap")) {

        console.error(
            "❌ Emergency map element not found"
        );

        return;
    }

    map = L.map(
        "emergencyMap"
    ).setView(
        [22.7196, 75.8577],
        13
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    // Click map to select location

    map.on(
        "click",
        async function(event) {

            await setLocation(
                event.latlng.lat,
                event.latlng.lng,
                true
            );

        }
    );

}


// =====================================
// SET EMERGENCY LOCATION
// =====================================

async function setLocation(
    lat,
    lon,
    reverse = true
) {

    latitude = Number(lat);
    longitude = Number(lon);


    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        console.error(
            "❌ Invalid location"
        );

        return;
    }


    // Move map

    map.setView(
        [
            latitude,
            longitude
        ],
        15
    );


    // Remove previous emergency marker

    if (marker) {

        map.removeLayer(
            marker
        );
    }


    // Add new emergency marker

    marker = L.marker(
        [
            latitude,
            longitude
        ]
    ).addTo(map);


    marker.bindPopup(`
        <strong>🚨 Emergency Location</strong>
        <br>
        ${latitude.toFixed(6)},
        ${longitude.toFixed(6)}
    `);


    locationStatus.innerHTML = `
        📍 Location selected
        <br>
        Latitude: ${latitude.toFixed(6)}
        <br>
        Longitude: ${longitude.toFixed(6)}
    `;


    // Reverse geocode

    if (reverse) {

        await reverseGeocode(
            latitude,
            longitude
        );
    }

}


// =====================================
// REVERSE GEOCODING
// =====================================

async function reverseGeocode(
    lat,
    lon
) {

    try {

        locationStatus.innerHTML =
            "📍 Finding address...";


        const response =
            await fetch(
                `/api/location/reverse?latitude=${lat}&longitude=${lon}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Reverse geocoding failed"
            );
        }


        locationSearch.value =
            data.location.displayName;


        locationStatus.innerHTML = `
            📍 <strong>
                ${escapeHtml(
                    data.location.displayName
                )}
            </strong>

            <br>

            Latitude:
            ${lat.toFixed(6)}

            <br>

            Longitude:
            ${lon.toFixed(6)}
        `;


    } catch (error) {

        console.error(
            "❌ Reverse geocoding error:",
            error
        );


        locationStatus.innerHTML = `
            📍 Location selected

            <br>

            Latitude:
            ${lat.toFixed(6)}

            <br>

            Longitude:
            ${lon.toFixed(6)}
        `;
    }

}


// =====================================
// USE MY LOCATION
// =====================================

locationButton.addEventListener(
    "click",
    function() {

        if (!navigator.geolocation) {

            locationStatus.innerHTML =
                "❌ Geolocation is not supported.";

            return;
        }


        locationStatus.innerHTML =
            "📍 Detecting your location...";


        navigator.geolocation.getCurrentPosition(

            async function(position) {

                const lat =
                    position.coords.latitude;

                const lon =
                    position.coords.longitude;


                await setLocation(
                    lat,
                    lon,
                    true
                );

            },


            function(error) {

                console.error(
                    "❌ GPS error:",
                    error
                );


                locationStatus.innerHTML =
                    "❌ Unable to get your location.";
            },


            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

    }
);


// =====================================
// LOCATION SEARCH
// =====================================

locationSearch.addEventListener(
    "input",
    function() {

        const query =
            locationSearch.value.trim();


        clearTimeout(
            searchTimer
        );


        searchSuggestions.innerHTML =
            "";


        if (query.length < 3) {

            return;
        }


        searchTimer =
            setTimeout(
                function() {

                    searchLocations(
                        query
                    );

                },
                800
            );

    }
);


// =====================================
// SEARCH LOCATIONS
// =====================================

async function searchLocations(
    query
) {

    try {

        searchSuggestions.innerHTML = `
            <div class="suggestion-item">
                🔎 Searching...
            </div>
        `;


        const response =
            await fetch(
                `/api/location/search?q=${encodeURIComponent(query)}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !Array.isArray(data.locations) ||
            data.locations.length === 0
        ) {

            searchSuggestions.innerHTML = `
                <div class="suggestion-item">
                    ❌ No locations found
                </div>
            `;

            return;
        }


        searchSuggestions.innerHTML =
            "";


        data.locations.forEach(
            function(location) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "suggestion-item";


                item.textContent =
                    `📍 ${location.displayName}`;


                item.addEventListener(
                    "click",
                    async function() {

                        locationSearch.value =
                            location.displayName;


                        searchSuggestions.innerHTML =
                            "";


                        await setLocation(
                            location.latitude,
                            location.longitude,
                            true
                        );

                    }
                );


                searchSuggestions.appendChild(
                    item
                );

            }
        );


    } catch (error) {

        console.error(
            "❌ Location search error:",
            error
        );


        searchSuggestions.innerHTML = `
            <div class="suggestion-item">
                ❌ Search failed
            </div>
        `;
    }

}


// =====================================
// CLOSE LOCATION SUGGESTIONS
// =====================================

document.addEventListener(
    "click",
    function(event) {

        if (
            !event.target.closest(
                ".location-search"
            )
        ) {

            searchSuggestions.innerHTML =
                "";
        }

    }
);


// =====================================
// EMERGENCY FORM SUBMIT
// =====================================

emergencyForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        console.log(
            "🚨 Emergency form submitted"
        );


        // =================================
        // LOCATION CHECK
        // =================================

        if (
            latitude === null ||
            longitude === null
        ) {

            result.innerHTML = `
                <div class="error-message">

                    📍 Please select the
                    emergency location first.

                </div>
            `;


            result.style.display =
                "block";


            result.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });


            return;
        }


        // =================================
        // PREPARE REQUEST
        // =================================

        const requestData = {

            patientName:
                patientName.value.trim(),

            bloodGroup:
                bloodGroup.value,

            unitsRequired:
                Number(
                    unitsRequired.value
                ),

            hospitalName:
                hospitalName.value.trim(),

            latitude:
                Number(latitude),

            longitude:
                Number(longitude),

            radius:
                Number(radius.value)

        };


        console.log(
            "📤 Sending emergency request:",
            requestData
        );


        // =================================
        // BUTTON LOADING
        // =================================

        emergencyButton.disabled =
            true;


        emergencyButton.textContent =
            "🔎 Finding Donors...";


        result.style.display =
            "block";


        result.innerHTML = `
            <div class="success-message">
                🔎 Searching for nearby donors...
            </div>
        `;


        try {

            // =============================
            // API REQUEST
            // =============================

            const response =
                await fetch(
                    "/api/emergency/create",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                requestData
                            )
                    }
                );


            console.log(
                "API status:",
                response.status
            );


            const data =
                await response.json();


            console.log(
                "API response:",
                data
            );


            // =============================
            // ERROR
            // =============================

            if (!response.ok) {

                result.innerHTML = `
                    <div class="error-message">

                        ❌ ${
                            data.message ||
                            "Emergency request failed"
                        }

                    </div>
                `;


                result.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });


                return;
            }


            // =============================
            // DISPLAY RESULTS
            // =============================

            displayResults(
                data
            );


        } catch (error) {

            console.error(
                "❌ Emergency request error:",
                error
            );


            result.innerHTML = `
                <div class="error-message">

                    ❌ Unable to connect
                    to Blood-Bridge server.

                    <br><br>

                    Please try again.

                </div>
            `;


            result.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });


        } finally {

            emergencyButton.disabled =
                false;


            emergencyButton.textContent =
                "🚨 Find Blood Donors";

        }

    }
);


// =====================================
// DISPLAY DONOR RESULTS
// =====================================

function displayResults(
    data
) {

    console.log(
        "🎯 Displaying donor results:",
        data
    );


    if (
        !data ||
        !data.request
    ) {

        result.innerHTML = `
            <div class="error-message">
                ❌ Invalid response received
                from server.
            </div>
        `;

        return;
    }


    // =================================
    // SAVE REQUEST ID
    // =================================

    currentRequestId =
        data.request.id ||
        data.requestId ||
        null;


    // =================================
    // DONOR MAP MARKERS
    // =================================

    if (
        Array.isArray(data.donors) &&
        data.donors.length > 0
    ) {

        addDonorMarkers(
            data.donors
        );
    }


    // =================================
    // EMERGENCY SUMMARY
    // =================================

    let html = `

        <div class="success-message">

            🚨 Emergency Request Active

            <br><br>

            🩸 Blood Group:

            <strong>
                ${escapeHtml(
                    data.request.bloodGroup
                )}
            </strong>

            <br>

            💉 Units Required:

            <strong>
                ${data.request.unitsRequired}
            </strong>

            <br>

            🏥 Hospital:

            <strong>
                ${
                    escapeHtml(
                        data.request.hospitalName ||
                        "Not provided"
                    )
                }
            </strong>

            <br><br>

            <strong>
                ${data.request.donorsFound || 0}
            </strong>

            matching donor(s) found.

        </div>

    `;


    // =================================
    // NO DONORS
    // =================================

    if (
        !Array.isArray(data.donors) ||
        data.donors.length === 0
    ) {

        html += `

            <div class="error-message">

                😔 No matching donors found
                within the selected radius.

            </div>

        `;


        result.innerHTML =
            html;


        result.style.display =
            "block";


        result.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        // Start tracking anyway

        if (currentRequestId) {

            startEmergencyStatusTracking(
                currentRequestId
            );
        }


        return;
    }


    // =================================
    // DONOR TITLE
    // =================================

    html += `

        <h3 class="results-title">

            🩸 Nearby Blood Donors

        </h3>

    `;


    // =================================
    // DONOR CARDS
    // =================================

    data.donors.forEach(
        function(donor) {

            const phone =
                donor.phone || "";


            const hasLocation =
                Number.isFinite(
                    Number(
                        donor.latitude
                    )
                ) &&
                Number.isFinite(
                    Number(
                        donor.longitude
                    )
                );


            html += `

                <div
                    class="donor-card"
                >

                    <h3>
                        🩸
                        ${escapeHtml(
                            donor.name
                        )}
                    </h3>


                    <p>

                        🩸 Blood Group:

                        <strong>
                            ${escapeHtml(
                                donor.bloodGroup
                            )}
                        </strong>

                    </p>


                    <p>

                        📍

                        <strong>
                            ${escapeHtml(
                                donor.distance
                            )} km
                        </strong>

                        away

                    </p>


                    <p>

                        👤 Age:

                        ${
                            donor.age ||
                            "N/A"
                        }

                    </p>


                    <p>

                        🟢

                        <strong>
                            Available
                        </strong>

                    </p>


                    <p>

                        🔐 Verification:

                        <strong>
                            ${
                                escapeHtml(
                                    donor.verificationStatus ||
                                    "Pending"
                                )
                            }
                        </strong>

                    </p>


                    <div
                        class="donor-actions"
                    >

                        ${
                            phone

                            ? `

                                <a
                                    href="tel:${escapeHtml(phone)}"
                                    class="contact-btn"
                                >

                                    📞 Contact Donor

                                </a>

                              `

                            : `

                                <button
                                    class="contact-btn disabled"
                                    disabled
                                >

                                    📞 Contact Unavailable

                                </button>

                              `
                        }


                        ${
                            hasLocation

                            ? `

                                <button
                                    type="button"
                                    class="map-btn donor-map-btn"
                                    data-lat="${Number(
                                        donor.latitude
                                    )}"
                                    data-lon="${Number(
                                        donor.longitude
                                    )}"
                                    data-name="${escapeHtml(
                                        donor.name
                                    )}"
                                >

                                    🗺️ View on Map

                                </button>

                              `

                            : ""
                        }

                    </div>

                </div>

            `;

        }
    );


    // =================================
    // SHOW RESULTS
    // =================================

    result.innerHTML =
        html;


    result.style.display =
        "block";


    result.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    // =================================
    // MAP BUTTON EVENTS
    // =================================

    const mapButtons =
        result.querySelectorAll(
            ".donor-map-btn"
        );


    mapButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const donorLat =
                        Number(
                            button.dataset.lat
                        );

                    const donorLon =
                        Number(
                            button.dataset.lon
                        );

                    const donorName =
                        button.dataset.name;


                    focusDonorOnMap(
                        donorLat,
                        donorLon,
                        donorName
                    );

                }
            );

        }
    );


    console.log(
        `✅ ${data.donors.length} donor(s) displayed`
    );


    // =================================
    // START STATUS TRACKING
    // =================================

    if (currentRequestId) {

        startEmergencyStatusTracking(
            currentRequestId
        );

    }

}


// =====================================
// ADD DONORS TO MAP
// =====================================

function addDonorMarkers(
    donors
) {

    console.log(
        "🗺️ Adding donor markers:",
        donors
    );


    // Remove old donor markers

    donorMarkers.forEach(
        function(existingMarker) {

            if (map) {

                map.removeLayer(
                    existingMarker
                );
            }

        }
    );


    donorMarkers = [];


    if (
        !Array.isArray(donors) ||
        donors.length === 0
    ) {

        return;
    }


    const points = [];


    // Emergency location

    if (
        Number.isFinite(
            Number(latitude)
        ) &&
        Number.isFinite(
            Number(longitude)
        )
    ) {

        points.push([
            Number(latitude),
            Number(longitude)
        ]);

    }


    // Donor markers

    donors.forEach(
        function(donor) {

            const donorLat =
                Number(
                    donor.latitude
                );

            const donorLon =
                Number(
                    donor.longitude
                );


            if (
                !Number.isFinite(
                    donorLat
                ) ||
                !Number.isFinite(
                    donorLon
                )
            ) {

                console.warn(
                    "Invalid donor coordinates:",
                    donor
                );

                return;
            }


            const donorMarker =
                L.marker([
                    donorLat,
                    donorLon
                ]).addTo(map);


            donorMarker.bindPopup(`

                <div>

                    <h3>
                        🩸
                        ${escapeHtml(
                            donor.name
                        )}
                    </h3>

                    <p>

                        <strong>
                            Blood Group:
                        </strong>

                        ${escapeHtml(
                            donor.bloodGroup
                        )}

                    </p>

                    <p>

                        📍

                        <strong>
                            ${escapeHtml(
                                donor.distance
                            )} km
                        </strong>

                        away

                    </p>

                    <p>

                        👤

                        <strong>
                            Age:
                        </strong>

                        ${
                            donor.age ||
                            "N/A"
                        }

                    </p>

                    <p>

                        🟢

                        <strong>
                            Available
                        </strong>

                    </p>

                    <p>

                        Verification:

                        ${
                            escapeHtml(
                                donor.verificationStatus ||
                                "Pending"
                            )
                        }

                    </p>

                </div>

            `);


            donorMarkers.push(
                donorMarker
            );


            points.push([
                donorLat,
                donorLon
            ]);

        }
    );


    // Fit map to all locations

    if (
        points.length > 0
    ) {

        const bounds =
            L.latLngBounds(
                points
            );


        map.fitBounds(
            bounds,
            {
                padding: [
                    40,
                    40
                ],

                maxZoom: 14
            }
        );

    }


    console.log(
        `✅ ${donorMarkers.length} donor marker(s) added`
    );

}


// =====================================
// FOCUS DONOR ON MAP
// =====================================

function focusDonorOnMap(
    donorLatitude,
    donorLongitude,
    donorName
) {

    if (
        !map ||
        !Number.isFinite(
            donorLatitude
        ) ||
        !Number.isFinite(
            donorLongitude
        )
    ) {

        console.error(
            "❌ Invalid donor map location"
        );

        return;
    }


    map.setView(
        [
            donorLatitude,
            donorLongitude
        ],
        15
    );


    // Remove previously focused marker

    if (
        focusedDonorMarker
    ) {

        map.removeLayer(
            focusedDonorMarker
        );

    }


    focusedDonorMarker =
        L.marker([
            donorLatitude,
            donorLongitude
        ])
        .addTo(map);


    focusedDonorMarker
        .bindPopup(`
            <strong>
                🩸
                ${escapeHtml(
                    donorName
                )}
            </strong>

            <br>

            📍 Donor location
        `)
        .openPopup();


    document
        .getElementById(
            "emergencyMap"
        )
        .scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

}


// =====================================
// START EMERGENCY STATUS TRACKING
// =====================================

function startEmergencyStatusTracking(
    requestId
) {

    if (!requestId) {

        console.error(
            "❌ Cannot track emergency without request ID"
        );

        return;
    }


    currentRequestId =
        requestId;


    console.log(
        "🔄 Starting emergency status tracking:",
        requestId
    );


    // Stop previous tracker

    stopEmergencyStatusTracking();


    // Check immediately

    checkEmergencyStatus();


    // Check every 5 seconds

    statusTrackingTimer =
        setInterval(
            function() {

                checkEmergencyStatus();

            },
            5000
        );

}


// =====================================
// CHECK EMERGENCY STATUS
// =====================================

async function checkEmergencyStatus() {

    if (!currentRequestId) {

        return;
    }


    try {

        const response =
            await fetch(
                `/api/emergency/status/${currentRequestId}`
            );


        const data =
            await response.json();


        console.log(
            "🚨 Emergency status:",
            data
        );


        if (
            !response.ok ||
            !data.success ||
            !data.request
        ) {

            console.warn(
                "⚠️ Unable to get emergency status"
            );

            return;
        }


        updateEmergencyStatusUI(
            data.request
        );


    } catch (error) {

        console.error(
            "❌ Emergency status error:",
            error
        );

    }

}


// =====================================
// UPDATE EMERGENCY STATUS UI
// =====================================

function updateEmergencyStatusUI(
    request
) {

    if (!request) {

        return;
    }


    let statusBox =
        document.getElementById(
            "emergencyStatusBox"
        );


    // Create status box if it doesn't exist

    if (!statusBox) {

        statusBox =
            document.createElement(
                "div"
            );


        statusBox.id =
            "emergencyStatusBox";


        statusBox.style.marginTop =
            "20px";


        result.prepend(
            statusBox
        );

    }


    const status =
        String(
            request.status ||
            "active"
        ).toLowerCase();


    console.log(
        "📊 Current emergency status:",
        status
    );


    // =================================
    // MATCHED
    // =================================

    if (
        status === "matched"
    ) {

        stopEmergencyStatusTracking();


        showMatchedStatus(
            request
        );


        return;
    }


    // =================================
    // COMPLETED
    // =================================

    if (
        status === "completed"
    ) {

        stopEmergencyStatusTracking();


        showCompletedStatus(
            request
        );


        return;
    }


    // =================================
    // CANCELLED
    // =================================

    if (
        status === "cancelled"
    ) {

        stopEmergencyStatusTracking();


        showCancelledStatus(
            request
        );


        return;
    }


    // =================================
    // ACTIVE
    // =================================

    if (
        status === "active"
    ) {

        showActiveStatus(
            request
        );

    }

}


// =====================================
// ACTIVE STATUS
// =====================================

function showActiveStatus(
    request
) {

    const statusBox =
        document.getElementById(
            "emergencyStatusBox"
        );


    if (!statusBox) {

        return;
    }


    statusBox.innerHTML = `

        <div
            class="success-message"
            style="
                background:#fff8e6;
                border-color:#f5d48a;
                color:#8a6500;
            "
        >

            ⏳

            <strong>
                Waiting for donor response...
            </strong>

            <br><br>

            Your emergency request is
            currently active.

            <br><br>

            🔎 Searching for donor responses...

            <br><br>

            <button
                type="button"
                id="cancelEmergencyBtn"
                style="
                    width:100%;
                    padding:12px;
                    border:none;
                    border-radius:7px;
                    background:#dc3545;
                    color:white;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                ❌ Cancel Emergency Request
            </button>

        </div>

    `;


    const cancelButton =
        document.getElementById(
            "cancelEmergencyBtn"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function() {

                cancelEmergencyRequest(
                    request.id
                );

            }
        );

    }

}


// =====================================
// MATCHED STATUS
// =====================================

function showMatchedStatus(
    request
) {

    const statusBox =
        document.getElementById(
            "emergencyStatusBox"
        );


    if (!statusBox) {

        return;
    }


    const donorResponses =
        Array.isArray(
            request.donorResponses
        )
            ? request.donorResponses
            : [];


    const acceptedDonors =
        donorResponses.filter(
            function(response) {

                return (
                    response.response ===
                    "accepted"
                );

            }
        );


    let donorsHtml = "";


    acceptedDonors.forEach(
        function(donor) {

            donorsHtml += `

                <div
                    style="
                        margin-top:10px;
                        padding:12px;
                        background:#ffffff;
                        border:1px solid #b9e5c5;
                        border-radius:7px;
                    "
                >

                    🩸

                    <strong>
                        ${escapeHtml(
                            donor.donorName ||
                            "Donor"
                        )}
                    </strong>

                    <br>

                    Blood Group:

                    <strong>
                        ${escapeHtml(
                            donor.bloodGroup ||
                            ""
                        )}
                    </strong>

                    <br>

                    🟢

                    <strong>
                        Donor Accepted
                    </strong>

                </div>

            `;

        }
    );


    // Fallback if donorResponses is empty

    if (
        donorsHtml === ""
    ) {

        donorsHtml = `

            <div
                style="
                    margin-top:10px;
                    padding:12px;
                    background:#ffffff;
                    border:1px solid #b9e5c5;
                    border-radius:7px;
                "
            >

                🩸

                <strong>
                    ${
                        escapeHtml(
                            request.matchedDonorName ||
                            "A donor"
                        )
                    }
                </strong>

                <br>

                🟢
                <strong>
                    Donor Accepted
                </strong>

            </div>

        `;
    }


    statusBox.innerHTML = `

        <div class="success-message">

            🚨

            <strong>
                Emergency Request Matched!
            </strong>

            <br><br>

            🩸 A donor has accepted
            your emergency request.

            ${donorsHtml}

            <br>

            <button
                type="button"
                id="completeEmergencyBtn"
                style="
                    width:100%;
                    padding:12px;
                    border:none;
                    border-radius:7px;
                    background:#198754;
                    color:white;
                    font-weight:bold;
                    cursor:pointer;
                "
            >

                ✅ Mark Emergency as Completed

            </button>

        </div>

    `;


    const completeButton =
        document.getElementById(
            "completeEmergencyBtn"
        );


    if (completeButton) {

        completeButton.addEventListener(
            "click",
            function() {

                completeEmergencyRequest(
                    request.id
                );

            }
        );

    }

}


// =====================================
// COMPLETED STATUS
// =====================================

function showCompletedStatus(
    request
) {

    const statusBox =
        document.getElementById(
            "emergencyStatusBox"
        );


    if (!statusBox) {

        return;
    }


    statusBox.innerHTML = `

        <div class="success-message">

            ✅

            <strong>
                Emergency Request Completed
            </strong>

            <br><br>

            The emergency blood request
            has been successfully completed.

            <br><br>

            Thank you for using
            <strong>
                Blood-Bridge
            </strong>.

        </div>

    `;

}


// =====================================
// CANCELLED STATUS
// =====================================

function showCancelledStatus(
    request
) {

    const statusBox =
        document.getElementById(
            "emergencyStatusBox"
        );


    if (!statusBox) {

        return;
    }


    statusBox.innerHTML = `

        <div class="error-message">

            ❌

            <strong>
                Emergency Request Cancelled
            </strong>

            <br><br>

            This emergency request is
            no longer active.

        </div>

    `;

}


// =====================================
// CANCEL EMERGENCY REQUEST
// =====================================

async function cancelEmergencyRequest(
    requestId
) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this emergency request?"
        );


    if (!confirmed) {

        return;
    }


    try {

        console.log(
            "❌ Cancelling emergency request:",
            requestId
        );


        const response =
            await fetch(
                `/api/emergency/${requestId}/cancel`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        console.log(
            "Cancel response:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to cancel emergency request."
            );

            return;
        }


        alert(
            "Emergency request cancelled successfully."
        );


        stopEmergencyStatusTracking();


        updateEmergencyStatusUI(
            data.request
        );


    } catch (error) {

        console.error(
            "❌ Cancel emergency error:",
            error
        );


        alert(
            "Unable to connect to Blood-Bridge server."
        );

    }

}


// =====================================
// COMPLETE EMERGENCY REQUEST
// =====================================

async function completeEmergencyRequest(
    requestId
) {

    const confirmed =
        confirm(
            "Have you received the required blood? Mark this emergency as completed?"
        );


    if (!confirmed) {

        return;
    }


    try {

        console.log(
            "✅ Completing emergency request:",
            requestId
        );


        const response =
            await fetch(
                `/api/emergency/${requestId}/complete`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        console.log(
            "Complete response:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to complete emergency request."
            );

            return;
        }


        alert(
            "Emergency request completed successfully."
        );


        stopEmergencyStatusTracking();


        updateEmergencyStatusUI(
            data.request
        );


    } catch (error) {

        console.error(
            "❌ Complete emergency error:",
            error
        );


        alert(
            "Unable to connect to Blood-Bridge server."
        );

    }

}


// =====================================
// STOP STATUS TRACKING
// =====================================

function stopEmergencyStatusTracking() {

    if (
        statusTrackingTimer
    ) {

        clearInterval(
            statusTrackingTimer
        );


        statusTrackingTimer =
            null;


        console.log(
            "⏹️ Emergency status tracking stopped"
        );

    }

}


// =====================================
// HTML ESCAPE
// =====================================

function escapeHtml(
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
// START APPLICATION
// =====================================

initializeMap();


console.log(
    "✅ Emergency page initialized"
);