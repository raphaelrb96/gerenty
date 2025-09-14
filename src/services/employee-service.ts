

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

    try {
        if (employeeData.email && employeeData.password) {
            const userCredential = await createUserWithEmailAndPassword(auth, employeeData.email, employeeData.password);
            userId = userCredential.user.uid;
        } else {
             throw new Error("Email and password are required to create an employee account.");
        }
    } catch (error) {
        console.error("Firebase Auth user creation failed:", error);
        // Re-throw the original Firebase error so the UI can catch it
        throw error;
    }
    
    const { password, ...firestoreData } = employeeData;

    try {
        const docRef = await addDoc(employeesCollection, {
            ...firestoreData,
            userId: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        const newDocSnap = await getDoc(docRef);
        return convertEmployeeTimestamps({ id: docRef.id, ...newDocSnap.data() });
    } catch(firestoreError) {
        console.error("Firestore document creation failed:", firestoreError);
        // Here you might want to delete the created Firebase Auth user to prevent orphans
        // This requires Admin SDK, but for now we just throw an error.
        throw new Error("Failed to save employee data to database after user creation.");
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
