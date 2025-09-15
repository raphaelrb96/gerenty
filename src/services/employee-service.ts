

'use server';

import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import type { Employee, EmployeePermissions } from "@/lib/types";
import { createUserWithEmailAndPassword } from "firebase/auth";

const employeesCollection = collection(db, "employees");

const convertEmployeeTimestamps = (data: any): Employee => {
    const employee = { id: data.id, ...data };
    for (const key of ['createdAt', 'updatedAt']) {
        if (employee[key]?.toDate) {
            employee[key] = employee[key].toDate().toISOString();
        }
    }
    return employee as Employee;
}

export async function getEmployeesByUser(ownerId: string): Promise<Employee[]> {
    try {
        const q = query(employeesCollection, where("ownerId", "==", ownerId));
        const querySnapshot = await getDocs(q);
        const employees: Employee[] = [];
        querySnapshot.forEach((doc) => {
            employees.push(convertEmployeeTimestamps({ id: doc.id, ...doc.data() }));
        });
        return employees;
    } catch (error) {
        console.error("Error getting employees:", error);
        throw new Error("Failed to fetch employees.");
    }
}

export async function getEmployeeByAuthId(authId: string): Promise<Employee | null> {
    try {
        const q = query(employeesCollection, where("userId", "==", authId));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        const employeeDoc = querySnapshot.docs[0];
        return convertEmployeeTimestamps({ id: employeeDoc.id, ...employeeDoc.data() });
    } catch (error) {
        console.error("Error getting employee by auth ID:", error);
        throw new Error("Failed to fetch employee data.");
    }
}


export async function addEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'permissions'> & { password?: string }): Promise<Employee> {
    const { password, ...firestoreData } = employeeData;
    let authUserId: string | undefined;

    // Create auth user only if email and password are provided
    if (firestoreData.email && password) {
        try {
            // This is a temporary workaround. In a real app, you'd use the Admin SDK on a server.
            // We're calling this client-side method from a server action, which is not ideal.
            const tempAuth = auth; // Use the existing auth instance
            const userCredential = await createUserWithEmailAndPassword(tempAuth, firestoreData.email, password);
            authUserId = userCredential.user.uid;
        } catch (error) {
            // Re-throw the original Firebase Auth error to be handled by the form
            console.error("Error creating Firebase Auth user:", error);
            throw error;
        }
    }

    const newEmployeeDocRef = doc(employeesCollection);
    
    try {
        await setDoc(newEmployeeDocRef, {
            ...firestoreData,
            userId: authUserId || undefined,
            permissions: { // Default permissions
                modules: { dashboard: true },
                companies: {},
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        const newDocSnap = await getDoc(newEmployeeDocRef);
        return convertEmployeeTimestamps({ id: newEmployeeDocRef.id, ...newDocSnap.data() });
    } catch (firestoreError: any) {
        console.error("Firestore document creation failed:", firestoreError);
        // If Firestore fails, we might have an orphaned auth user. This requires manual cleanup.
        if (authUserId) {
            console.error(`Orphaned Firebase Auth user created with ID: ${authUserId}. Please clean up manually.`);
        }
        // Re-throw the Firestore error
        throw firestoreError;
    }
}


export async function updateEmployee(employeeId: string, employeeData: Partial<Omit<Employee, 'id'>>): Promise<Employee> {
    try {
        const employeeDoc = doc(db, "employees", employeeId);
        await updateDoc(employeeDoc, {
            ...employeeData,
            updatedAt: serverTimestamp(),
        });
        const updatedDocSnap = await getDoc(employeeDoc);
        return convertEmployeeTimestamps({ id: employeeId, ...updatedDocSnap.data() });
    } catch (error) {
        console.error("Error updating employee:", error);
        throw new Error("Failed to update employee.");
    }
}

export async function updateEmployeePermissions(employeeId: string, permissions: EmployeePermissions): Promise<void> {
    try {
        const employeeDoc = doc(db, "employees", employeeId);
        await updateDoc(employeeDoc, {
            permissions,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating employee permissions:", error);
        throw new Error("Failed to update employee permissions.");
    }
}


export async function deleteEmployee(employeeId: string): Promise<void> {
    try {
        // Here you might also want to delete the corresponding Firebase Auth user
        // This requires Firebase Admin SDK on a backend for security reasons.
        const employeeDoc = doc(db, "employees", employeeId);
        await deleteDoc(employeeDoc);
    } catch (error) {
        console.error("Error deleting employee:", error);
        throw new Error("Failed to delete employee.");
    }
}

