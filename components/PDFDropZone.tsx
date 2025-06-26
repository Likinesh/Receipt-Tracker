'use client'

import { uploadPDF } from '@/actions/uploadPDF';
import { useUser } from '@clerk/clerk-react';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useSchematicEntitlement } from '@schematichq/schematic-react';
import { AlertCircle, CheckCircle, CloudUpload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useRef, useState } from 'react';
import { Button } from './ui/button';

function PDFDropZone() {
    const [isUploading,setIsUploading] = useState(false);
    const [uploadedFiles,setUploadedFiles] = useState<string[]>([]);
    const [isDraggingOver,setIsDraggingOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useUser();
    const router = useRouter();

    const { value: isFeatureEnabled, featureUsageExceeded, featureAllocation } = useSchematicEntitlement("scans")

    // Sensor for drag detection
    const sensors = useSensors(useSensor(PointerSensor));
    
    const handleUpload = useCallback(async(files:FileList | File[])=>{
        if(!user){
            alert("Please Sign in to upload files");
            return;
        }

        const fileArray = Array.from(files);
        const pdfFiles = fileArray.filter(
            (file) => 
                file.type === "application/pdf" || 
            file.name.toLowerCase().endsWith(".pdf"),
        )

        if(pdfFiles.length === 0){
            alert("Please Drop PDf files only");
            return;
        }

        setIsUploading(true);

        try {
            const newUploadFiles: string[] = [];
            for(const file of pdfFiles) {
                const formData = new FormData();
                formData.append("file",file);

                // Call server action to handle upload
                const result = await uploadPDF(formData);
                if(result?.success){
                    throw new Error(result?.error);
                }

                newUploadFiles.push(file.name);
            }
            setUploadedFiles((prev)=>[...prev,...newUploadFiles]);
            setTimeout(()=>{
                setUploadedFiles([]);
            },5000);

            router.push('/receipts');
        } catch (error) {
            console.error("File Upload failed:" , error);
            alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown Error"}`);
        } finally {
            setIsUploading(false);
        }
    },[user,router])

    // Handle file drop via browser events
    const handleDragOver = useCallback((e:React.DragEvent)=>{
        e.preventDefault();
        setIsDraggingOver(true);
    },[]);

    const handleDragLeave = useCallback((e:React.DragEvent)=>{
        e.preventDefault();
        setIsDraggingOver(false);
    },[]);

    const handleDrop = useCallback((e:React.DragEvent)=>{
        e.preventDefault();
        setIsDraggingOver(false);
        
        if(!user){
            alert("Please Sign in to upload files");
            return;
        }

        if(e.dataTransfer.files && e.dataTransfer.files.length>0){
            handleUpload(e.dataTransfer.files);
        }
    },[user,handleUpload]);

    const triggerFileInput = useCallback(()=>{
        fileInputRef.current?.click();
    },[]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>)=>{
        if(e.target.files?.length){
            handleUpload(e.target.files);
        }
    },[handleUpload]);

    const isUserSignedIn = !!user;
    const canUpload = isUserSignedIn && isFeatureEnabled;

  return (
    <DndContext sensors={sensors}>
        <div className='w-full max-w-md mx-auto'>
            <div
                onDragOver={canUpload ? handleDragOver : undefined}
                onDragLeave={canUpload ? handleDragLeave : undefined}
                onDrop={canUpload ? handleDrop : (e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDraggingOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
                } ${!canUpload ? "opacity-70 cursor-not-allowed" : ""}`}
            >
                {isUploading? (
                    <div className=' flex flex-col items-center'>
                        <div className=' animate-spin rounded-full h-10 w-10 bottom-t-2 border-b-2 border-blue-500 mb-2'></div>
                        <p>Uploading...</p>
                    </div>
                ): isUserSignedIn ? (
                    <>
                        <CloudUpload className=' mx-auto h-12 w-12 text-gray-400' />
                        <p className=' mt-2 text-sm text-gray-600'>
                            Please Sign in to upload files
                        </p> 
                    </>
                ) :(
                    <>
                        <CloudUpload className=' mx-auto h-12 w-12 text-gray-400' />
                        <p className='mt-2 text-sm text-gray-600'>
                            Drag adn drop PDF fiels here, or click to select files
                        </p>
                        <input 
                        type='file'
                        ref={fileInputRef}
                        accept='application/pdf,.pdf'
                        multiple
                        onChange={handleFileInputChange}
                        className='hidden'
                        />
                        <Button
                         className='mt-4 px-4 py-2 bg-blue-50 text-white rounded hover:bg-blue-600 disabled:cursor-not-allowed'
                         disabled={!isFeatureEnabled}
                         onClick={triggerFileInput}
                         >
                            {isFeatureEnabled ? "Selcet files":"Upgrade to upload"}
                         </Button>
                    </>
                )}
            </div>

            <div className='mt-4'>
                {featureUsageExceeded &&(
                    <div className='flex items-center p-3 bg-red-50 border-red-200 rounded-md text-red-600 '>
                        <AlertCircle className='h-5 w-5 mr-2 flex-shrink-0' />
                        <span>
                            You have exceeded your limit of {featureAllocation} scans.
                            Please upgrade to continue.
                        </span>
                    </div>
                )}
            </div>

            {uploadedFiles.length > 0 && (
                <div className='mt-4'>
                    <h3 className='font-medium'>Uploaded Files</h3>
                    <ul className='mt-2 text-sm text-gray-600 space-y-1'>
                        {uploadedFiles.map((fileName,i)=>(
                            <li key={i} className='flex items-center'>
                                <CheckCircle className='flex items-center' />
                                {fileName}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    </DndContext>
  )
}

export default PDFDropZone