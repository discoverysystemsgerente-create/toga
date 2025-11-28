import { User, LegalArea, JurisprudenceCase, Post, Folder, GeneratedDocument, AgendaEvent } from './types';

export const INITIAL_USER: User = {
  id: 'u1', name: 'Usuario Invitado', email: 'usuario@toga.co', tier: 'FREE',
  isActive: true, interests: [], reputation: 0
};
export const MOCK_DATABASE: JurisprudenceCase[] = [];
export const MOCK_POSTS: Post[] = [];
export const MOCK_HISTORY = [];
export const MOCK_FOLDERS: Folder[] = [];
export const MOCK_DOCUMENTS: GeneratedDocument[] = [];
export const MOCK_EVENTS: AgendaEvent[] = [];