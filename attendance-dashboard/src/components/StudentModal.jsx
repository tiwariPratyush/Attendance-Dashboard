import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const StudentModal = ({ studentId, onClose }) => {
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/student/${studentId}`);
                const data = await res.json();
                setHistory(data.history);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (studentId) fetchDetails();
    }, [studentId]);

    if (!studentId) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Student Details</h2>
                        <p className="text-blue-400 font-mono text-lg">{studentId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="text-gray-400" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading history...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <th className="text-gray-500 font-medium text-sm uppercase tracking-wider">Date</th>
                                    <th className="text-gray-500 font-medium text-sm uppercase tracking-wider">Class</th>
                                    <th className="text-gray-500 font-medium text-sm uppercase tracking-wider">In Time</th>
                                    <th className="text-gray-500 font-medium text-sm uppercase tracking-wider">Out Time</th>
                                    <th className="text-gray-500 font-medium text-sm uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {history?.map((log, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4 text-gray-300 font-mono text-sm">{log.date}</td>
                                        <td className="py-3 px-4 text-gray-300">{log.class_id || '-'}</td>
                                        <td className="py-3 px-4 text-gray-300 font-mono text-sm">{log.in_time || '-'}</td>
                                        <td className="py-3 px-4 text-gray-300 font-mono text-sm">{log.out_time || '-'}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${log.status.includes('Absent') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                log.status.includes('½Present') ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                    'bg-green-500/10 text-green-400 border-green-500/20'
                                                }`}>
                                                {log.status.includes('Absent') ? <XCircle size={12} /> :
                                                    log.status.includes('½Present') ? <AlertCircle size={12} /> :
                                                        <CheckCircle size={12} />}
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentModal;
