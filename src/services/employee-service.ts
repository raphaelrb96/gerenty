

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
    try {
        let userId: string | undefined = undefined;

        // This is a simplified, client-side way to create a user.
        // A robust solution would use Firebase Admin SDK on a server to avoid security risks
        // and session conflicts. This approach is for demonstration within the current constraints.
        if (employeeData.email && employeeData.password) {
            // WARNING: This approach of creating users client-side has limitations.
            // It might interfere with the currently logged-in user's session if not handled carefully.
            // A secondary Firebase app instance would be required for a truly clean implementation here.
            try {
                 const tempAuth = auth; // In a real scenario, initialize a temporary app
                 const userCredential = await createUserWithEmailAndPassword(tempAuth, employeeData.email, employeeData.password);
                 userId = userCredential.user.uid;
            } catch (authError: any) {
                console.error("Error creating Firebase auth user:", authError);
                // Re-throw the original authError to be caught by the form
                throw authError;
            }
        }
        
        const { password, ...firestoreData } = employeeData;

        const docRef = await addDoc(employeesCollection, {
            ...firestoreData,
            userId: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        const newDocSnap = await getDoc(docRef);
        return convertEmployeeTimestamps({ id: docRef.id, ...newDocSnap.data() });
    } catch (error) {
        console.error("Error adding employee:", error);
        // Re-throw to be handled by the calling component
        throw error;
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

