// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdLsUoNOuphkNf9oUOL99P5MQVgjION_U",
  authDomain: "prism-ac.firebaseapp.com",
  projectId: "prism-ac",
  storageBucket: "prism-ac.firebasestorage.app",
  messagingSenderId: "346866639714",
  appId: "1:346866639714:web:049d213f0cf5d7c6fc423b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them for use across your app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;