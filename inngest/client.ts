import { SchematicClient } from '@schematichq/schematic-typescript-node';
import { Inngest } from 'inngest'

// Create client
export const inngest = new Inngest({id:"client-build"});

export const client = new SchematicClient({
    apiKey: process.env.SCHEMATIC_API_KEY,
    cacheProviders:{
        flagChecks:[],
    }
})