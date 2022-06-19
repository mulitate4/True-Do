// -------
// Imports
// -------
import {
    onAuthStateChanged,
    auth, signIn, signUp,

    createUserProfile
}
from "./firebase.js";

import {
    customAlert,
    redirect, AEL, $, request
} 
from "./misc_functions.js";


// ------------
// Element Refs
// ------------
let usernameInput = $(".usernameInput");
let emailInput = $(".emailInput");
let passwordInput = $(".passwordInput");

let loginButton = $(".loginButton");
let registerButton = $(".registerButton");

let passwordReveal = $("#togglePassword");
let passwordConfirmReveal = $("#togglePasswordConfirm");
let loadingIcon = $("#loadingIcon");

loadingIcon.style.display = "none";


// ----------
// User Check
// ----------
onAuthStateChanged(auth, async (user) => {
    if (user) redirect("app.html");
});

// -----
// Login
// -----
async function login() {
    loadingIcon.style.display = "";

    var email = emailInput.value.trim();
    var password = passwordInput.value.trim();

    if (email == "" && password == "") {
        loadingIcon.style.display = "none";
        return
    }

    var res = await signIn(email, password);

    if (res == false) {
        loadingIcon.style.display = "none";
        return false;
    }

    loadingIcon.style.display = "none";
    redirect("app.html");
}

if (window.location.pathname == "/login.html")
    AEL(loginButton, "click", ()=>{ login();
        console.log("ok");
    });


// --------
// Register
// --------

async function validateInput(data) {
    if (data.username == "" || data.password == "" || data.email == ""){
        customAlert("Missing Input", "Please fill in all the fields and Try Again");
        return false;
    }

    if (data.password != data.confirmPassword) {
        customAlert("Passwords Don't Match", "Check passwords and try again");
        return false;
    }
    if (data.password.length < 8) {
        customAlert("Password Too Short", "Your password must be atleast 8 characters");
        return false;
    }
    if (data.username.length >= 30) {
        customAlert("Username Too Long", "Keep your username under 30 characters");
        return false;
    }

    return true;
}

async function register() {
    // ---------
    // Recaptcha
    // ---------
    var token = grecaptcha.getResponse();
    if (token == "") {
        customAlert("Recaptcha Error", "Please complete recaptcha challenge."); 
        return;
    }
    
    // TODO Fix this issue? Need a server side fix for this.
    // verifyCaptcha = await request(
    //     window.location.protocol + "//" + window.location.host + "/captcha/verify", 
    //     "POST", {},
    //     {user_response_token: token}
    // )
    
    // data = await verifyCaptcha.json();
    // if (! data.success) {customAlert("Recaptcha Failed", "Reload page and try again"); return}

    loadingIcon.style.display = "";

    // --------
    // Register
    // --------
    var data = {
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
        confirmPassword: $(".confirmPasswordInput").value.trim(),
    }

    if (validateInput(data) === false){ 
        loadingIcon.style.display = "none"
        return false
    }

    let user = await signUp(data.email, data.password);
    if (user == false) {
        loadingIcon.style.display = "none"
        return false;
    }
    let profile = await createUserProfile(user, data.username);

    redirect("app.html");
}

if (window.location.pathname == "/register.html") 
    AEL(registerButton, "click", ()=>{register();});



// ---------
// Listeners
// ---------
AEL(passwordReveal, 'click', 
    function (e) {
        // toggle the type attribute
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // toggle the eye slash icon
        this.classList.toggle('fa-eye-slash');
    }
);

AEL(passwordConfirmReveal, 'click', 
    function (e) {
        // toggle the type attribute
        var confirmPasswordInput = $(".confirmPasswordInput")
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);

        // toggle the eye slash icon
        this.classList.toggle('fa-eye-slash');
    }
);

AEL(document, "keypress", 
    function (e) {
        if (e.key == "Enter") {
            if (window.location.pathname == "/login.html")
            login();
            else if (window.location.pathname == "/register.html")
            register();
        }
    }
);
