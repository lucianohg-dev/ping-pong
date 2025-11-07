// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFgwMiN87HirsXuGvq0zvcLitQDfYd1oI",
  authDomain: "score-ping-pong.firebaseapp.com",
  projectId: "score-ping-pong",
  storageBucket: "score-ping-pong.firebasestorage.app",
  messagingSenderId: "32906696679",
  appId: "1:32906696679:web:fc0616231f431448944f42",
  measurementId: "G-2SQ3D2NF03"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o Firestore para uso
export const db = getFirestore(app);
