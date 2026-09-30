// =====================================
// BLOOD-BRIDGE HOSPITAL REGISTRATION JS
// =====================================

console.log(
    "🏥 Blood-Bridge hospital.js loaded"
);


// =====================================
// DOM ELEMENTS
// =====================================

const hospitalForm =
    document.getElementById(
        "hospitalForm"
    );

const hospitalNameInput =
    document.getElementById(
        "hospitalName"
    );

const registrationNumberInput =
    document.getElementById(
        "registrationNumber"
    );

const phoneInput =
    document.getElementById(
        "phone"
    );

const emailInput =
    document.getElementById(
        "email"
    );

const addressInput =
    document.getElementById(
        "address"
    );

const cityInput =
    document.getElementById(
        "city"
    );

const locationSearchInput =
    document.getElementById(
        "locationSearch"
    );

const searchSuggestions =
    document.getElementById(
        "searchSuggestions"
    );

const locationButton =
    document.getElementById(
        "locationButton"
    );

const locationStatus =
    document.getElementById(
        "locationStatus"
    );

const bloodBankContactInput =
    document.getElementById(
        "bloodBankContact"
    );

const bloodBankContactGroup =
    document.getElementById(
        "bloodBankContactGroup"
    );

const submitButton =
    document.getElementById(
        "submitButton"
    );

const formError =
    document.getElementById(
        "formError"
    );

const registrationCard =
    document.getElementById(
        "registrationCard"
    );

const successCard =
    document.getElementById(
        "successCard"
    );

const hospitalIdElement =
    document.getElementById(
        "hospitalId"
    );

const registerAnotherButton =
    document.getElementById(
        "registerAnotherButton"
    );


// =====================================
// STATE
// =====================================

let selectedLatitude =
    null;

let selectedLongitude =
    null;

let hospitalMap =
    null;

let hospitalMarker =
    null;

let searchTimer =
    null;


// =====================================
// DEFAULT MAP LOCATION
// INDORE
// =====================================

const DEFAULT_LAT =
    22.7196;

const DEFAULT_LON =
    75.8577;


// =====================================
// INITIALIZE MAP
// =====================================

function initializeMap() {

    hospitalMap =
        L.map(
            "hospitalMap"
        ).setView(
            [
                DEFAULT_LAT,
                DEFAULT_LON
            ],
            12
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(
        hospitalMap
    );


    console.log(
        "🗺️ Hospital map initialized"
    );

}


// =====================================
// SET MAP LOCATION
// =====================================

function setHospitalLocation(
    latitude,
    longitude,
    displayName = null
) {

    selectedLatitude =
        Number(latitude);

    selectedLongitude =
        Number(longitude);


    if (
        !Number.isFinite(
            selectedLatitude
        ) ||
        !Number.isFinite(
            selectedLongitude
        )
    ) {

        return;

    }


    // =================================
    // MAP VIEW
    // =================================

    hospitalMap.setView(
        [
            selectedLatitude,
            selectedLongitude
        ],
        16
    );


    // =================================
    // REMOVE OLD MARKER
    // =================================

    if (
        hospitalMarker
    ) {

        hospitalMap.removeLayer(
            hospitalMarker
        );

    }


    // =================================
    // ADD MARKER
    // =================================

    hospitalMarker =
        L.marker(
            [
                selectedLatitude,
                selectedLongitude
            ]
        )
        .addTo(
            hospitalMap
        );


    hospitalMarker.bindPopup(
        displayName ||
        "Hospital Location"
    ).openPopup();


    // =================================
    // STATUS
    // =================================

    locationStatus.textContent =
        displayName
            ? `📍 ${displayName}`
            : `📍 Location selected: ${selectedLatitude.toFixed(6)}, ${selectedLongitude.toFixed(6)}`;


    locationStatus.classList.add(
        "success"
    );

    locationStatus.classList.remove(
        "error"
    );


    console.log(
        "📍 Hospital location:",
        selectedLatitude,
        selectedLongitude
    );

}


// =====================================
// USE CURRENT LOCATION
// =====================================

function useCurrentLocation() {

    if (
        !navigator.geolocation
    ) {

        locationStatus.textContent =
            "❌ Geolocation is not supported by this browser.";

        locationStatus.classList.add(
            "error"
        );

        return;

    }


    locationButton.disabled =
        true;

    locationButton.textContent =
        "📍 Detecting location...";


    navigator.geolocation.getCurrentPosition(

        async position => {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            setHospitalLocation(
                latitude,
                longitude,
                "Your selected location"
            );


            // =================================
            // REVERSE GEOCODE
            // =================================

            try {

                const response =
                    await fetch(
                        `/api/location/reverse?latitude=${latitude}&longitude=${longitude}`
                    );


                const data =
                    await response.json();


                if (
                    data.success &&
                    data.location
                ) {

                    const displayName =
                        data.location.displayName;


                    setHospitalLocation(
                        latitude,
                        longitude,
                        displayName
                    );


                    // Try to fill address

                    if (
                        !addressInput.value
                    ) {

                        addressInput.value =
                            displayName;

                    }


                    // Try to fill city

                    if (
                        !cityInput.value
                    ) {

                        const address =
                            data.location.address ||
                            {};


                        cityInput.value =
                            address.city ||
                            address.town ||
                            address.city_district ||
                            address.municipality ||
                            "";

                    }

                }

            } catch (error) {

                console.error(
                    "Reverse geocoding error:",
                    error
                );

            }


            locationButton.disabled =
                false;

            locationButton.textContent =
                "📍 Use My Location";

        },


        error => {

            console.error(
                "Geolocation error:",
                error
            );


            let message =
                "Unable to get your location.";


            if (
                error.code ===
                error.PERMISSION_DENIED
            ) {

                message =
                    "Location permission was denied. Please allow location access or search manually.";

            }


            if (
                error.code ===
                error.POSITION_UNAVAILABLE
            ) {

                message =
                    "Your location is currently unavailable.";

            }


            if (
                error.code ===
                error.TIMEOUT
            ) {

                message =
                    "Location request timed out.";

            }


            locationStatus.textContent =
                `❌ ${message}`;


            locationStatus.classList.add(
                "error"
            );


            locationButton.disabled =
                false;

            locationButton.textContent =
                "📍 Use My Location";

        },

        {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0
        }

    );

}


// =====================================
// SEARCH LOCATION
// =====================================

async function searchLocation(
    query
) {

    if (
        !query ||
        query.trim().length < 3
    ) {

        hideSuggestions();

        return;

    }


    try {

        const response =
            await fetch(
                `/api/location/search?q=${encodeURIComponent(query.trim())}`
            );


        if (!response.ok) {

            throw new Error(
                "Location search failed"
            );

        }


        const data =
            await response.json();


        if (
            !data.success ||
            !Array.isArray(
                data.locations
            )
        ) {

            hideSuggestions();

            return;

        }


        showSuggestions(
            data.locations
        );


    } catch (error) {

        console.error(
            "Location search error:",
            error
        );


        hideSuggestions();

    }

}


// =====================================
// SHOW SEARCH SUGGESTIONS
// =====================================

function showSuggestions(
    locations
) {

    searchSuggestions.innerHTML =
        "";


    if (
        locations.length === 0
    ) {

        hideSuggestions();

        return;

    }


    locations.forEach(
        location => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "search-suggestion";


            item.textContent =
                location.displayName;


            item.addEventListener(
                "click",
                () => {

                    selectSearchLocation(
                        location
                    );

                }
            );


            searchSuggestions.appendChild(
                item
            );

        }
    );


    searchSuggestions.style.display =
        "block";

}


// =====================================
// SELECT SEARCH RESULT
// =====================================

function selectSearchLocation(
    location
) {

    const latitude =
        Number(
            location.latitude
        );

    const longitude =
        Number(
            location.longitude
        );


    locationSearchInput.value =
        location.displayName;


    setHospitalLocation(
        latitude,
        longitude,
        location.displayName
    );


    // =================================
    // FILL ADDRESS
    // =================================

    if (
        !addressInput.value
    ) {

        addressInput.value =
            location.displayName;

    }


    // =================================
    // FILL CITY
    // =================================

    if (
        !cityInput.value
    ) {

        const address =
            location.address ||
            {};


        cityInput.value =
            address.city ||
            address.town ||
            address.city_district ||
            address.municipality ||
            "";

    }


    hideSuggestions();

}


// =====================================
// HIDE SUGGESTIONS
// =====================================

function hideSuggestions() {

    searchSuggestions.style.display =
        "none";

}


// =====================================
// BLOOD BANK TOGGLE
// =====================================

function updateBloodBankField() {

    const selected =
        document.querySelector(
            'input[name="bloodBankAvailable"]:checked'
        );


    if (
        !selected
    ) {

        return;

    }


    const available =
        selected.value ===
        "true";


    if (available) {

        bloodBankContactGroup.style.display =
            "flex";

    } else {

        bloodBankContactGroup.style.display =
            "none";

        bloodBankContactInput.value =
            "";

    }

}


// =====================================
// SHOW FORM ERROR
// =====================================

function showFormError(
    message
) {

    formError.textContent =
        message;

    formError.style.display =
        "block";


    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"

    });

}


// =====================================
// HIDE FORM ERROR
// =====================================

function hideFormError() {

    formError.textContent =
        "";

    formError.style.display =
        "none";

}


// =====================================
// VALIDATE PHONE
// =====================================

function isValidIndianPhone(
    phone
) {

    return /^[6-9]\d{9}$/.test(
        phone
    );

}


// =====================================
// VALIDATE EMAIL
// =====================================

function isValidEmail(
    email
) {

    if (!email) {

        return true;

    }


    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );

}


// =====================================
// FORM SUBMIT
// =====================================

hospitalForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        hideFormError();


        // =================================
        // GET VALUES
        // =================================

        const hospitalName =
            hospitalNameInput.value.trim();

        const registrationNumber =
            registrationNumberInput.value.trim();

        const phone =
            phoneInput.value.trim();

        const email =
            emailInput.value.trim();

        const address =
            addressInput.value.trim();

        const city =
            cityInput.value.trim();


        const bloodBankAvailable =
            document.querySelector(
                'input[name="bloodBankAvailable"]:checked'
            )?.value ===
            "true";


        const bloodBankContact =
            bloodBankContactInput.value.trim();


        // =================================
        // VALIDATION
        // =================================

        if (
            hospitalName.length < 2
        ) {

            showFormError(
                "Please enter a valid hospital name."
            );

            return;

        }


        if (
            registrationNumber.length < 3
        ) {

            showFormError(
                "Please enter the hospital registration/license number."
            );

            return;

        }


        if (
            !isValidIndianPhone(
                phone
            )
        ) {

            showFormError(
                "Please enter a valid 10-digit Indian phone number."
            );

            return;

        }


        if (
            !isValidEmail(
                email
            )
        ) {

            showFormError(
                "Please enter a valid email address."
            );

            return;

        }


        if (
            address.length < 5
        ) {

            showFormError(
                "Please enter the complete hospital address."
            );

            return;

        }


        if (
            city.length < 2
        ) {

            showFormError(
                "Please enter the hospital city."
            );

            return;

        }


        // =================================
        // LOCATION REQUIRED
        // =================================

        if (
            selectedLatitude === null ||
            selectedLongitude === null
        ) {

            showFormError(
                "Please select the hospital location on the map or use your current location."
            );

            return;

        }


        // =================================
        // BLOOD BANK PHONE
        // =================================

        if (
            bloodBankAvailable &&
            bloodBankContact &&
            !isValidIndianPhone(
                bloodBankContact
            )
        ) {

            showFormError(
                "Please enter a valid blood bank contact number."
            );

            return;

        }


        // =================================
        // REQUEST BODY
        // =================================

        const hospitalData = {

            hospitalName,

            registrationNumber,

            phone,

            email,

            address,

            city,

            latitude:
                selectedLatitude,

            longitude:
                selectedLongitude,

            bloodBankAvailable,

            bloodBankContact

        };


        console.log(
            "🏥 Registering hospital:",
            hospitalData
        );


        // =================================
        // LOADING
        // =================================

        submitButton.disabled =
            true;

        submitButton.textContent =
            "⏳ Registering Hospital...";


        try {

            const response =
                await fetch(
                    "/api/hospitals/register",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                hospitalData
                            )

                    }
                );


            const data =
                await response.json();


            console.log(
                "Hospital registration response:",
                data
            );


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Hospital registration failed"
                );

            }


            // =================================
            // SUCCESS
            // =================================

            hospitalIdElement.textContent =
                data.hospitalId;


            registrationCard.classList.add(
                "hidden"
            );


            successCard.classList.remove(
                "hidden"
            );


            window.scrollTo({

                top:
                    0,

                behavior:
                    "smooth"

            });


        } catch (error) {

            console.error(
                "❌ Hospital registration error:",
                error
            );


            showFormError(
                error.message ||
                "Unable to register hospital. Please try again."
            );


        } finally {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "🏥 Register Hospital";

        }

    }
);


// =====================================
// LOCATION BUTTON
// =====================================

locationButton.addEventListener(
    "click",
    useCurrentLocation
);


// =====================================
// LOCATION SEARCH
// =====================================

locationSearchInput.addEventListener(
    "input",
    () => {

        clearTimeout(
            searchTimer
        );


        const query =
            locationSearchInput.value.trim();


        searchTimer =
            setTimeout(
                () => {

                    searchLocation(
                        query
                    );

                },
                800
            );

    }
);


// =====================================
// CLOSE SUGGESTIONS
// =====================================

document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".location-search"
            )
        ) {

            hideSuggestions();

        }

    }
);


// =====================================
// BLOOD BANK RADIO BUTTONS
// =====================================

document
    .querySelectorAll(
        'input[name="bloodBankAvailable"]'
    )
    .forEach(
        radio => {

            radio.addEventListener(
                "change",
                updateBloodBankField
            );

        }
    );


// =====================================
// REGISTER ANOTHER HOSPITAL
// =====================================

registerAnotherButton.addEventListener(
    "click",
    () => {

        successCard.classList.add(
            "hidden"
        );


        registrationCard.classList.remove(
            "hidden"
        );


        hospitalForm.reset();


        selectedLatitude =
            null;

        selectedLongitude =
            null;


        if (
            hospitalMarker
        ) {

            hospitalMap.removeLayer(
                hospitalMarker
            );

            hospitalMarker =
                null;

        }


        hospitalMap.setView(
            [
                DEFAULT_LAT,
                DEFAULT_LON
            ],
            12
        );


        locationStatus.textContent =
            "Location not selected";


        locationStatus.classList.remove(
            "success",
            "error"
        );


        updateBloodBankField();


        window.scrollTo({

            top:
                0,

            behavior:
                "smooth"

        });

    }
);


// =====================================
// INITIALIZE
// =====================================

initializeMap();

updateBloodBankField();


console.log(
    "✅ Hospital registration page initialized"
);