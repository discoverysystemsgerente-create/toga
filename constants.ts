import { JurisprudenceCase, LegalArea, User, Post, Folder, GeneratedDocument, AgendaEvent } from './types';

export const INITIAL_USER: User = {
  id: 'u1',
  name: 'Dr. Alejandro Martínez',
  email: 'alejandro.martinez@legal.co',
  tier: 'FREE',
  isActive: true,
  interests: [LegalArea.CONSTITUCIONAL, LegalArea.PENAL],
  reputation: 150
};

export const MOCK_DATABASE: JurisprudenceCase[] = [
  {
    id: 'c1',
    title: 'Sentencia C-055/22',
    corporation: 'Corte Constitucional',
    text: 'Despenalización del aborto hasta la semana 24 de gestación...',
    summary: 'Fallo histórico que despenaliza el aborto hasta la semana 24.',
    analysis: {
      facts: 'Demandas de inconstitucionalidad contra el art. 122 del Código Penal.',
      history: 'Precedente de sentencia C-355 de 2006.',
      arguments: 'La Corte consideró que la penalización absoluta vulneraba derechos fundamentales.',
      ruling: 'Declarar EXEQUIBLE el artículo condicionado a la semana 24.'
    },
    area: LegalArea.CONSTITUCIONAL,
    tags: ['aborto', 'salud reproductiva', 'libertad'],
    date: '2022-02-21',
    authorId: 'system',
    aiProcessed: true,
    sourceType: 'TEXT',
    isFavorite: false
  },
  {
    id: 'c2',
    title: 'Sentencia SC001-2023',
    corporation: 'Corte Suprema de Justicia',
    text: 'Responsabilidad civil extracontractual en accidentes de tránsito...',
    summary: 'Criterios estrictos para responsabilidad solidaria de empresas de transporte.',
    analysis: {
      facts: 'Accidente de bus intermunicipal que dejó 3 heridos graves.',
      history: 'Tribunal Superior negó pretensiones por culpa exclusiva de la víctima.',
      arguments: 'La actividad peligrosa presume la culpa del guardián de la cosa.',
      ruling: 'CASAR la sentencia impugnada y condenar a la empresa.'
    },
    area: LegalArea.CIVIL_FAMILIA,
    tags: ['transporte', 'responsabilidad civil', 'daños'],
    date: '2023-01-15',
    authorId: 'system',
    aiProcessed: true,
    sourceType: 'TEXT',
    isFavorite: true,
    userTags: ['Caso Transporte']
  },
  {
    id: 'c3',
    title: 'Sentencia SP123-2023',
    corporation: 'Corte Suprema de Justicia',
    text: 'Dosificación punitiva en concurso de delitos...',
    summary: 'Análisis sobre la dosificación de la pena en conductas concurrentes.',
    area: LegalArea.PENAL,
    tags: ['dosificación', 'penas', 'concurso'],
    date: '2023-03-10',
    authorId: 'system',
    aiProcessed: true,
    sourceType: 'PDF',
    fileName: 'SP123-2023_Completa.pdf',
    isFavorite: false
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: 'u2',
    authorName: 'Anónimo',
    isAnonymous: true,
    area: LegalArea.PENAL,
    content: 'Colegas, ¿alguien tiene experiencia reciente con jueces de garantías en Paloquemao negando libertades por vencimiento de términos con argumentos subjetivos? Me acaba de pasar.',
    likes: 12,
    date: 'Hace 2 horas',
    comments: [
      {
        id: 'cm1',
        authorName: 'Dra. Lucia',
        isAnonymous: false,
        content: 'Sí, están aplicando una directiva interna no oficial. Te recomiendo tutelar por debido proceso.',
        date: 'Hace 1 hora'
      }
    ]
  },
  {
    id: 'p2',
    authorId: 'u3',
    authorName: 'Carlos Ruiz',
    isAnonymous: false,
    area: LegalArea.CIVIL_FAMILIA,
    content: 'Comparto mi análisis sobre la última reforma al Código General del Proceso respecto a la virtualidad. Creo que retrocedimos.',
    likes: 5,
    date: 'Hace 5 horas',
    comments: []
  }
];

export const MOCK_HISTORY = [
  { id: 'h1', query: 'prescripción acción penal', date: 'Hoy, 10:30 AM' },
  { id: 'h2', query: 'custodia compartida requisitos', date: 'Ayer, 4:15 PM' }
];

export const MOCK_FOLDERS: Folder[] = [
    { id: 'f1', name: 'Caso Familia López', createdAt: '2023-10-01', color: 'bg-blue-500' },
    { id: 'f2', name: 'Divorcio Perez', createdAt: '2023-11-15', color: 'bg-emerald-500' }
];

export const MOCK_DOCUMENTS: GeneratedDocument[] = [
    { 
        id: 'd1', 
        title: 'Tutela Salud López', 
        type: 'TUTELA', 
        content: 'SEÑOR JUEZ...\n\nREFERENCIA: ACCIÓN DE TUTELA...', 
        createdAt: '2023-10-02',
        folderId: 'f1'
    }
];

export const MOCK_EVENTS: AgendaEvent[] = [
    { id: 'e1', title: 'Audiencia Inicial - Caso López', date: new Date().toISOString().split('T')[0], time: '09:00', type: 'AUDIENCIA', completed: false },
    { id: 'e2', title: 'Vencimiento Términos Contestación', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'VENCIMIENTO', completed: false }
];