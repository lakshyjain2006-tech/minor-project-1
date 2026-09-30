const { db } = require("../config/firebase");
const { calculateDistance } = require("../utils/distance");


// Find nearby donors
async function findNearbyDonors(
    bloodGroup,
    latitude,
    longitude,
    radius
) {

    const snapshot = await db
        .collection("donors")
        .where("bloodGroup", "==", bloodGroup)
        .where("availability", "==", true)
        .get();


    const donors = [];


    snapshot.forEach((doc) => {

        const data = doc.data();

        if (
            !data.location ||
            !Number.isFinite(
                data.location.latitude
            ) ||
            !Number.isFinite(
                data.location.longitude
            )
        ) {
            return;
        }


        const distance =
            calculateDistance(
                latitude,
                longitude,
                data.location.latitude,
                data.location.longitude
            );


        // Only keep donors inside radius
        if (distance <= radius) {

            donors.push({

                id: doc.id,

                name:
                    data.name,

                bloodGroup:
                    data.bloodGroup,

                age:
                    data.age,

                gender:
                    data.gender,

                availability:
                    data.availability,

                verificationStatus:
                    data.verificationStatus,

                latitude:
                    data.location.latitude,

                longitude:
                    data.location.longitude,

                distance:
                    Number(
                        distance.toFixed(2)
                    )

            });

        }

    });


    // Nearest donor first
    donors.sort(
        (a, b) =>
            a.distance - b.distance
    );


    return donors;
}


module.exports = {
    findNearbyDonors
};