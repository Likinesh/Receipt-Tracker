"use server";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import convex from "@/lib/convexClient";

export async function getFileDownloadURL(fileId: Id<"_storage"> | string){
    try {
        const url = await convex.query(api.receipts.getReceiptsDownloadURL,{
            fileId: fileId as Id<"_storage">,
        });

        if(!url){
            throw new Error("Failed to get file download URL");
        }

        return {
            success: true,
            url,
        };
        
    } catch (error) {
        console.error("Error getting file download URL:",error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occured",
        };
    }
}