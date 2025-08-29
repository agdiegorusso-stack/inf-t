
import React, { useState } from 'react';
import type { Staff } from '../types';

interface ChangePasswordModalProps {
    staffList: Staff[];
    onClose: () => void;
    onChangePassword: (staffId: string, oldPassword: string, newPassword: string) => Promise<void>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ staffList, onClose, onChangePassword }) => {
    const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!selectedStaffId) {
            setError("Seleziona un utente.");
            return;
        }
        if (!oldPassword || !newPassword || !confirmPassword) {
            setError("Tutti i campi password sono obbligatori.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Le nuove password non coincidono.");
            return;
        }
        if (newPassword.length < 6) {
            setError("La nuova password deve essere di almeno 6 caratteri.");
            return;
        }
        
        setIsLoading(true);
        try {
            await onChangePassword(selectedStaffId, oldPassword, newPassword);
            setSuccess("Password modificata con successo! Ora puoi effettuare il login con la nuova password.");
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Si è verificato un errore inaspettato.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Modifica Password</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4 text-sm">{error}</p>}
                {success && <p className="text-green-600 bg-green-100 p-3 rounded-md mb-4 text-sm">{success}</p>}

                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <fieldset disabled={isLoading}>
                             <div>
                                <label htmlFor="staff-select-modal" className="block text-sm font-medium text-gray-700 mb-1">Nome Utente</label>
                                <select
                                    id="staff-select-modal"
                                    value={selectedStaffId}
                                    onChange={(e) => setSelectedStaffId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {staffList.map(staff => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.name} ({staff.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="old-password-input" className="block text-sm font-medium text-gray-700 mb-1">Vecchia Password</label>
                                <input
                                    id="old-password-input"
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="new-password-input" className="block text-sm font-medium text-gray-700 mb-1">Nuova Password</label>
                                <input
                                    id="new-password-input"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                             <div>
                                <label htmlFor="confirm-password-input" className="block text-sm font-medium text-gray-700 mb-1">Conferma Nuova Password</label>
                                <input
                                    id="confirm-password-input"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </fieldset>

                        <div className="flex justify-end pt-4 space-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition" disabled={isLoading}>Annulla</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center" disabled={isLoading}>
                                {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                Salva Password
                            </button>
                        </div>
                    </form>
                )}
                 {success && (
                     <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Chiudi</button>
                    </div>
                 )}
            </div>
        </div>
    );
};
