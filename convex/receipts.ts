import { v } from "convex/values";
import { mutation, query } from './_generated/server';
// function to generate a Convex upload URL for client
export const generateUploadURL = mutation({
    args:{},
    handler: async(ctx) => {
        return await ctx.storage.generateUploadUrl();
    }
});

// Store a receipt file and add to database
export const storeReceipt = mutation({
    args:{
        userId: v.string(),
        fileId: v.id("_storage"),
        fileName: v.string(),
        size: v.number(),
        mineType: v.string()
    },
    handler: async(ctx,args) => {
        const receiptId = await ctx.db.insert("receipts",{
            userId: args.userId,
            fileName: args.fileName,
            fileId: args.fileId,
            uploadedAt: Date.now(),
            size: args.size,
            mineType: args.mineType,
            status: "pending",
            // Extra fields:
            merchantName: undefined,
            merchantAddress: undefined,
            merchantContact: undefined,
            transactionAmount: undefined,
            transactionDate: undefined,
            currency: undefined,
            items: [],
        });
        return receiptId;
    }
});

// Get all receipts for user
export const getReceipts = query({
    args: {
        userId: v.string()
    },
    handler: async (ctx,args) => {
        return await ctx.db
        .query('receipts')
        .filter((q)=> q.eq(q.field("userId"),args.userId))
        .order('desc')
        .collect()
    },
});

// Receipt by Id
export const getReceiptsById = query({
    args:{
        id: v.id("receipts"),
    },
    handler: async (ctx,args) => {
        const receipt = await ctx.db.get(args.id);

        if(receipt){
            const identity = await ctx.auth.getUserIdentity()
            if(!identity){
                throw new Error("Not authenticated");
            }
            const userId = identity.subject
            if(receipt.userId !== userId){
                throw new Error("Not authorized to access receipt");
            }
        }
        return receipt;
    },
});

// Url to download receipt
export const getReceiptsDownloadURL = query({
    args:{
        fileId: v.id("_storage")
    },
    handler: async (ctx,args) => {
        return await ctx.storage.getUrl(args.fileId);
    },
});

// Update status of receipt
export const updateReceiptStatus = mutation({
    args:{
        id: v.id("receipts"),
        status: v.string(),
    },
    handler:async (ctx,args) => {
        const receipt = await ctx.db.get(args.id);
        if(!receipt){
            throw new Error("Receipt Not Found");
        }
        
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not Authenticated");
        }

        const userId = identity.subject;
        if(receipt.userId !== userId){
            throw new Error("Not Authorized to update receipt");
        }

        await ctx.db.patch(args.id,{
            status:args.status,
        });
        return true;
    }
})