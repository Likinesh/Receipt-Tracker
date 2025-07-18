import { createAgent, createTool } from "@inngest/agent-kit";
import { anthropic, openai } from "inngest";
import { z } from "zod";

const parsePDFTool = createTool({
    name: "parse-pdf",
    description: "Analyzes the given PDF",
    parameters: z.object({
        pdfURL: z.string(),
    }),
    handler: async({pdfURL},{step}) => {
        try {
            return step?.ai.infer("parse-pdf",{
            model: anthropic({
                model:"claude-3-5-sonnet-20241022",
                defaultParameters:{
                    max_tokens: 3094,
                },
            }),
            body:{
                messages:[{
                    role:"user",
                    content:[
                        {
                            type:'document',
                            source:{
                                type:"url",
                                url:pdfURL
                            }
                        },
                        {
                            "type": "text",
                            "text": `Extract the data from the receipt and return the structured output as follows:
                            "merchant": {
                                "name": "Store Name",
                                "address": "123 Main St, City, Country",
                                "contact": "+123456789"
                            },
                            "transaction": {
                                "date": "YYYY-MM-DD",
                                "receipt_number": "ABC123456",
                                "payment_method": "Credit Card"
                            },
                            "items": [
                                {
                                "name": "Item 1",
                                "quantity": 2,
                                "unit_price": 10.00,
                                "total_price": 20.00
                                }
                            ],
                            "totals": {
                                "subtotal": 20.00,
                                "tax": 2.00,
                                "total": 22.00,
                                "currency": "USD"
                            }
                            `
                            }
                        ]
                    }]
                }
            })
        } catch (error) {
            console.error(error);
        }
    }
})

export const receiptScanningAgent = createAgent({
  name: "Receipt Scanning Agent",
  description:
    "Processes receipt images and PDFs to extract key information such as vendor names, dates, amounts, and line items",
  system:
    "You are an AI-powered receipt scanning assistant. Your primary role is to accurately extract and structure relevant information from scanned receipts. Your task includes recognizing and parsing details such as:\n" +
    "  - Merchant Information: Store name, address, contact details\n" +
    "  - Transaction Details: Date, time, receipt number, payment method\n" +
    "  - Itemized Purchases: Product names, quantities, individual prices, discounts\n" +
    "  - Total Amounts: Subtotal, taxes, total paid, and any applied discounts\n" +
    "  - Ensure high accuracy by detecting OCR errors and correcting misread text when possible.\n" +
    "  - Normalize dates, currency values, and formatting for consistency.\n" +
    "  - If any key details are missing or unclear, return a structured response indicating incomplete data.\n" +
    "  - Handle multiple formats, languages, and varying receipt layouts efficiently.\n" +
    "  - Maintain a structured JSON output for easy integration with databases or expense tracking systems.",
    model: openai({
        model:"gpt-4o-mini",
        defaultParameters:{
            max_completion_tokens:3094,
        },
    }),
    tools: [parsePDFTool]
});