import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  role: "super_admin" | "admin" | "user" | null;
  isSuperAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SUPER_ADMIN_EMAILS = [
  "storekaleemiya@gmail.com"
]; // List of super admin emails (all should be lowercase)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"super_admin" | "admin" | "user" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeRole: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Cleanup previous role listener if it exists
      if (unsubscribeRole) {
        unsubscribeRole();
        unsubscribeRole = null;
      }

      if (currentUser) {
        setLoading(true);
        try {
          // Set up real-time listener for user role
          const userRef = doc(db, "users", currentUser.uid);
          
          // Ensure user exists in Firestore
          const userDoc = await getDoc(userRef);
          const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(currentUser.email?.toLowerCase() || "");
          
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              name: currentUser.displayName,
              email: currentUser.email,
              role: isSuperAdmin ? "super_admin" : "user",
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            }, { merge: true });
            setRole(isSuperAdmin ? "super_admin" : "user");
          } else {
            const data = userDoc.data();
            const dbRole = (data.role || "user").toLowerCase() as "super_admin" | "admin" | "user";
            
            // Periodically update lastLogin
            await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });

            // If the user's role in DB is different from what it should be (for super_admin persistence/override)
            if (isSuperAdmin && dbRole !== "super_admin") {
              await setDoc(userRef, { role: "super_admin" }, { merge: true });
              setRole("super_admin");
            } else {
              setRole(dbRole);
            }
          }

          unsubscribeRole = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              const snapRole = (snapshot.data().role || "user").toLowerCase() as "super_admin" | "admin" | "user";
              setRole(snapRole);
            }
            setLoading(false);
          }, (error) => {
            console.error("Firestore Role Listener Error:", error);
            if (error.code === 'permission-denied') {
              toast.error("Permission Denied: Please update your Firestore Security Rules.");
            }
            setLoading(false);
          });
        } catch (error: any) {
          console.error("Auth Setup Error:", error);
          if (error.code === 'permission-denied') {
             toast.error("Firebase Permission Error: Use the rules provided in the previous step.");
          }
          setLoading(false);
        }
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRole) unsubscribeRole();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      isSuperAdmin: SUPER_ADMIN_EMAILS.includes(user?.email?.trim().toLowerCase() || ""),
      loading, 
      signInWithGoogle, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
