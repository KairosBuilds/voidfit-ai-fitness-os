import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const NULL_AUTH: Auth = { currentUser: null, onAuthStateChanged: () => () => {} } as unknown as Auth;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

const isMissingConfig =
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey === 'YOUR_FIREBASE_API_KEY' ||
  firebaseConfig.apiKey === undefined;

if (isMissingConfig) {
  app = { name: '[LOCAL_ONLY]', options: {}, automaticDataCollectionEnabled: false } as unknown as FirebaseApp;
  auth = NULL_AUTH;
  db = {} as unknown as Firestore;
} else {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Use the modern persistent cache API (supports multiple tabs natively)
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (error) {
    app = { name: '[LOCAL_ONLY]', options: {}, automaticDataCollectionEnabled: false } as unknown as FirebaseApp;
    auth = NULL_AUTH;
    db = {} as unknown as Firestore;
  }
}

export { app, auth, db };
