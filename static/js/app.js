// -------
// Imports
// -------
import {
    onAuthStateChanged, 
    auth, logOut,

    getUserTodos, addUserTodo,
    changeUserTodo, deleteUserTodo,

    changeUserBackground
} 
from "./firebase.js"

import {
    customAlert, log,
    redirect, wait,
    generateUID, CE,
    AEL, $, request,
    getCookie, deleteCookie
} 
from "./misc_functions.js";


// ------------
// Element Refs
// ------------
let insertItemInput = $(".insertItemInput");
let insertItemButton = $(".insertItemButton");
let todoDiv = $(".todoDiv");
const logoutButton = $(".logoutButton");

let deleted_item;
let undoFlag = false;



// TODO
// - Add color customization
// - Top right - Add username
// - Change password to use firebase



// ------
// Helper 
// ------
// Added this for less redundant code
function getApiUrl(endpoint) {return window.location.protocol + "//" + window.location.host + "/api/v1/" + endpoint}

// id stands for DB id. Used this approach so it is easier to delete
// items with unique id, rather than using list indices (old approach)
async function getItemDivByid(id) {
    let itemDivs = document.querySelectorAll(".itemDiv");

    for (let itemDiv of itemDivs) {
        if (itemDiv.classList.contains(id)) return itemDiv;
    }
}



// ------- //
// Startup //
// ------- //
let backgroundURL = localStorage.getItem("backgroundURL") || null;
if (backgroundURL != null) changeBackground(backgroundURL);


// If not on mobile, select the add todo input by default.
// This was done because an additional tap is required on phone to 
// deselect the auto selected input box 
var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (!isMobile) insertItemInput.select();


//? Been meaning to remove this, this shit sucks.
// let audio = new Audio();
// audio.src = "../audio/ting.mp3";
// audio.volume = 0.1;


let currentUser = null;
onAuthStateChanged(auth, async (user) => {
    if (user) {
        let todos = await getUserTodos(user);
        currentUser = user;
        for (var todo of todos) {
            new TodoItem(todo["label"], todo["id"]);
        }
    } else {
        redirect("login")
    }
});



// --------------- //
// Class Todo Item //
// --------------- //

class TodoItem {
    //. TodoItem.add() is a static method that
    //. calls the Todoitem constructor two items
    //. So it is a a constructor in its own way 🤷‍♂️
    
    // First adds a dummy item, then adds the actual item with 
    // the actual id from the database and replaces the dummy item.
    // Did this for UX reasons, since it looks much nicer that
    // adding the item  is instant

    // item parameter is taken seperately for the UNDO flow
    static async add(item) {
        if (item == "") return false
        insertItemInput.value = "";

        let tempTodo = new TodoItem(item, generateUID(6));
        
        let todo = await addUserTodo(currentUser, item);
        if (todo == false) {
            todoDiv.removeChild(tempTodo.itemDiv);
            return false
        }

        let added_item = todo["label"];
        let added_id = todo["id"];

        tempTodo.replaceid(added_id);
        return tempTodo;
    }
    
    constructor(item, id) {
        this.item = item;
        this.id = id;

        this.createTodoItemDiv();
    }

    createTodoItemDiv() {
        // Creating (itemInput and checkBox) here instead of inside the tree is done 
        // since Event Listeners can't be added inside the tree. 
        // (It can be done, it would look ugly asf inside the tree tho)

        // using input here for the actual item allows for
        // editing the item using the input later on.
        this.itemInput = CE("input", {name: "itemInput", value: this.item, classList: ["itemInput"]});
        AEL(this.itemInput, 'keydown', (e)=>{if (e.key === "Enter") if (this.itemInput == document.activeElement) {this.itemInput.blur(); this.edit();}})
        AEL(this.itemInput, 'blur', ()=>{this.itemInput.blur(); this.edit();}); // Edit Item
        
        // Creating checkbox outside the tree
        // for the same reason as above
        this.checkBox = CE("input", {type: "checkbox", id: this.id, classList: ["css-checkbox", "lrg"]});
        AEL(this.checkBox, "change", async () => {if ( this.checkBox.checked === true ) {this.undoCallBack();}}); // Delete Item

        // This is created seperately to reference it late, when replaceId() is called
        // Notice how htmlFor references this.id
        this.checkBoxLabel = CE("label", {htmlFor: this.id, classList: ["css-label", "lrg", "web-two-style"]});

        // The actual tree of elements. Used this approach finally (after a lot of different approaches)
        // because it is easier to visualise all the elements as a tree.
        this.itemDiv = CE("div", {classList: ["itemDiv", this.id], parent: todoDiv}, 
            CE("div", {classList: ["checkBoxDiv"]}, 
                this.checkBox,
                this.checkBoxLabel
            ),
            CE("div", {classList: ["itemInputDiv"]}, 
                this.itemInput
            )
        )

        return this.itemDiv
    }

    // This method allows for the swapping of actual ids
    // after the todo task is added to the database
    replaceid(newid) {
        this.checkBox.id = newid;
        this.checkBoxLabel.htmlFor = newid;
        this.itemDiv.classList.replace(this.id, newid);
        this.id = newid;
    }

    async delete(){
        let deletedTodo = await deleteUserTodo(currentUser, this.id);
    
        if ( deletedTodo == false ) return false
    
        let itemDiv = await getItemDivByid(this.id);
        todoDiv.removeChild(this.itemDiv);
    
        return deletedTodo;
    }

    async edit() {
        var newItem = this.itemInput.value.toString();
        let response = await changeUserTodo(currentUser, this.id, newItem);
    
        if (response == false) return false
    }

    // This sadly doesn't do garbage collection when the
    // item is actually deleted, but it works, so who cares
    // (Also I don't know how to dispose JS objects correctly)

    // When the undo button is pressed, the previously
    // deleted database item is added using the TodoItem.add(previously-delete-item)
    // static method
    async undoCallBack(){
        // Setting undoFlag to true removes previous loops
        // that may be running in the asynchronous thread
        undoFlag = true;
        await wait(20);
        undoFlag = false;

        let undoDiv = $(".undo");
        undoDiv.innerHTML = "";

        this.itemDiv.classList.add("deleting");
        await wait(0.9*1000)
        this.itemDiv.style.display = "none";
        
        let deletedItem = await this.delete();

        let undoButton = CE("button", {
            innerHTML: "UNDO",
            classList: ["undoButton"],
            parent: undoDiv
        });

        let funcCheck = async () => {
            undoFlag = true;
            await TodoItem.add(deletedItem["label"]);
            undoButton.removeEventListener("click", funcCheck);
        }

        undoButton.addEventListener("click", funcCheck)
        
        for (let i = 1; i<=2000; i++){
            await wait(1);
            if (undoFlag==true) 
                break;
        }
        undoDiv.innerHTML = "";
    }

}

AEL(insertItemButton, "click", ()=>{TodoItem.add(insertItemInput.value);});
AEL(insertItemInput, "keypress", (e) => {
    if ( e.key != "Enter" ) return false;
    if(insertItemInput !== document.activeElement) return false;
    TodoItem.add(insertItemInput.value);
});


// ----------------- //
// Change Background //
// ----------------- //
let bgInput = $(".bgInput");
let changeBackgroundButton = $(".changeButton");
let changeBackgroundDiv = $(".changeBackgroundDiv")

async function changeBackground() {
    URL = bgInput.value
    bgInput.value = ""
    if (URL == "") return;

    await changeUserBackground(currentUser, URL);
    
    backgroundDiv = $(".backgroundAppDiv");
    backgroundDiv.style.backgroundImage = `url('${URL}')`;

    hideAllSettings()
}

async function resetBackground() {
    await changeUserBackground(currentUser, "");
    
    backgroundDiv = $(".backgroundAppDiv");
    backgroundDiv.style.backgroundImage = ``;

    hideAllSettings()
}

AEL(changeBackgroundButton, "click", ()=>{changeBackground();});
AEL($(".changeBackground"), "click", ()=>{
    show(changeBackgroundDiv);
    hide(settingsDialogDiv);
})

AEL($(".resetBackground"), "click", ()=>{resetBackground();})



// --------------- //
// Change Password //
// --------------- //
let changePasswordDiv = $(".changePasswordDiv");
let changePassSetting = $(".changePassword")
let passwordInput = $(".passwordInput");
let confirmPasswordInput = $(".confirmPasswordInput");
let changePassButton = $(".changePassButton");

async function changePassword() {
    if(passwordInput == null && confirmPasswordInput == null) return null
    if (passwordInput.value != confirmPasswordInput.value) return null

    let response = await request(
        url = getApiUrl("user/change/password"), 
        requestType = "PATCH", 
        headers = {"Authorization": "Bearer " + token},
        data = {new_pass: passwordInput.value}
    )
    if (response === null) {return false;}

    deleteCookie("token");
    redirect("login");
}

// Password Visibility toggles
AEL($("#togglePassword"), 'click', (e) => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash');
});

AEL($("#togglePasswordConfirm"), 'click', (e) => {
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash');
});

AEL(changePassSetting, "click", ()=>{
    show(changePasswordDiv);
    hide(settingsDialogDiv)
})

AEL(changePassButton, 'click', async ()=>{changePassword();})



// -------- //
// Settings //
// -------- //
let settingsDialogDiv = $(".settingsDialog")
let clickDiv = $(".clickDiv")
AEL($(".settingsButton"), "click", () => {
    settings();
})

// QOL functions
function show(e) {e.classList.add("show")}
function hide(e) {e.classList.remove("show")}
function hideAllSettings() {
    hide(clickDiv)
    hide(settingsDialogDiv)
    hide(changeBackgroundDiv)
    hide(changePasswordDiv)
}
function settings() {
    settingsDialogDiv.classList.add("show")
    clickDiv.classList.add("show")
}

// Hide All Settings once click div is clicked
AEL(clickDiv, "click", async ()=>{hideAllSettings()})


// ------ //
// Logout //
// ------ //
AEL(logoutButton, "click", async ()=>{
    await logOut();
    redirect("home");
})