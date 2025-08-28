
import { 
  auth,
  db
} from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { User, Plan } from '@/lib/types';


// --- Sign Up ---
export async function signUpWithEmail(name: string, email: string, password:string): Promise<FirebaseUser> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, { displayName: name });

    const userDocRef = doc(db, "users", firebaseUser.uid);

    const freePlan: Plan = {
      name: "Grátis",
      type: 'free',
      price: 0,
      features: ["1 Empresa", "10 Produtos", "50 Pedidos/mês", "1 Usuário", "50 Clientes"],
      limits: {
        companies: 1,
        products: 10,
        users: 1,
        ordersPerMonth: 50,
        customDomains: false,
        supportLevel: 'nenhum',
      },
      isActive: true,
    };
    
    const newUser: Partial<User> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        name: name,
        authProvider: 'email',
        role: 'empresa',
        plan: freePlan,
        statusPlan: 'ativo',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        onboardingCompleted: false,
    };
    
    await setDoc(userDocRef, newUser, { merge: true });

    return firebaseUser;
  } catch (error) {
    console.error("Error signing up: ", error);
    throw error;
  }
}

// --- Sign In ---
export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in: ", error);
    throw error;
  }
}

// --- Sign Out ---
export async function signOut(): Promise<void> {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error signing out: ", error);
        throw error;
    }
}

// --- Update Profile ---
export async function updateUserProfile(user: FirebaseUser, data: { name: string }): Promise<void> {
    try {
        await updateProfile(user, { displayName: data.name });
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
            name: data.name,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
}


// --- Password Reset ---
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error sending password reset email: ", error);
    throw error;
  }
}

// --- Auth State Observer ---
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
