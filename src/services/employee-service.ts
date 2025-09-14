

'use server';

import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import type { Employee } from "@/lib/types";
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

export async function addEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> & { password?: string }): Promise<Employee> {
    let userId: string | undefined = undefined;
    const { password, ...firestoreData } = employeeData;

    // Only create an auth user if email and password are provided
    if (firestoreData.email && password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, firestoreData.email, password);
            userId = userCredential.user.uid;
        } catch (error) {
            console.error("Firebase Auth user creation failed:", error);
            // Re-throw the original Firebase error to be caught by the form
            throw error;
        }
    }
    
    // Now, save the employee data to Firestore
    try {
        const docRef = await addDoc(employeesCollection, {
            ...firestoreData,
            userId: userId, // Will be undefined if no auth user was created
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        const newDocSnap = await getDoc(docRef);
        return convertEmployeeTimestamps({ id: docRef.id, ...newDocSnap.data() });
    } catch(firestoreError) {
        console.error("Firestore document creation failed:", firestoreError);
        // If Firestore fails, we might have an orphaned auth user.
        // This is a complex recovery scenario, but for now, we'll log it.
        if (userId) {
             console.error(`Orphaned Firebase Auth user created with ID: ${userId}. Please clean up manually.`);
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


