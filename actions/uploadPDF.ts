'use server'

import { api } from "@/convex/_generated/api";
import { currentUser } from "@clerk/nextjs/server"
import convex from "@/lib/convexClient";
import { getFileDownloadURL } from "./getFileDownloadURL";

export async function uploadPDF(formData : FormData){
    const user = await currentUser();
    if(!user){
        return { success: false, error:"Not authenticated" };
    }

    try {
        const file = formData.get("file") as File;
        if(!file){
            return { success : false , error:"No file provided"};
        }

        if(!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf") ){
            return {success:false , error:"Only PDF files are allowed"};
        }

        // Upload URL from convex
        const uploadURL = await convex.mutation(api.receipts.generateUploadURL,{});

        if(!uploadURL){
            return {success:false, error:"Failed to get upload URL"};
        }

        // Convert file to convex storage
        const arrayBuffer = await file.arrayBuffer();

        // upload to convex storage
        const uploadResponse = await fetch(uploadURL,{
            method: "POST",
            body: new Uint8Array(arrayBuffer),
            headers: {
                "Content-Type": file.type,
            },
        });

        if(!uploadResponse.ok){
            throw new Error("Failed to upload file to storage");
        }

        const {storageId} = await uploadResponse.json();
        if(!storageId){
            throw new Error("Invalid upload URL");
        }   
        // Create receipt in convex
        const receiptId = await convex.mutation(api.receipts.storeReceipt,{
            userId: user.id,
            fileName: file.name,
            fileId: storageId,
            size: file.size,
            mineType: file.type,
        });


        const fileUrl = await getFileDownloadURL(storageId);

        if(!fileUrl.success){
            throw new Error(fileUrl.error);
        }

        // Trigger Inngest agent Flow

        return {
            success: true,
            data: {
                receiptId,
                fileName: file.name,
            },
        };
    } catch (error) {
        console.error("Server action upload error:",error);
        return {
            success: false,
            error : error instanceof Error ? error.message : "An unknown error occured",
        };
    }
}