// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBj28L8VP-2d7PJ17wuvlacK4k90eA4Q6Q",
  authDomain: "song-guess-fc9c6.firebaseapp.com",
  databaseURL: "https://song-guess-fc9c6-default-rtdb.firebaseio.com",
  projectId: "song-guess-fc9c6",
  storageBucket: "song-guess-fc9c6.firebasestorage.app",
  messagingSenderId: "327157591809",
  appId: "1:327157591809:web:92fddb669663fbab2f7500",
  measurementId: "G-48EQ8F0P3M",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

export default app;
