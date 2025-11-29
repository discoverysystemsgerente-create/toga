import { GoogleGenAI, Type } from "@google/genai";
import { JurisprudenceCase, LegalArea, JurisprudenceAnalysis } from "../types";

// Helper robusto para obtener API Key en entornos Vite
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

// 1. Análisis de documentos cargados (Texto, PDF, Link)
export const analyzeLegalText = async (text: string, isUrl: boolean = false): Promise<{ summary: string; analysis: JurisprudenceAnalysis; area: LegalArea; tags: string[]; titleSuggestion: string; corporation: string }> => {
  if (!apiKey) return { summary: "Falta API Key", analysis: { facts: "", history: "", arguments: "", ruling: "" }, area: LegalArea.CONSTITUCIONAL, tags: ["Error"], titleSuggestion: "Sin Título", corporation: "Desconocida" };
  try {
    const prompt = `
      Actúa como un auxiliar judicial experto en leyes de Colombia.
      Analiza el siguiente documento jurídico (${isUrl ? 'enlace externo' : 'texto extraído'}).

      Necesito extraer la siguiente estructura estricta:
      1. Título sugerido (Ej: Sentencia T-123/23).
      2. Corporación (Ej: Corte Constitucional, Consejo de Estado).
      3. Área del derecho.
      4. Etiquetas (Tags).
      5. Resumen corto (2 líneas para vista previa).
      6. ANÁLISIS DETALLADO:
         - Hechos relevantes: ¿Qué sucedió?
         - Historia procesal: ¿Qué decidieron instancias anteriores?
         - Argumentos principales: La Ratio Decidendi.
         - Resuelve: La decisión final.

      Texto a analizar: "${text.substring(0, 15000)}"
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            analysis: {
              type: Type.OBJECT,
              properties: {
                facts: { type: Type.STRING },
                history: { type: Type.STRING },
                arguments: { type: Type.STRING },
                ruling: { type: Type.STRING }
              }
            },
            area: { type: Type.STRING, enum: Object.values(LegalArea) },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            titleSuggestion: { type: Type.STRING },
            corporation: { type: Type.STRING }
          },
          required: ["summary", "analysis", "area", "tags", "titleSuggestion", "corporation"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("Error analyzing text:", error);
    return {
      summary: "Error al procesar con IA.",
      analysis: { facts: "", history: "", arguments: "", ruling: "" },
      area: LegalArea.CONSTITUCIONAL,
      tags: ["Error"],
      titleSuggestion: "Documento Sin Título",
      corporation: "Desconocida"
    };
  }
};

// 2. Búsqueda Semántica
export const semanticSearch = async (query: string, database: JurisprudenceCase[]): Promise<{ answer: string; relevantIds: string[]; externalLinks?: string[] }> => {
  if (!apiKey) return { answer: "Configura tu API Key para usar la búsqueda.", relevantIds: [] };
  try {
    const context = database.map(c => 
      `ID: ${c.id} | TÍTULO: ${c.title} | RESUMEN: ${c.summary} | TIPO: ${c.sourceType}
       CONTENIDO: ${c.text.substring(0, 500)}...`
    ).join("\n\n---\n\n");

    const prompt = `
      Eres JurisIA, un buscador jurídico colombiano.
      Pregunta del usuario: "${query}"

      Usa el CONTEXTO LOCAL (Base de datos) y tu conocimiento general (Google Search si es necesario).
      
      IMPORTANTE:
      - Responde directamente a la pregunta.
      - Si encuentras sentencias en el contexto local que sirvan, CÍTALAS.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING },
                relevantIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                externalLinks: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    throw new Error("No response");

  } catch (error) {
    console.error("Error searching:", error);
    return {
      answer: "No se pudo completar la búsqueda en este momento.",
      relevantIds: []
    };
  }
};

// 3. Prepara tu Caso
export const generateCaseArgument = async (userCaseDescription: string, contextDocs: string, database: JurisprudenceCase[]): Promise<string> => {
    if (!apiKey) return "Función no disponible sin API Key.";
    try {
        const relevantDB = database.map(c => 
            `JURISPRUDENCIA DISPONIBLE ID(${c.id}): ${c.title} - ${c.summary} - RULING: ${c.analysis?.ruling || c.text.substring(0,200)}`
        ).join('\n');

        const prompt = `
            Actúa como un abogado litigante experto y estratega.
            TAREA: Redacta un ARGUMENTO JURÍDICO SÓLIDO para el caso expuesto.
            CASO DEL USUARIO: "${userCaseDescription}"
            DOCUMENTOS ADICIONALES: "${contextDocs}"
            BASE DE JURISPRUDENCIA: ${relevantDB}
            INSTRUCCIONES: Identifica el problema jurídico, construye una tesis y usa la jurisprudencia disponible.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text || "No se pudo generar el argumento.";
    } catch (error) {
        return "Hubo un error al generar el argumento jurídico.";
    }
};

// 4. Chat con Documento
export const askDocument = async (question: string, documentText: string): Promise<string> => {
    if (!apiKey) return "Función no disponible sin API Key.";
    try {
        const prompt = `
            Eres un experto legal analizando UN ÚNICO DOCUMENTO.
            DOCUMENTO: "${documentText.substring(0, 20000)}"
            PREGUNTA: "${question}"
            INSTRUCCIONES: Responde basándote EXCLUSIVAMENTE en el documento.
        `;
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text || "No se pudo obtener respuesta.";
    } catch (error) { return "Error al consultar documento."; }
};

// 5. Generador de Minutas
export const generateLegalDocument = async (type: string, details: string): Promise<string> => {
    if (!apiKey) return "Función no disponible sin API Key.";
    try {
        const prompt = `
            Actúa como un abogado redactor experto en Colombia.
            TAREA: Redacta un borrador de "${type}".
            DETALLES: "${details}"
            REGLAS: Formato jurídico formal colombiano. Deja marcadores [ENTRE CORCHETES] para datos faltantes.
        `;
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text || "No se pudo generar el documento.";
    } catch (error) { return "Error al generar el borrador."; }
};

// 6. Comparador
export const compareCases = async (caseA: JurisprudenceCase, caseB: JurisprudenceCase): Promise<{ similarities: string, differences: string, conclusion: string }> => {
  if (!apiKey) return { similarities: "Sin API Key", differences: "", conclusion: "" };
  try {
    const prompt = `
      Actúa como un Magistrado Auxiliar. Realiza un ANÁLISIS COMPARATIVO JURÍDICO.
      SENTENCIA A: ${caseA.title} - ${caseA.text.substring(0, 5000)}
      SENTENCIA B: ${caseB.title} - ${caseB.text.substring(0, 5000)}
      OBJETIVO: Determinar coherencia o contradicción.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            similarities: { type: Type.STRING },
            differences: { type: Type.STRING },
            conclusion: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) return JSON.parse(response.text);
    return { similarities: "", differences: "", conclusion: "No se pudo generar comparación." };

  } catch (error) {
    return { similarities: "Error", differences: "Error", conclusion: "Error en el análisis." };
  }
};
