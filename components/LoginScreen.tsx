
import React, { useState, useMemo } from 'react';
import type { Staff } from '../types';
import { UNASSIGNED_STAFF_ID } from '../constants';
import { ChangePasswordModal } from './ChangePasswordModal';

interface LoginScreenProps {
    staffList: Staff[];
    onLogin: (staffId: string, password: string) => void;
    onChangePassword: (staffId: string, oldPassword: string, newPassword: string) => Promise<void>;
    error?: string | null;
    isLoading?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ staffList, onLogin, onChangePassword, error, isLoading }) => {
    const selectableStaff = useMemo(() => 
        staffList.filter(staff => staff.id !== UNASSIGNED_STAFF_ID),
        [staffList]
    );
    
    const [selectedStaffId, setSelectedStaffId] = useState<string>(selectableStaff[0]?.id || '');
    const [password, setPassword] = useState('');
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if(selectedStaffId && !isLoading) {
            onLogin(selectedStaffId, password);
        }
    };

    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
                    <div className="text-center">
<img src="https://cosips.it/wp-content/uploads/2020/07/asl-roma2.png" alt="Logo ASL Roma 2" className="w-80 h-auto mx-auto" />
                        <h1 className="mt-4 text-3xl font-bold text-gray-800">Gestione Turni</h1>
                        <p className="mt-2 text-sm text-gray-600">Inserisci le tue credenziali per accedere</p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        <fieldset disabled={isLoading}>
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="staff-select" className="block text-sm font-medium text-gray-700 mb-1">Nome Utente</label>
                                    <select
                                        id="staff-select"
                                        value={selectedStaffId}
                                        onChange={(e) => setSelectedStaffId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200"
                                    >
                                        <option value="" disabled>-- Seleziona il tuo nome --</option>
                                        {selectableStaff.map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.name} ({staff.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        id="password-input"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="********"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200"
                                    />
                                </div>
                            </div>
                        </fieldset>
                        
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={!selectedStaffId || !password || isLoading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Accesso in corso...</span>
                                    </>
                                ) : (
                                    <span>Accedi</span>
                                )}
                            </button>
                        </div>
                    </form>
                    <div className="text-sm text-center">
                        <button
                            type="button"
                            onClick={() => setIsChangePasswordOpen(true)}
                            disabled={isLoading}
                            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none disabled:text-gray-400"
                        >
                            Hai dimenticato o vuoi modificare la password?
                        </button>
                    </div>
                </div>
            </div>
            {isChangePasswordOpen && (
                <ChangePasswordModal
                    staffList={selectableStaff}
                    onClose={() => setIsChangePasswordOpen(false)}
                    onChangePassword={onChangePassword}
                />
            )}
        </>
    );
}