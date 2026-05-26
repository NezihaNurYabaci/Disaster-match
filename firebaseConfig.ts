import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBbAQjbAD6mtxrTJXXjzgnUtJJeVbJrgZM",
  authDomain: "disaster-match.firebaseapp.com",
  projectId: "disaster-match",
  storageBucket: "disaster-match.firebasestorage.app",
  messagingSenderId: "185225689396",
  appId: "1:185225689396:web:4652b1cfe085f9458ccd61"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);