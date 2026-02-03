
// Use standard Firebase v10+ modular imports.
// Changed imports to use @firebase/ scoped packages to resolve "no exported member" errors in this environment.
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
import { Product, Order } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyD6799RcH8_3MEgLZvIpjj1lB8pdpDgI7I",
  authDomain: "cofitibs-46e51.firebaseapp.com",
  projectId: "cofitibs-46e51",
  storageBucket: "cofitibs-46e51.firebasestorage.app",
  messagingSenderId: "1071864492474",
  appId: "1:1071864492474:web:41443af302d70680aeed83",
  measurementId: "G-H8QKGM2NQ0"
};

// Initialize Firebase with safety checks
let app: any = null;
let db: any = null;
let analytics: any = null;

try {
  // Correctly initialize Firebase app and Firestore using standard v9+ modular functions
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  
  // Analytics initialization with environment support check
  isSupported().then(supported => {
    if (supported && app) {
      analytics = getAnalytics(app);
    }
  }).catch(err => console.debug("Analytics not supported:", err));
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { db, analytics };

// Helper to save or update an order in the cloud
export const saveOrderToCloud = async (order: Order) => {
  if (!db) return;
  try {
    const orderRef = doc(db, "orders", order.id);
    await setDoc(orderRef, order);
  } catch (err) {
    console.error("Error saving order:", err);
    throw err;
  }
};

// Helper to save or update a product in the cloud
export const saveProductToCloud = async (product: Product) => {
  if (!db) return;
  try {
    const productRef = doc(db, "products", product.id);
    await setDoc(productRef, product);
  } catch (err) {
    console.error("Error saving product:", err);
    throw err;
  }
};

// Helper to delete a product from the cloud
export const deleteProductFromCloud = async (id: string) => {
  if (!db) return;
  try {
    const productRef = doc(db, "products", id);
    await deleteDoc(productRef);
  } catch (err) {
    console.error("Error deleting product:", err);
    throw err;
  }
};

// Real-time listener for orders collection
export const listenToOrders = (callback: (orders: Order[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((doc) => orders.push(doc.data() as Order));
    callback(orders);
  }, (error) => {
    console.error("Order listener error:", error);
  });
};

// Real-time listener for products collection
export const listenToProducts = (callback: (products: Product[]) => void) => {
  if (!db) return () => {};
  const q = collection(db, "products");
  return onSnapshot(q, (snapshot) => {
    const products: Product[] = [];
    snapshot.forEach((docSnap) => {
      // Merge document ID with data to ensure we have the correct ID for consistency
      const data = docSnap.data();
      products.push({ ...data, id: docSnap.id } as Product);
    });
    callback(products);
  }, (error) => {
    console.error("Product listener error:", error);
  });
};