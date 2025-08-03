import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDfJbgHPHjgoxZ14sZs5AxWQm8ze7CTdY",
  authDomain: "tarefas-plus-f447f.firebaseapp.com",
  projectId: "tarefas-plus-f447f",
  storageBucket: "tarefas-plus-f447f.firebasestorage.app",
  messagingSenderId: "270687458298",
  appId: "1:270687458298:web:a296d34a2869306bf7ca43",
};

const app = initializeApp(firebaseConfig);
const firebase = getFirestore(app);

export { firebase };
