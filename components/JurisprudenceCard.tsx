import React from 'react';
import { JurisprudenceCase, LegalArea } from '../types';
import { Scale, FileText, Calendar, Tag, FileUp, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface Props {
  data: JurisprudenceCase;
  expanded?: boolean;
}

const areaColors: Record<LegalArea, string> = {
  [LegalArea.CONSTITUCIONAL]: 'bg-blue-100 text-blue-800 border-blue-200',
  [LegalArea.CIVIL_FAMILIA]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [LegalArea.PENAL]: 'bg-red-100 text-red-800 border-red-200',
  [LegalArea.ADMINISTRATIVA]: 'bg-amber-100 text-amber-800 border-amber-200',
  [LegalArea.DISCIPLINARIA]: 'bg-purple-100 text-purple-800 border-purple-200',
  [LegalArea.LABORAL]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

export const JurisprudenceCard: React.FC<Props> = ({ data, expanded = false }) => {
  
  const SourceIcon = () => {
    switch (data.sourceType) {
      case 'PDF': return <FileUp className="w-4 h-4 mr-1 text-red-500" />;
      case 'LINK': return <LinkIcon className="w-4 h-4 mr-1 text-blue-500" />;
      default: return <FileText className="w-4 h-4 mr-1 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Visual indicator for source type */}
      <div className="absolute top-0 right-0 p-2 opacity-10">
        {data.sourceType === 'PDF' && <FileUp className="w-24 h-24" />}
        {data.sourceType === 'LINK' && <LinkIcon className="w-24 h-24" />}
      </div>

      <div className="flex justify-between items-start mb-3 relative z-10">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${areaColors[data.area]}`}>
          {data.area}
        </span>
        <div className="flex items-center text-slate-400 text-xs bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
          <SourceIcon />
          <span className="mr-3 font-medium text-slate-600">
            {data.sourceType === 'PDF' ? 'Documento PDF' : data.sourceType === 'LINK' ? 'Enlace Externo' : 'Texto'}
          </span>
          <Calendar className="w-3 h-3 mr-1" />
          {data.date}
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center relative z-10">
        <Scale className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0" />
        {data.title}
      </h3>

      <p className="text-slate-600 text-sm mb-4 leading-relaxed relative z-10">
        {data.summary}
      </p>

      {expanded && (
        <div className="mt-4 relative z-10">
          <div className="p-3 bg-slate-50 rounded text-sm text-slate-700 border border-slate-100 italic mb-2">
            <strong>Contenido Analizado:</strong> "{data.text.substring(0, 300)}..."
          </div>
          
          {data.sourceType === 'LINK' && data.sourceUrl && (
             <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-blue-600 hover:underline">
               <ExternalLink className="w-4 h-4 mr-1" />
               Visitar fuente original: {data.sourceUrl}
             </a>
          )}
          
          {data.sourceType === 'PDF' && data.fileName && (
             <div className="inline-flex items-center text-sm text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
               <FileUp className="w-4 h-4 mr-1" />
               Archivo: {data.fileName}
             </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 relative z-10">
        {data.tags.map(tag => (
          <span key={tag} className="flex items-center text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
            <Tag className="w-3 h-3 mr-1" />
            {tag}
          </span>
        ))}
        {data.aiProcessed && (
          <span className="ml-auto text-xs text-indigo-500 font-medium flex items-center" title="Procesado por Inteligencia Artificial">
            <div className="w-2 h-2 rounded-full bg-indigo-500 mr-1 animate-pulse"></div>
            Analizado por IA
          </span>
        )}
      </div>
    </div>
  );
};