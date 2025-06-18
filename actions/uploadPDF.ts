'use server'

import { currentUser } from "@clerk/nextjs/server"

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

        if(
            !file.type.includes("pdf") && 
            !file.name.toLowerCase().endsWith(".pdf")
        ){
            return {success:false , error:"Only PDF files are allowed"};
        }
    } catch (error) {
        console.error("Server action upload error:",error);
        return {
            success: false,
            error : error instanceof Error ? error.message : "An unknown error occured",
        };
    }
}