
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadFile(file: File, path: string): Promise<string> {
    try {
        const storageRef = ref(storage, path);
        console.log("Uploading file: ", file.name);
        const snapshot = await uploadBytes(storageRef, file);
        console.log("File uploaded successfully: ", snapshot.ref.fullPath);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("File download URL: ", downloadURL);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file: ", error);
        throw new Error("File upload failed.");
    }
}

    