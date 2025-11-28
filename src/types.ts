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
  facts: string; history: string; arguments: string; ruling: string;
}
export interface JurisprudenceCase {
  id: string; title: string; text: string; summary: string; analysis?: JurisprudenceAnalysis;
  area: LegalArea; tags: string[]; date: string; corporation: string; authorId: string;
  aiProcessed: boolean; sourceType: SourceType; sourceUrl?: string; fileName?: string;
  isFavorite?: boolean; userTags?: string[]; folderId?: string;
}
export type SubscriptionTier = 'FREE' | 'PREMIUM';
export interface User {
  id: string; name: string; email: string; tier: SubscriptionTier; isActive: boolean;
  interests: LegalArea[]; reputation: number;
}
export interface Post {
  id: string; authorId: string; authorName: string; isAnonymous: boolean; area: LegalArea;
  content: string; likes: number; comments: any[]; date: string;
}
export interface SearchHistoryItem { id: string; query: string; date: string; }
export interface Comment { id: string; authorName: string; isAnonymous: boolean; content: string; date: string; }
export interface Folder { id: string; name: string; createdAt: string; color: string; }
export type DocumentType = 'TUTELA' | 'DERECHO_PETICION' | 'CONTRATO' | 'MEMORIAL' | 'OTRO';
export interface GeneratedDocument {
  id: string; title: string; type: DocumentType; content: string; createdAt: string; folderId?: string;
}
export type EventType = 'AUDIENCIA' | 'VENCIMIENTO' | 'REUNION' | 'OTRO';
export interface AgendaEvent {
  id: string; title: string; date: string; time?: string; type: EventType; description?: string; completed: boolean;
}