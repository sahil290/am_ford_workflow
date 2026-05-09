'use server';

import Groq from "groq-sdk";
// @ts-ignore
import PDFParser from "pdf2json";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export async function parseServicePDF(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) throw new Error("No file uploaded");

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    throw new Error("Groq API Key is missing. Please add GROQ_API_KEY to your .env file.");
  }

  try {
    // 1. Extract Text from PDF using pdf2json (The most stable Node.js library)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const text = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(null, true);
      
      pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
      pdfParser.on("pdfParser_dataReady", () => {
        // @ts-ignore
        resolve(pdfParser.getRawTextContent());
      });
      
      pdfParser.parseBuffer(buffer);
    });

    console.log("Extracted PDF Text Sample:", text.substring(0, 500) + "...");

    // 2. Use Groq to parse the text using your SUCCESSFUL PROMPT logic
    const prompt = `
      EXTRACT ALL SERVICE LINE ITEMS FROM THE REPAIR ORDER TEXT BELOW. 
      Look for codes like UVI, DETAIL, LOF, TIRE4, 4ALIGN, etc. 
      Format the result as a VALID JSON ARRAY of objects. 
      
      Each object MUST have these keys: 
      "code": The service code (e.g. UVI), 
      "description": The full description, 
      "cost": The numeric price only (e.g. 175.95), 
      "payType": Set this to "Internal Pay". 
      
      If no services are found, return []. 
      Return ONLY the JSON array. 
      
      TEXT FROM PDF: 
      ${text}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "[]";
    let extracted: any[] = [];
    
    try {
      const parsed = JSON.parse(responseText);
      // Handle cases where AI wraps array in an object key like "services"
      extracted = Array.isArray(parsed) ? parsed : (parsed.services || parsed.items || Object.values(parsed)[0]);
    } catch (e) {
      console.error("JSON Parse Error from Groq:", responseText);
      throw new Error("AI returned invalid data format.");
    }

    if (!Array.isArray(extracted)) extracted = [];

    // Add unique IDs and normalize for frontend
    return extracted.map((item: any) => ({
      id: Math.random(),
      code: (item.code || "MISC").toUpperCase(),
      description: item.description || item.desc || "Service Item",
      payType: item.payType || item.pay || "Internal Pay",
      cost: item.cost ? item.cost.toString().replace(/[^0-9.]/g, '') : "0.00"
    }));

  } catch (err: any) {
    console.error("Extraction Failed:", err);
    throw new Error(`AI Extraction Failed: ${err.message || err}`);
  }
}
