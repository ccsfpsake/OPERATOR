import { initializeApp } from "firebase/app";
import { getFirestore, deleteDoc, doc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, getDownloadURL } from "firebase/storage"; 


const firebaseConfig = {
  apiKey: "AIzaSyDioU7gqrkZw3-hyABOjcVK64w1VwXiXm0",
  authDomain: "sake-41894.firebaseapp.com",
  projectId: "sake-41894",
  storageBucket: "sake-41894.firebasestorage.app",
  messagingSenderId: "72853475590",
  appId: "1:72853475590:web:621245362a78ccd0194e87"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage, deleteDoc, doc, collection, query, where, getDocs, updateDoc, getDownloadURL };
