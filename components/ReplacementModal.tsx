import React from 'react';
import type { ScheduledShift, ReplacementOption, Staff, ShiftDefinition } from '../types';
import { StaffRole } from '../types';

interface ReplacementModalProps {
    shift: ScheduledShift;
    replacements: ReplacementOption[];
    onClose: () => void;
    onAssign: (shift: ScheduledShift, staffId: string) => void;
    getStaffById: (id: string) => Staff | undefined;
    getShiftDefinitionByCode: (code: string) => ShiftDefinition | undefined;
    currentUser: Staff;
}

export const ReplacementModal: React.FC<ReplacementModalProps> = ({ shift, replacements, onClose, onAssign, getStaffById, getShiftDefinitionByCode, currentUser }) => {
    // If the shift has an originalStaffId, it's an uncovered shift. Otherwise, it's a standard shift lookup.
    const absentStaff = shift.originalStaffId ? getStaffById(shift.originalStaffId) : getStaffById(shift.staffId);
    const shiftDef = shift.shiftCode ? getShiftDefinitionByCode(shift.shiftCode) : undefined;
    
    const isHeadNurse = currentUser.role === StaffRole.HeadNurse;

    const handleNotify = (staffName: string) => {
        alert(`Messaggio WhatsApp simulato inviato a ${staffName} per la copertura del turno.`);
    };

    if (!absentStaff || !shiftDef) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-red-600">Turno Scoperto</h2>
                        <p className="text-gray-600 mt-1">
                            {new Date(shift.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                             - <span className={`font-semibold px-2 py-0.5 rounded-md text-sm ${shiftDef.color} ${shiftDef.textColor}`}>{shiftDef.description}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-2">Sostituzione per assenza di: <span className="font-medium">{absentStaff.name}</span></p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Sostituti Potenziali (Ordinati per Idoneità)</h3>
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                        {replacements.length > 0 ? (
                            replacements.map(({ staff, reason }) => (
                                <div key={staff.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div>
                                        <p className="font-semibold text-gray-800">{staff.name}</p>
                                        <p className="text-sm text-green-600">{reason}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {isHeadNurse && (
                                            <button onClick={() => onAssign(shift, staff.id)} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition">Assegna</button>
                                        )}
                                        <button onClick={() => handleNotify(staff.name)} className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition">Notifica</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 p-4 bg-gray-100 rounded-md">Nessun sostituto idoneo trovato.</p>
                        )}
                    </div>
                </div>

                 <div className="flex justify-end pt-6 mt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Chiudi</button>
                </div>
            </div>
        </div>
    );
};