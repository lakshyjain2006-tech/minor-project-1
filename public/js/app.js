// ===============================
// VARIABLES
// ===============================

let latitude = null;
let longitude = null;

let map;
let marker;

let searchTimer = null;


// ===============================
// ELEMENTS
// ===============================

const donorForm =
    document.getElementById("donorForm");

const locationButton =
    document.getElementById("locationButton");

const locationStatus =
    document.getElementById("locationStatus");

const locationSearch =
    document.getElementById("locationSearch");

const searchSuggestions =
    document.getElementById("searchSuggestions");

const registerButton =
    document.getElementById("registerButton");

const result =
    document.getElementById("result");


// ===============================
// INITIALIZE MAP
// ===============================

function initializeMap() {

    // Default location: Indore
    map = L.map("map").setView(
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


    // Click anywhere on map
    map.on("click", function (event) {

        setLocation(
            event.latlng.lat,
            event.latlng.lng,
            true
        );

    });
}


// ===============================
// SET LOCATION
// ===============================

async function setLocation(
    lat,
    lon,
    reverse = false
) {

    latitude = lat;
    longitude = lon;


    // Move map
    map.setView(
        [lat, lon],
        15
    );


    // Remove old marker
    if (marker) {
        map.removeLayer(marker);
    }


    // Add new marker
    marker = L.marker(
        [lat, lon]
    ).addTo(map);


    // Show coordinates
    locationStatus.innerHTML = `
        📍 Location selected ✓<br>
        Latitude: ${lat.toFixed(6)}<br>
        Longitude: ${lon.toFixed(6)}
    `;


    // Reverse geocode
    if (reverse) {

        await getAddress(
            lat,
            lon
        );

    }

}


// ===============================
// REVERSE GEOCODING
// ===============================

async function getAddress(
    lat,
    lon
) {

    try {

        locationStatus.innerHTML = `
            📍 Finding address...
        `;


        const response =
            await fetch(
                `/api/location/reverse?latitude=${lat}&longitude=${lon}`
            );


        const data =
            await response.json();


        if (!data.success) {

            locationStatus.innerHTML = `
                📍 Location selected ✓<br>
                Latitude: ${lat.toFixed(6)}<br>
                Longitude: ${lon.toFixed(6)}
            `;

            return;
        }


        const location =
            data.location;


        locationStatus.innerHTML = `
            📍 <strong>${location.displayName}</strong><br>
            Latitude: ${lat.toFixed(6)}<br>
            Longitude: ${lon.toFixed(6)}
        `;


    } catch (error) {

        console.error(
            "Reverse geocoding error:",
            error
        );

        locationStatus.innerHTML = `
            📍 Location selected ✓<br>
            Latitude: ${lat.toFixed(6)}<br>
            Longitude: ${lon.toFixed(6)}
        `;

    }

}


// ===============================
// GPS LOCATION
// ===============================

locationButton.addEventListener(
    "click",
    function () {

        if (!navigator.geolocation) {

            locationStatus.innerHTML =
                "❌ Geolocation is not supported.";

            return;
        }


        locationStatus.innerHTML =
            "📍 Detecting your location...";


        navigator.geolocation.getCurrentPosition(

            async function (position) {

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

            function (error) {

                console.error(
                    "GPS error:",
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


// ===============================
// LOCATION SEARCH
// ===============================

locationSearch.addEventListener(
    "input",
    function () {

        const query =
            locationSearch.value.trim();


        clearTimeout(
            searchTimer
        );


        // Clear suggestions
        if (query.length < 3) {

            searchSuggestions.innerHTML = "";

            return;
        }


        // Wait 800ms before searching
        searchTimer =
            setTimeout(
                function () {

                    searchLocations(
                        query
                    );

                },
                800
            );

    }
);


// ===============================
// SEARCH LOCATIONS
// ===============================

async function searchLocations(
    query
) {

    try {

        searchSuggestions.innerHTML = `
            <div class="search-loading">
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
            !data.success ||
            data.locations.length === 0
        ) {

            searchSuggestions.innerHTML = `
                <div class="no-results">
                    No locations found
                </div>
            `;

            return;
        }


        searchSuggestions.innerHTML = "";


        data.locations.forEach(
            function (location) {

                const item =
                    document.createElement("div");


                item.className =
                    "suggestion-item";


                item.innerHTML = `
                    <div class="suggestion-title">
                        📍 ${location.displayName}
                    </div>
                `;


                item.addEventListener(
                    "click",
                    async function () {

                        locationSearch.value =
                            location.displayName;


                        searchSuggestions.innerHTML =
                            "";


                        await setLocation(
                            location.latitude,
                            location.longitude,
                            false
                        );


                        await getAddress(
                            location.latitude,
                            location.longitude
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
            "Search error:",
            error
        );


        searchSuggestions.innerHTML = `
            <div class="no-results">
                ❌ Unable to search location
            </div>
        `;

    }

}


// ===============================
// CLOSE SUGGESTIONS
// ===============================

document.addEventListener(
    "click",
    function (event) {

        if (
            !event.target.closest(
                ".location-search"
            )
        ) {

            searchSuggestions.innerHTML = "";

        }

    }
);


// ===============================
// DONOR REGISTRATION
// ===============================

donorForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        // Location required
        if (
            latitude === null ||
            longitude === null
        ) {

            result.innerHTML = `
                <div class="error-message">
                    📍 Please select your location first.
                </div>
            `;

            return;
        }


        const donorData = {

            name:
                document.getElementById(
                    "name"
                ).value.trim(),

            phone:
                document.getElementById(
                    "phone"
                ).value.trim(),

            bloodGroup:
                document.getElementById(
                    "bloodGroup"
                ).value,

            age:
                Number(
                    document.getElementById(
                        "age"
                    ).value
                ),

            gender:
                document.getElementById(
                    "gender"
                ).value,

            weight:
                Number(
                    document.getElementById(
                        "weight"
                    ).value
                ),

            healthEligible:
                document.getElementById(
                    "healthEligible"
                ).checked,

            lastDonationDate:
                document.getElementById(
                    "lastDonationDate"
                ).value || null,

            latitude:
                latitude,

            longitude:
                longitude
        };

        if (!donorData.healthEligible) {
            result.innerHTML = `
            <div class="error-message">
                 Please confirm that you are currently healthy
                 and eligible to donate blood.
            </div>
            `;
            return;
        }


        registerButton.disabled = true;

        registerButton.innerText =
            "Registering...";


        try {

            const response =
                await fetch(
                    "/api/donors/register",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                donorData
                            )
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                let message =
                    data.message ||
                    "Registration failed";


                if (
                    data.errors &&
                    Array.isArray(data.errors)
                ) {

                    message =
                        data.errors.join("<br>");

                }


                result.innerHTML = `
                    <div class="error-message">
                        ❌ ${message}
                    </div>
                `;

                return;
            }


            result.innerHTML = `
                <div class="success-message">
                    ✅ Donor registered successfully!<br>
                    Donor ID: ${data.donorId}
                </div>
            `;


            // Reset form
            donorForm.reset();


            latitude = null;
            longitude = null;


            locationStatus.innerHTML =
                "Location not selected";


            locationSearch.value = "";


            if (marker) {

                map.removeLayer(marker);

                marker = null;

            }


            map.setView(
                [22.7196, 75.8577],
                13
            );


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );


            result.innerHTML = `
                <div class="error-message">
                    ❌ Server error. Please try again.
                </div>
            `;

        } finally {

            registerButton.disabled =
                false;

            registerButton.innerText =
                "Register as Donor";

        }

    }
);


// ===============================
// START MAP
// ===============================

initializeMap();