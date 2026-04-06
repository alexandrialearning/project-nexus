import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxQnoGqIwUWK_XS7Tt9bL7iyDxY8lFEsQ",
  authDomain: "macro-precinct-466817-q8.firebaseapp.com",
  projectId: "macro-precinct-466817-q8",
  storageBucket: "macro-precinct-466817-q8.firebasestorage.app",
  messagingSenderId: "736878482690",
  appId: "1:736878482690:web:76182190ff688c86139e1b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "scrollsv2conversations");
export default app;
