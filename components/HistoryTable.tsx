import React from 'react';
import { UploadedFile, DocumentCategory } from '../types';
import { FileText, Calendar, Layers } from 'lucide-react';

interface HistoryTableProps {
    history: UploadedFile[];
}

const HistoryTable: React.FC<HistoryTableProps> = ({ history }) => {
    if (history.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-slate-900 font-medium">No history yet</h3>
                <p className="text-slate-500 text-sm mt-1">Upload files to see them listed here.</p>
            </div>
        );
    }

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">Processing History</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-3">File Name</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Pages</th>
                            <th className="px-6 py-3">Breakdown</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {history.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-indigo-500" />
                                    {item.name}
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(item.uploadDate)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Layers className="w-3 h-3" />
                                        {item.pageCount}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-sm">
                                    {item.categorySummary && (
                                        <div className="flex flex-wrap gap-1">
                                            {Object.entries(item.categorySummary).map(([cat, count]) => {
                                                if (count === 0) return null;
                                                return (
                                                    <span key={cat} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                                        {cat}: {count}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HistoryTable;