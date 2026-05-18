import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Validation connection as per instructions
export async function signInWithGoogle() {
  try {
    // Try popup first
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Auth error:", error);
    
    // Fallback to redirect for certain errors or if popup is blocked
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      // In some environments, we might want to automatically trigger redirect
      // but let's just throw for now so the UI can handle it or just try redirect here.
      // alert("Please allow popups for this site or use another browser.");
    }
    throw error;
  }
}
