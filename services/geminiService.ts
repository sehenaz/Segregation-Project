import { GoogleGenAI, Type } from "@google/genai";
import { DocumentCategory } from "../types";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");
    return new GoogleGenAI({ apiKey });
};

interface ClassificationResult {
    category: DocumentCategory;
    subCategory: string;
}

export const classifyDocumentPage = async (base64Image: string): Promise<ClassificationResult> => {
    try {
        const client = getClient();
        
        // Remove header if present
        const cleanBase64 = base64Image.includes('base64,') 
            ? base64Image.split('base64,')[1] 
            : base64Image;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: cleanBase64
                        }
                    },
                    {
                        text: `Analyze this document image and classify it.
                        1. Assign a main 'category' from: 'KYC', 'AF', 'Photo', 'IC', 'CIBIL', 'TIR', 'LD', 'Other'.
                        2. Identify the specific 'subCategory' (document type).
                           - For KYC: 'Aadhar', 'PAN', 'Voter ID', 'Driving License', 'Passport', 'Ration Card', 'Identity Card'.
                           - For AF: 'Application Form', 'Filled Form'.
                           - For IC: 'Salary Slip', 'Bank Statement', 'Income Certificate'.
                           - For Photo: 'Passport Photo', 'Full Body'.
                           - For Others: Use a short, descriptive name (e.g. 'Legal Agreement', 'Tax Receipt').
                        
                        Return JSON.`
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: {
                            type: Type.STRING,
                            enum: [
                                "KYC",
                                "AF",
                                "Photo",
                                "IC",
                                "CIBIL",
                                "TIR",
                                "LD",
                                "Other"
                            ]
                        },
                        subCategory: {
                            type: Type.STRING,
                            description: "Specific document type like Aadhar, PAN, etc."
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return { category: DocumentCategory.OTHER, subCategory: 'Unknown' };

        const json = JSON.parse(text);
        return {
            category: json.category as DocumentCategory,
            subCategory: json.subCategory || json.category
        };

    } catch (error) {
        console.error("Gemini classification failed:", error);
        return { category: DocumentCategory.OTHER, subCategory: 'Error' };
    }
};