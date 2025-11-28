import { GoogleGenAI, Type } from "@google/genai";
import { JurisprudenceCase, LegalArea, JurisprudenceAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = "gemini-2.5-flash";

// 1. Análisis de documentos cargados (Texto, PDF, Link)
export const analyzeLegalText = async (text: string, isUrl: boolean = false): Promise<{ summary: string; analysis: JurisprudenceAnalysis; area: LegalArea; tags: string[]; titleSuggestion: string; corporation: string }> => {
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

// 3. Prepara tu Caso (Generación de Argumentos)
export const generateCaseArgument = async (userCaseDescription: string, contextDocs: string, database: JurisprudenceCase[]): Promise<string> => {
    try {
        const relevantDB = database.map(c => 
            `JURISPRUDENCIA DISPONIBLE ID(${c.id}): ${c.title} - ${c.summary} - RULING: ${c.analysis?.ruling || c.text.substring(0,200)}`
        ).join('\n');

        const prompt = `
            Actúa como un abogado litigante experto y estratega.
            
            TAREA:
            Redacta un ARGUMENTO JURÍDICO SÓLIDO para el caso expuesto por el usuario.
            
            CASO DEL USUARIO:
            "${userCaseDescription}"

            DOCUMENTOS ADICIONALES DEL USUARIO (Contexto PDF/Texto):
            "${contextDocs}"

            BASE DE JURISPRUDENCIA DISPONIBLE:
            ${relevantDB}

            INSTRUCCIONES:
            1. Identifica el problema jurídico principal.
            2. Construye una tesis defensiva o acusatoria (según convenga al usuario).
            3. USA EXCLUSIVAMENTE la jurisprudencia disponible arriba que sea pertinente para respaldar la tesis. Cita las sentencias por su Título o ID.
            4. El tono debe ser formal, argumentativo y persuasivo.
            5. Estructura la respuesta como un texto listo para usar en un alegato o concepto.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text || "No se pudo generar el argumento.";
    } catch (error) {
        console.error("Error generating argument:", error);
        return "Hubo un error al generar el argumento jurídico.";
    }
};

// 4. Chat con Documento (RAG sobre un caso específico)
export const askDocument = async (question: string, documentText: string): Promise<string> => {
    try {
        const prompt = `
            Eres un experto legal analizando UN ÚNICO DOCUMENTO.
            
            DOCUMENTO:
            "${documentText.substring(0, 20000)}"
            
            PREGUNTA DEL ABOGADO:
            "${question}"
            
            INSTRUCCIONES:
            - Responde basándote EXCLUSIVAMENTE en el documento proporcionado.
            - Si la respuesta no está en el documento, dilo claramente.
            - Sé breve y preciso.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text || "No se pudo obtener respuesta del documento.";
    } catch (error) {
        console.error("Error asking document:", error);
        return "Hubo un error al consultar el documento.";
    }
};

// 5. Generador de Minutas y Documentos (Smart Drafter)
export const generateLegalDocument = async (type: string, details: string): Promise<string> => {
    try {
        const prompt = `
            Actúa como un abogado redactor experto en Colombia.
            
            TAREA:
            Redacta un borrador completo de un documento jurídico tipo: "${type}".
            
            DETALLES DEL CASO / INSTRUCCIONES DEL ABOGADO:
            "${details}"

            REGLAS DE REDACCIÓN:
            - Formato jurídico formal colombiano.
            - Incluye encabezado, referencia, hechos, pretensiones, fundamentos de derecho y anexos si aplica.
            - Deja marcadores de posición [ENTRE CORCHETES] para datos que falten (ej: [NOMBRE DEL JUEZ]).
            - El texto debe estar listo para copiar y pegar en un procesador de texto.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text || "No se pudo generar el documento.";
    } catch (error) {
        console.error("Error generating document:", error);
        return "Error al generar el borrador.";
    }
};

// 6. Comparador de Sentencias
export const compareCases = async (caseA: JurisprudenceCase, caseB: JurisprudenceCase): Promise<{ similarities: string, differences: string, conclusion: string }> => {
  try {
    const prompt = `
      Actúa como un Magistrado Auxiliar. Realiza un ANÁLISIS COMPARATIVO JURÍDICO entre estas dos sentencias.

      SENTENCIA A:
      Título: ${caseA.title}
      Fecha: ${caseA.date}
      Corporación: ${caseA.corporation}
      Contenido: ${caseA.text.substring(0, 5000)}

      SENTENCIA B:
      Título: ${caseB.title}
      Fecha: ${caseB.date}
      Corporación: ${caseB.corporation}
      Contenido: ${caseB.text.substring(0, 5000)}

      OBJETIVO:
      Determinar si existe coherencia, contradicción o evolución jurisprudencial (cambio de precedente).

      SALIDA JSON:
      {
        "similarities": "Puntos fácticos o jurídicos en común",
        "differences": "Diferencias clave en la decisión o en los hechos",
        "conclusion": "Veredicto final: ¿Se mantiene la línea, hubo distinción (distinguishing) o cambio de precedente?"
      }
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
    console.error("Error comparing cases:", error);
    return { similarities: "Error", differences: "Error", conclusion: "Error en el análisis." };
  }
};
