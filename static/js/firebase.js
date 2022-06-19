// -------
// Imports 
// -------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.3/firebase-app.js";

import { 
    getFirestore,
    collection, 
    doc, getDoc,
    setDoc,
} from "https://www.gstatic.com/firebasejs/9.8.3/firebase-firestore.js"

import { 
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/9.8.3/firebase-auth.js"

import {
    generateUID
} from './misc_functions.js';



// ----------
// Initialize 
// ----------
const firebaseConfig = {
    apiKey: "AIzaSyBqNnMYv-8za03Z_60B1jAEEwgddERDLV0",
    authDomain: "truedo-312915.firebaseapp.com",
    projectId: "truedo-312915",
    storageBucket: "truedo-312915.appspot.com",
    messagingSenderId: "447055075047",
    appId: "1:447055075047:web:955d65a5d22eebed2f7442",
    measurementId: "G-ZCCZF5WPN1"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// ------------
// Auth Section 
// ------------
async function signUp (email, password) {
    try {
        let userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.log(error.code, error.message);
        return false
    }
}

async function signIn (email, password) {
    try {
        let userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.log(error.code, error.message);
        return false
    }
}

async function logOut () {
    try {
        let userCredential = await signOut(auth);
        return userCredential.user;
    } catch (error) {
        console.log(error.code, error.message);
        return false
    }
}

async function getCurrentUser () {
    try {
        var user = firebase.auth().currentUser;
    } 
    catch (error) {
        console.log(error.code, error.message);
        return false
    }
}

// ----------
// DB Section 
// ----------
const userDataCollRef = collection(db, "user-data");

// ----
// User 
// ----
async function createUserProfile(user, username) {
    try {
        let userDocRef = doc(userDataCollRef, user.uid);
        await setDoc(userDocRef, {
            "regId": "",
            "username": username,
            "created": Date.now(),
            "todo-items": [],
            "notes": [],
        });
        
        let userDocSnap = await getDoc(userDocRef);
        return userDocSnap.data();
    } 
    catch (error) {
        console.error(error.code, error.message);
        return false
    }
}


// -----
// .Todo
// -----
async function getUserTodos(user) {
    try {
        let userDocRef = doc(userDataCollRef, user.uid)
        let userDocSnap = await getDoc(userDocRef);
        let todos = userDocSnap.get("todo-items");
        return todos;
    } 
    catch (error) {
        console.error(error.code, error.message);
        return false
    }
}

async function addUserTodo(user, todoItem) {
    try {
        let userDocRef = doc(userDataCollRef, user.uid)
        let userDocSnap = await getDoc(userDocRef);
        let todos = userDocSnap.get("todo-items");

        let todo = {
            "label": todoItem,
            "id": generateUID(6)
        }

        todos.push(todo);
        await setDoc(userDocRef, {"todo-items": todos}, {merge: true});

        return todo;
    } 
    catch (error) {
        console.error(error.code, error.message);
        return false
    }
}

async function changeUserTodo(user, id, newtodoItem) {
    try {
        let userDocRef = doc(userDataCollRef, user.uid)
        let userDocSnap = await getDoc(userDocRef);
        let todos = userDocSnap.get("todo-items");
        
        for (var todo of todos) {
            if (todo["id"] == id){
                todo["label"] = newtodoItem
            }
        }

        await setDoc(userDocRef, {"todo-items": todos}, {merge: true});

        return todos;
    } 
    catch (error) {
        console.error(error.code, error.message);
        return false
    }
}

async function deleteUserTodo(user, id) {
    try {
        let userDocRef = doc(userDataCollRef, user.uid)
        let userDocSnap = await getDoc(userDocRef);
        let todos = userDocSnap.get("todo-items");
        
        let deletedTodo;
        console.log(id);

        var index, todo;

        for ([index, todo] of todos.entries()) {
            if (todo["id"] == id) {
                deletedTodo = todos.pop(index);
            }
        }

        await setDoc(userDocRef, {"todo-items": todos}, {merge: true});

        return deletedTodo;
    } 
    catch (error) {
        console.error(error.code, error.message);
        return false
    }
}


// ----------
// Background
// ----------
async function changeUserBackground(user, background) {
    try {
        let userDocRef = doc(userDataCollRef, user.uid)
        let userDocSnap = await getDoc(userDocRef);
        await setDoc(userDocRef, {"background-url": background}, {merge: true});

        return true;
    } 
    catch (error) {
        console.error(error.code, error.message);
        return false
    }
}

async function getUserBackground(user, background) {
    try {
        let userDocRef = doc(userDataCollRef, user.uid)
        let userDocSnap = await getDoc(userDocRef);
        let backgroundUrl = userDocSnap.get("background-url");

        return backgroundUrl;
    } 
    catch (error) {
        console.error(error.code, error.message);
        return false
    }
}


export {
    app,
    db,
    auth,

    logOut,
    signIn,
    signUp,
    onAuthStateChanged,

    createUserProfile,

    getUserTodos,
    addUserTodo,
    changeUserTodo,
    deleteUserTodo,

    getUserBackground,
    changeUserBackground
}