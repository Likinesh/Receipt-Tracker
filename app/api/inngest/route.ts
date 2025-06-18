import { inngest } from "@/inngest/client";
import { serve } from "inngest/next";

// Create API thet serves zero functions
export const { GET, POST, PUT} = serve({
    client: inngest,
    functions:[
        
    ]
});