export enum LegalArea {
  CONSTITUCIONAL = 'Constitucional',
  CIVIL_FAMILIA = 'Civil y Familia',
  PENAL = 'Penal',
  ADMINISTRATIVA = 'Administrativa',
  DISCIPLINARIA = 'Disciplinaria',
  LABORAL = 'Laboral'
}

export type SourceType = 'TEXT' | 'PDF' | 'LINK';

export interface JurisprudenceAnalysis {
  facts: string;       // Hechos relevantes
  history: string;     // Decisiones de instancias anteriores
  arguments: string;   // Argumentos principales de la corte
  ruling: string;      // El "Resuelve"
}

export interface JurisprudenceCase {
  id: string;
  title: string;
  text: string;
  summary: string; // Resumen corto para vista previa
  analysis?: JurisprudenceAnalysis; // Análisis detallado por IA
  area: LegalArea;
  tags: string[];
  date: string;
  corporation: string; // Ej: Corte Constitucional
  authorId: string;
  aiProcessed: boolean;
  sourceType: SourceType;
  sourceUrl?: string;
  fileName?: string;
  isFavorite?: boolean;
  userTags?: string[]; // Etiquetas personalizadas del usuario
  folderId?: string; // ID of the folder this case belongs to
}

export type SubscriptionTier = 'FREE' | 'PREMIUM';

export interface User {
  id: string;
  name: string;
  email: string;
  tier: SubscriptionTier;
  isActive: boolean;
  interests: LegalArea[];
  reputation: number; // Puntos de reputación por contribuir
}

export interface SearchResult {
  answer: string;
  relevantCases: JurisprudenceCase[];
  externalLinks?: string[];
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  date: string;
}

// --- Community Types ---
export interface Comment {
  id: string;
  authorName: string; // Puede ser "Anónimo"
  isAnonymous: boolean;
  content: string;
  date: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  area: LegalArea;
  content: string;
  likes: number;
  comments: Comment[];
  date: string;
}

export interface PrepareCaseSession {
  userFacts: string;
  aiResponse: string;
  usedReferences: string[]; // IDs de casos usados
}

// --- New Types for Drafter and Folders ---

export type DocumentType = 'TUTELA' | 'DERECHO_PETICION' | 'CONTRATO' | 'MEMORIAL' | 'OTRO';

export interface GeneratedDocument {
  id: string;
  title: string;
  type: DocumentType;
  content: string;
  createdAt: string;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  color: string; // Tailwind color class for visual distinction
}

// --- Agenda Types ---
export type EventType = 'AUDIENCIA' | 'VENCIMIENTO' | 'REUNION' | 'OTRO';

export interface AgendaEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  type: EventType;
  description?: string;
  completed: boolean;
}