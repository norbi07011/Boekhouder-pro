import React from 'react';
import { FileText, Download, MoreVertical, FileSpreadsheet, File } from 'lucide-react';
import { Language } from '../types';
import { DICTIONARY } from '../constants';

export const Documents: React.FC<{ language: Language }> = ({ language }) => {
    const t = DICTIONARY[language];
    
    const docs = [
        { id: 1, name: 'BTW_Q3_ClientX.pdf', type: 'pdf', date: '2023-10-24', size: '2.4 MB', owner: 'Anna' },
        { id: 2, name: 'Jaarrekening_Draft.xlsx', type: 'xls', date: '2023-10-22', size: '1.1 MB', owner: 'Mehmet' },
        { id: 3, name: 'Invoice_77382.pdf', type: 'pdf', date: '2023-10-20', size: '0.5 MB', owner: 'Jan' },
        { id: 4, name: 'Belastingdienst_Brief.pdf', type: 'pdf', date: '2023-10-18', size: '0.2 MB', owner: 'Elif' },
    ];

    const getIcon = (type: string) => {
        if (type === 'xls') return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
        if (type === 'pdf') return <FileText className="w-8 h-8 text-red-600" />;
        return <File className="w-8 h-8 text-slate-400" />;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{t.documents}</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                    {t.upload_doc}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {docs.map(doc => (
                    <div key={doc.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-slate-50 cursor-pointer group">
                        <div className="flex justify-between items-start mb-3">
                            {getIcon(doc.type)}
                            <button className="text-slate-400 hover:text-slate-600">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                        <h4 className="font-semibold text-slate-800 text-sm truncate mb-1">{doc.name}</h4>
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                             <span>{doc.date}</span>
                             <span>{doc.size}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">{doc.owner}</span>
                            <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}