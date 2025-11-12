
import { GoogleGenAI, Type } from "@google/genai";
import type { AttachedFile, Suggestion } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const proModel = 'gemini-2.5-pro';
const flashModel = 'gemini-2.5-flash';

export async function generateInitialContent(prompt: string, files: AttachedFile[]): Promise<string> {
  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: prompt }];

  for (const file of files) {
    parts.push({
      inlineData: {
        mimeType: file.type,
        data: file.content,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: proModel,
    contents: { parts: parts },
  });

  return response.text;
}

export async function iterateOnSelection(selectedText: string, instruction: string): Promise<string> {
  const prompt = `
    User instruction: "${instruction}"
    
    Based on the instruction, rewrite the following text:
    ---
    ${selectedText}
    ---
    
    Return only the rewritten text, without any introductory phrases or markdown.
    `;
  
  const response = await ai.models.generateContent({
    model: flashModel,
    contents: prompt,
  });

  return response.text.trim();
}

export async function getProactiveSuggestion(fullText: string): Promise<Suggestion | null> {
    const prompt = `You are an expert writing assistant. Analyze the following text. Your goal is to find one single, high-impact suggestion for improvement. This could be fixing a grammatical error, improving clarity, or making the phrasing more engaging.
    
    Respond with a single JSON object with two keys: "find" and "replace".
    - "find": The exact, original phrase from the text that should be changed.
    - "replace": Your suggested replacement for that phrase.
    
    If you have no high-confidence suggestions, respond with an empty JSON object {}. Do not make up suggestions. Only suggest if it's a clear improvement.
    
    Text to analyze:
    ---
    ${fullText}
    ---
    `;

    const response = await ai.models.generateContent({
        model: flashModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    find: { type: Type.STRING },
                    replace: { type: Type.STRING },
                },
            },
        },
    });

    try {
        const jsonText = response.text.trim();
        if (jsonText === "{}") return null;

        const parsed = JSON.parse(jsonText);
        if (parsed.find && parsed.replace) {
            // Basic validation to ensure the 'find' text exists in the original
            if (fullText.includes(parsed.find)) {
                return parsed as Suggestion;
            }
        }
        return null;
    } catch (error) {
        console.error("Failed to parse suggestion JSON:", error);
        return null;
    }
}
