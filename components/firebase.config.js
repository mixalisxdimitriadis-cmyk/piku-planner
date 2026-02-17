import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC7zN4U9uL376QIy8QHqzQOFHbZZA3m524",
  authDomain: "piku-planner.firebaseapp.com",
  projectId: "piku-planner",
  storageBucket: "piku-planner.firebasestorage.app",
  messagingSenderId: "875348909489",
  appId: "1:875348909489:web:71b41c4879af3c871bb190"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
