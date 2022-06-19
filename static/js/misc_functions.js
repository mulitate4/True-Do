// Custom Error message
async function customAlert(title, info) {
    let errorDiv = $(".error");
    if (!errorDiv) errorDiv = CE("div", {classList: ["error"], parent: document.body})
    
    // Reset error div if earlier error is not gone yet
    errorDiv.innerHTML = "";

    let alertDiv =
        CE("div", {classList: ["alertDiv"], parent: errorDiv},
            CE("h3", {"innerHTML": title, classList: ["alertH3"]}),
            CE("hr", {classList: ["alertHr"]}),
            CE("p", {"innerHTML": info, classList: ["alertP"]}),
        )
    ;    

    await wait(3000);
    alertDiv.classList.add("deleting")
    await wait(1000);
    errorDiv.innerHTML = "";
}

// Added for laziness
function log(e){
    console.log(e)
}

function dir(e) {
    console.log(Object.getOwnPropertyNames(e));
}

// Redirects to a page by taking a string
function redirect(path){
    window.location.replace( window.location.protocol + "//" + window.location.host + "/" + path);
    return true;
}

// Asynchronous timeOut function
async function wait(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
}

// Function copied from https://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
// Generates a 12 digit long alphanumeric string.
function generateUID(length) {
    const chars =  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

// Creates an element. Added for reducing redundant code.
function CE( type, options, ...children ) {
    let elem = document.createElement(type);

    // Add all the attributes of the element
    if (options !== undefined){
        var key, value;
        for ([key, value] of Object.entries(options)) {
            if (key != "classList" && key != "parent" && key != "style") {
                elem[key] = value;
            }
        }
    }

    for (var child of children)
        elem.appendChild(child);

    let cL = options.classList
    let parent = options.parent
    let style = options.style
    
    // Add all the classes of the element
    if (cL !== undefined) elem.classList.add(...cL)

    // Append the element to the provided parent element or document body
    if (parent !== undefined) parent.appendChild(elem);

    if (style !== undefined) {
        for ([key, value] of Object.entries(style)) {
            elem.style[key] = value;
        }
    }

    return elem;
}

// Again, I'm extremely fucking lazy
// Dollar sign to replace JQuery
function $( query ) {
    return document.querySelector(query)
}

function AEL( e, type, cbFunction ) {
    if (e) {
        e.addEventListener(type, cbFunction);
    }
    else {
        return
    }
}

// General purpose POST request
async function request(url, requestType, headers, data) {
    if (requestType != "GET") headers["Content-type"] = "application/json; charset=UTF-8"
    options = {
        headers: headers,
        method: requestType,
        body: JSON.stringify(data)
    }
    if (requestType == "GET") delete options.body
    
    
    try {
        res = await fetch(url, options)
        .then(res => res);  
        
        // Status codes other than 200: Ok, 201: Created
        if (res.status > 201 && res.status <= 511) {
            err = await res.json()
            customAlert(res.statusText, err.detail)
            return null;
        }

        return res;
    }
    catch(err) {
        log(err)
        customAlert('Something Went Wrong', 'Check your internet connection and Try Again')
        return null;
    }
}

// Copied straight from https://www.w3schools.com/js/js_cookies.asp
function getCookie(cookieName) {
    let name = cookieName + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

function deleteCookie(cookieName) {
    document.cookie = cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
}

export {
    customAlert,
    log,
    redirect,
    wait,
    generateUID,
    CE,
    AEL,
    $,
    request,
    getCookie,
    deleteCookie
}