
import React, { useState, useEffect } from 'react';
import type { Staff } from '../types';
import { SHIFT_DEFINITIONS } from '../constants';
import { ShiftTime, StaffRole } from '../types';

interface AbsenceModalProps {
    staffList: Staff[];
    onClose: () => void;
    onAddAbsence: (staffId: string, reason: string, startDate: Date, endDate: Date) => void;
    currentUser: Staff;
}

export const AbsenceModal: React.FC<AbsenceModalProps> = ({ staffList, onClose, onAddAbsence, currentUser }) => {
    const [staffId, setStaffId] = useState<string>(currentUser.id);
    const [reason, setReason] = useState<string>('A');
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');

    const isHeadNurse = currentUser.role === StaffRole.HeadNurse;

    useEffect(() => {
        // If user is not a head nurse, ensure the selected staffId is always their own.
        if (!isHeadNurse) {
            setStaffId(currentUser.id);
        }
    }, [currentUser, isHeadNurse]);

    const absenceReasons = SHIFT_DEFINITIONS.filter(s => s.time === ShiftTime.Absence);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffId || !reason || !startDate || !endDate) {
            setError("Tutti i campi sono obbligatori.");
            return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            setError("La data di inizio non può essere successiva alla data di fine.");
            return;
        }
        onAddAbsence(staffId, reason, start, end);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all"  onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Segnala Assenza</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4 text-sm">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="staff" className="block text-sm font-medium text-gray-700 mb-1">Personale</label>
                        <select 
                            id="staff" 
                            value={staffId} 
                            onChange={e => setStaffId(e.target.value)} 
                            disabled={!isHeadNurse}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            {isHeadNurse ? (
                                staffList.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)
                            ) : (
                                <option value={currentUser.id}>{currentUser.name}</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                        <select id="reason" value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                           {absenceReasons.map(r => <option key={r.code} value={r.code}>{r.description} ({r.code})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Data Inizio</label>
                           <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Data Fine</label>
                            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Annulla</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Aggiungi Assenza</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
