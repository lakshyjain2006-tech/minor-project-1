const NOMINATIM_URL =
    "https://nominatim.openstreetmap.org";


const HEADERS = {
    "User-Agent":
        "Blood-Bridge/2.0 (blood donor emergency project)"
};


// ==========================================
// SEARCH ADDRESS
// ==========================================

async function searchAddress(query) {

    const url =
        new URL(
            `${NOMINATIM_URL}/search`
        );


    url.searchParams.set(
        "q",
        query
    );

    url.searchParams.set(
        "format",
        "jsonv2"
    );

    url.searchParams.set(
        "addressdetails",
        "1"
    );

    url.searchParams.set(
        "limit",
        "5"
    );

    // India only

    url.searchParams.set(
        "countrycodes",
        "in"
    );


    const response =
        await fetch(
            url,
            {
                headers: HEADERS
            }
        );


    if (!response.ok) {

        throw new Error(
            `Nominatim search failed: ${response.status}`
        );

    }


    return await response.json();

}


// ==========================================
// REVERSE GEOCODING
// ==========================================

async function reverseGeocode(
    latitude,
    longitude
) {

    const url =
        new URL(
            `${NOMINATIM_URL}/reverse`
        );


    url.searchParams.set(
        "lat",
        latitude
    );

    url.searchParams.set(
        "lon",
        longitude
    );

    url.searchParams.set(
        "format",
        "jsonv2"
    );

    url.searchParams.set(
        "addressdetails",
        "1"
    );


    const response =
        await fetch(
            url,
            {
                headers: HEADERS
            }
        );


    if (!response.ok) {

        throw new Error(
            `Nominatim reverse failed: ${response.status}`
        );

    }


    return await response.json();

}


module.exports = {
    searchAddress,
    reverseGeocode
};