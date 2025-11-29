import { GoogleGenAI, Type } from "@google/genai";
import { JurisprudenceCase, LegalArea, JurisprudenceAnalysis } from "../types";

// Helper para obtener la API KEY de diferentes maneras posibles en Vite/Vercel
const getApiKey = () => {
  try {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });
const modelName = "gemini-2.5-flash";

// 1. Análisis de documentos
export const analyzeLegalText = async (text: string, isUrl: boolean = false): Promise<{ summary: string; analysis: JurisprudenceAnalysis; area: LegalArea; tags: string[]; titleSuggestion: string; corporation: string }> => {
  if (!apiKey) return { summary: "Falta API Key", analysis: { facts: "", history: "", arguments: "", ruling: "" }, area: LegalArea.CONSTITUCIONAL, tags: [], titleSuggestion: "", corporation: "" };
  try {
    const prompt = `Analiza este documento jurídico: "${text.substring(0, 10000)}"`;
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    if (response.text) return JSON.parse(response.text);
    throw new Error("No response");
  } catch (error) {
    return { summary: "Error", analysis: { facts: "", history: "", arguments: "", ruling: "" }, area: LegalArea.CONSTITUCIONAL, tags: [], titleSuggestion: "", corporation: "" };
  }
};

// 2. Búsqueda Semántica
export const semanticSearch = async (query: string, database: JurisprudenceCase[]): Promise<{ answer: string; relevantIds: string[]; externalLinks?: string[] }> => {
  if (!apiKey) return { answer: "Configura la API Key para buscar.", relevantIds: [] };
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Responde: ${query}`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return { answer: response.text || "Sin respuesta", relevantIds: [] };
  } catch (error) {
    return { answer: "Error en búsqueda.", relevantIds: [] };
  }
};

export const generateCaseArgument = async (userCaseDescription: string, contextDocs: string, database: JurisprudenceCase[]) => "Argumento generado...";
export const askDocument = async (question: string, documentText: string) => "Respuesta...";
export const generateLegalDocument = async (type: string, details: string) => "Documento generado...";
export const compareCases = async (caseA: JurisprudenceCase, caseB: JurisprudenceCase) => ({ similarities: "", differences: "", conclusion: "" });
