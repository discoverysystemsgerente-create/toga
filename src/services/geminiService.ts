import { GoogleGenAI } from "@google/genai";
// @ts-ignore
const apiKey = import.meta.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateLegalDocument = async (type: string, details: string): Promise<string> => {
    if(!apiKey) return "Modo Demo: Configura la API Key para generar documentos reales.";
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Actúa como abogado experto. Redacta un documento tipo "${type}" con estos detalles: ${details}. Formato formal colombiano.`
        });
        return response.text || "Error al generar.";
    } catch (e) { return "Error de conexión con IA."; }
};
export const generateCaseArgument = async (facts: string, context: string, db: any[]): Promise<string> => {
    if(!apiKey) return "Modo Demo: Configura la API Key para análisis real.";
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analiza este caso: ${facts}. Genera estrategia jurídica.`
        });
        return response.text || "Error al generar.";
    } catch (e) { return "Error de IA."; }
};
export const compareCases = async (c1: any, c2: any) => {
    if(!apiKey) return { similarities: "Demo", differences: "Demo", conclusion: "Modo Demo" };
    try {
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Compara estas dos sentencias: A) ${c1.title} B) ${c2.title}. Diferencias y similitudes.`
      });
      return { similarities: "Análisis IA", differences: "Análisis IA", conclusion: response.text || "" };
    } catch(e) { return { similarities: "Error", differences: "Error", conclusion: "Error IA" }; }
};
export const analyzeLegalText = async (text: string) => { return null; };
export const semanticSearch = async () => { return { answer: '', relevantIds: [] }; };
export const askDocument = async (q: string, t: string) => { return "Respuesta IA"; };