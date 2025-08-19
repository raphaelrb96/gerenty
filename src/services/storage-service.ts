
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadProductImage(file: File, userId: string, productId: string): Promise<string> {
    try {
        const storageRef = ref(storage, `products/${userId}/${productId}/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image: ", error);
        throw new Error("Image upload failed.");
    }
}
