import React from 'react';
import { Scale } from 'lucide-react';
export const JurisprudenceCard = ({ data }: any) => (
  <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
    <h3 className="font-bold flex items-center"><Scale className="w-4 h-4 mr-2 text-indigo-600"/>{data.title}</h3>
    <p className="text-sm text-slate-600 mt-2">{data.summary}</p>
  </div>
);