import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAe_OkU-USDCnpDBtUIfjuIEMFWxsV6k8A",
  authDomain: "dukkani-2025.firebaseapp.com",
  projectId: "dukkani-2025",
  storageBucket: "dukkani-2025.firebasestorage.app",
  messagingSenderId: "676666513662",
  appId: "1:676666513662:web:a71be0fce2fd1b93562daf",
  measurementId: "G-00WVZNHPVX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;