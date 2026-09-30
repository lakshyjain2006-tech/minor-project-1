// =====================================
// BLOOD-BRIDGE FIREBASE LOGIN
// =====================================

console.log("🩸 Blood-Bridge login.js loaded");


// =====================================
// FIREBASE IMPORTS
// =====================================

import {
    initializeApp
} from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    signInWithEmailAndPassword
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
// GET ELEMENTS
// =====================================

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const message =
    document.getElementById("message");


// =====================================
// SHOW MESSAGE
// =====================================

function showMessage(
    text,
    type
) {

    message.textContent =
        text;

    message.className =
        `message ${type}`;

}


// =====================================
// LOGIN
// =====================================

loginForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        console.log(
            "🚀 Login button clicked"
        );


        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        if (!email) {

            showMessage(
                "Please enter your email.",
                "error"
            );

            return;

        }


        if (!password) {

            showMessage(
                "Please enter your password.",
                "error"
            );

            return;

        }


        loginButton.disabled =
            true;

        loginButton.textContent =
            "⏳ Logging in...";


        try {

            // =====================================
            // FORCE LOCAL AUTH PERSISTENCE
            // =====================================

            await setPersistence(
                auth,
                browserLocalPersistence
            );


            console.log(
                "💾 Firebase session persistence enabled"
            );


            // =====================================
            // SIGN IN
            // =====================================

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            console.log(
                "✅ Login successful:",
                user.uid
            );


            console.log(
                "📧 Logged in email:",
                user.email
            );


            showMessage(
                "✅ Login successful. Opening dashboard...",
                "success"
            );


            // =====================================
            // REDIRECT
            // =====================================

            setTimeout(
                function() {

                    console.log(
                        "➡️ Opening donor dashboard..."
                    );


                    window.location.href =
                        "/donor-dashboard.html";

                },
                500
            );


        } catch (error) {

            console.error(
                "❌ Firebase login error:",
                error
            );


            console.error(
                "Error code:",
                error.code
            );


            let errorText =
                "Unable to login.";


            switch (error.code) {

                case
                    "auth/invalid-credential":

                    errorText =
                        "Incorrect email or password.";

                    break;


                case
                    "auth/user-not-found":

                    errorText =
                        "No account found with this email.";

                    break;


                case
                    "auth/wrong-password":

                    errorText =
                        "Incorrect password.";

                    break;


                case
                    "auth/invalid-email":

                    errorText =
                        "Please enter a valid email.";

                    break;


                case
                    "auth/too-many-requests":

                    errorText =
                        "Too many attempts. Please try again later.";

                    break;


                case
                    "auth/network-request-failed":

                    errorText =
                        "Network error. Check your internet connection.";

                    break;


                default:

                    errorText =
                        error.message ||
                        "Login failed.";

            }


            showMessage(
                `❌ ${errorText}`,
                "error"
            );


        } finally {

            loginButton.disabled =
                false;

            loginButton.textContent =
                "🔐 Login";

        }

    }
);


console.log(
    "✅ Login event listener attached"
);