import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  profile: null,
  logout: async () => {} 
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Initial check and creation
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          const newProfile = {
            displayName: currentUser.displayName || 'بدون اسم',
            photoURL: currentUser.photoURL || '',
            skillsOffered: [],
            skillsWanted: [],
            bio: '',
            balance: 0,
            subscriptionPlan: 'free',
            createdAt: serverTimestamp()
          };
          
          const privateInfoRef = doc(db, 'users', currentUser.uid, 'private', 'info');
          const privateInfo = {
            email: currentUser.email,
            email_verified: currentUser.emailVerified,
            updatedAt: serverTimestamp()
          };

          // Use a batch or just sequential writes. Sequential is fine here for setup.
          try {
            await setDoc(userDocRef, newProfile);
            await setDoc(privateInfoRef, privateInfo);
          } catch (e) {
            console.error("Profile initialization failed. Check rules.", e);
          }
        }

        // Listen for real-time updates for public profile
        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            // Merge with private data if needed, or just set as is
            const data = docSnap.data();
            setProfile({ ...data, email: currentUser.email, emailVerified: currentUser.emailVerified });
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile sync error", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, profile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
