// Use standard Firebase v10+ modular imports.
import { initializeApp } from '@firebase/app';
import { getAnalytics, isSupported } from '@firebase/analytics';
import { 
  getFirestore, 
  collection, 
  setDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  deleteDoc
} from '@firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  updateProfile
} from '@firebase/auth';
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL
} from '@firebase/storage';
import { Product, Order, EventConfig } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyD6799RcH8_3MEgLZvIpjj1lB8pdpDgI7I",
  authDomain: "cofitibs-46e51.firebaseapp.com",
  projectId: "cofitibs-46e51",
  storageBucket: "cofitibs-46e51.firebasestorage.app",
  messagingSenderId: "1071864492474",
  appId: "1:1071864492474:web:41443af302d70680aeed83",
  measurementId: "G-H8QKGM2NQ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

let analytics: any = null;
isSupported().then(supported => {
  if (supported) analytics = getAnalytics(app);
});

export { db, auth, analytics, storage };

// Auth Helpers
export { onAuthStateChanged };
export type { User };

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  }
};

/**
 * Updates the staff profile.
 * If photoData is a base64/data URL, it uploads it to Firebase Storage first.
 * Each user has one file at avatars/{userId}, so uploads overwrite the old one.
 */
export const updateStaffProfile = async (displayName: string, photoData: string) => {
  if (!auth.currentUser) return;

  let finalPhotoURL = photoData;

  // Detect if this is new image data (base64) that needs uploading
  if (photoData && photoData.startsWith('data:')) {
    const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
    // Extract format and data from the data URL
    // Format: data:image/jpeg;base64,...
    await uploadString(storageRef, photoData, 'data_url');
    finalPhotoURL = await getDownloadURL(storageRef);
  }

  await updateProfile(auth.currentUser, { 
    displayName, 
    photoURL: finalPhotoURL 
  });
};

// Firestore Helpers
export const saveOrderToCloud = async (order: Order) => {
  if (!db) return;
  const orderRef = doc(db, "orders", order.id);
  await setDoc(orderRef, order);
};

export const saveProductToCloud = async (product: Product) => {
  if (!db) return;
  const productRef = doc(db, "products", product.id);
  await setDoc(productRef, product);
};

export const saveEventConfigToCloud = async (config: EventConfig) => {
  if (!db) return;
  const configRef = doc(db, "settings", "event_mode");
  await setDoc(configRef, config);
};

export const deleteProductFromCloud = async (id: string) => {
  if (!db) return;
  const productRef = doc(db, "products", id);
  await deleteDoc(productRef);
};

export const listenToOrders = (callback: (orders: Order[]) => void) => {
  const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((doc) => orders.push(doc.data() as Order));
    callback(orders);
  });
};

export const listenToProducts = (callback: (products: Product[]) => void) => {
  const q = collection(db, "products");
  return onSnapshot(q, (snapshot) => {
    const products: Product[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      products.push({ ...data, id: docSnap.id } as Product);
    });
    callback(products);
  });
};

export const listenToEventConfig = (callback: (config: EventConfig) => void) => {
  const configRef = doc(db, "settings", "event_mode");
  return onSnapshot(configRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as EventConfig);
    } else {
      callback({ id: 'event_mode', remainingCups: 0, maxCups: 0, isActive: false });
    }
  });
};