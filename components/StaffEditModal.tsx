import React, { useState } from 'react';
import type { Staff, ContractType, StaffRole } from '../types';
import { ContractType as ContractEnum, StaffRole as RoleEnum } from '../types';

interface StaffEditModalProps {
    staff: Staff;
    onClose: () => void;
    onSave: (staffId: string, newContract: ContractType, newRole: StaffRole) => void;
}

export const StaffEditModal: React.FC<StaffEditModalProps> = ({ staff, onClose, onSave }) => {
    const [contract, setContract] = useState<ContractType>(staff.contract);
    const [role, setRole] = useState<StaffRole>(staff.role);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(staff.id, contract, role);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Modifica Personale</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <p className="text-lg font-medium text-gray-900">{staff.name}</p>
                    </div>
                     <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as StaffRole)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                           {Object.values(RoleEnum).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="contract" className="block text-sm font-medium text-gray-700 mb-1">Tipo di Contratto</label>
                        <select
                            id="contract"
                            value={contract}
                            onChange={(e) => setContract(e.target.value as ContractType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value={ContractEnum.H6}>h6 - 6 Ore (Solo Mattina)</option>
                            <option value={ContractEnum.H12}>h12 - 12 Ore (Mattina/Pomeriggio, Lunghe)</option>
                            <option value={ContractEnum.H24}>h24 - 24 Ore (Tutti i turni, Notte inclusa)</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4 space-x-3 border-t mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Annulla</button>

                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Salva Modifiche</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
