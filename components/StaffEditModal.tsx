
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Staff, ShiftDefinition, Team } from '../types';
import { StaffRole, ContractType, ShiftTime } from '../types';
import { RoleAndSquadIcons } from './RoleAndSquadIcons';

interface StaffEditModalProps {
    staff: Staff;
    onSave: (staffId: string, updates: Partial<Omit<Staff, 'id' | 'name'>>) => void;
    onClose: () => void;
    shiftDefinitions: ShiftDefinition[];
    teams: Team[];
}

export const StaffEditModal: React.FC<StaffEditModalProps> = ({ staff, onSave, onClose, shiftDefinitions, teams }) => {
    const [formData, setFormData] = useState<Staff>(staff);
    
    useEffect(() => {
        setFormData(staff);
    }, [staff]);

    const relevantShifts = useMemo(() => {
        const roleFilter = (s: ShiftDefinition) => {
             if (staff.role === StaffRole.HeadNurse) return s.roles.includes(StaffRole.Nurse) || s.roles.includes(StaffRole.HeadNurse);
             return s.roles.includes(staff.role);
        };
        return shiftDefinitions.filter(s => 
            s.time !== ShiftTime.Absence && 
            s.time !== ShiftTime.Rest && 
            s.time !== ShiftTime.OffShift &&
            roleFilter(s)
        ).sort((a,b) => a.code.localeCompare(b.code));
    }, [staff.role, shiftDefinitions]);

    const handleSave = useCallback(() => {
        const { id, name, ...updates } = formData;
        onSave(staff.id, updates);
        onClose();
    }, [formData, onSave, staff.id, onClose]);
    
    const handleInputChange = (field: keyof Staff, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleShiftAvailabilityChange = (shiftCode: string, isUnavailable: boolean) => {
        const currentUnavail = formData.unavailableShiftCodes || [];
        let newUnavail;
        if (isUnavailable) {
            newUnavail = [...currentUnavail, shiftCode];
        } else {
            newUnavail = currentUnavail.filter(code => code !== shiftCode);
        }
        setFormData(prev => ({...prev, unavailableShiftCodes: newUnavail }));
    };

    const handleTeamChange = (teamId: string, isSelected: boolean) => {
        const currentTeamIds = formData.teamIds || [];
        let newTeamIds;
        if (isSelected) {
            newTeamIds = [...new Set([...currentTeamIds, teamId])];
        } else {
            newTeamIds = currentTeamIds.filter(id => id !== teamId);
        }
        handleInputChange('teamIds', newTeamIds);
    };

    const contractLabel = {
        [ContractType.H6]: "h6",
        [ContractType.H12]: "h12",
        [ContractType.H24]: "h24",
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 flex items-center justify-between border-b">
                     <div>
                        <div className="flex items-center space-x-2">
                            <h2 className="text-2xl font-bold text-gray-800">{staff.name}</h2>
                            <RoleAndSquadIcons staff={staff} />
                        </div>
                        <p className="text-sm text-gray-500">{staff.role} - Contratto: <span className="font-semibold">{contractLabel[staff.contract]}</span></p>
                    </div>
                     <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 max-h-[80vh] overflow-y-auto">
                    {/* Column 1: Dati e Contratto */}
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-700">Dati Anagrafici e Contratto</h4>
                         <div>
                            <label htmlFor={`role-${staff.id}`} className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
                            <select id={`role-${staff.id}`} value={formData.role} onChange={(e) => handleInputChange('role', e.target.value as StaffRole)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                               {Object.values(StaffRole).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor={`contract-${staff.id}`} className="block text-sm font-medium text-gray-700 mb-1">Tipo di Contratto</label>
                            <select id={`contract-${staff.id}`} value={formData.contract} onChange={(e) => handleInputChange('contract', e.target.value as ContractType)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value={ContractType.H6}>h6 - 6 Ore (Solo Mattina)</option>
                                <option value={ContractType.H12}>h12 - 12 Ore (Mattina/Pomeriggio, Lunghe)</option>
                                <option value={ContractType.H24}>h24 - 24 Ore (Tutti i turni, Notte inclusa)</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor={`phone-${staff.id}`} className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                            <input id={`phone-${staff.id}`} type="tel" value={formData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Es. 391234567890"/>
                        </div>
                        <div>
                            <label htmlFor={`email-${staff.id}`} className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input id={`email-${staff.id}`} type="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Es. nome.cognome@ospedale.it"/>
                        </div>
                    </div>

                    {/* Column 2: Regole e Team */}
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-700">Regole e Team</h4>
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input id={`law104-${staff.id}`} type="checkbox" checked={formData.hasLaw104 || false} onChange={(e) => handleInputChange('hasLaw104', e.target.checked)}
                                       className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor={`law104-${staff.id}`} className="font-medium text-gray-700">Legge 104</label>
                                <p className="text-gray-500">Se abilitato, verranno applicate le regole per la L. 104.</p>
                            </div>
                        </div>
                         <div>
                            <label htmlFor={`specialRules-${staff.id}`} className="block text-sm font-medium text-gray-700 mb-1">Note e Regole Specifiche</label>
                            <textarea id={`specialRules-${staff.id}`} value={formData.specialRules || ''} onChange={(e) => handleInputChange('specialRules', e.target.value)}
                                      rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Es. 'Evitare doppi turni', '3 giorni HD a settimana'"></textarea>
                        </div>
                        {formData.contract === ContractType.H24 && (
                            <div>
                                <label htmlFor={`night-squad-${staff.id}`} className="block text-sm font-medium text-gray-700 mb-1">Squadra Notte</label>
                                <select
                                    id={`night-squad-${staff.id}`}
                                    value={formData.nightSquad || 0}
                                    onChange={(e) => handleInputChange('nightSquad', e.target.value === '0' ? undefined : parseInt(e.target.value, 10))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="0">Nessuna</option>
                                    <option value="1">Squadra 1</option>
                                    <option value="2">Squadra 2</option>
                                    <option value="3">Squadra 3</option>
                                    <option value="4">Squadra 4</option>
                                    <option value="5">Squadra 5</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Assegna una squadra per la rotazione automatica delle notti.</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Team di Appartenenza</label>
                            <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-white rounded-md border">
                                {teams.map(team => (
                                    <div key={team.id} className="flex items-center">
                                        <input type="checkbox" id={`team-modal-${staff.id}-${team.id}`} 
                                               checked={formData.teamIds?.includes(team.id)}
                                               onChange={(e) => handleTeamChange(team.id, e.target.checked)}
                                               className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                                        <label htmlFor={`team-modal-${staff.id}-${team.id}`} className="ml-3 flex items-center text-sm text-gray-700">
                                            {team.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Disponibilità */}
                    <div>
                         <h4 className="text-md font-semibold text-gray-700">Disponibilità Turni</h4>
                         <p className="text-sm text-gray-500 mb-3">Deseleziona i turni che questa persona <span className="font-bold">non deve</span> svolgere.</p>
                         <div className="max-h-96 overflow-y-auto space-y-2 p-3 bg-white rounded-md border">
                             {relevantShifts.map(shift => (
                                <div key={shift.code} className="flex items-center">
                                    <input type="checkbox" id={`shift-${staff.id}-${shift.code}`} 
                                           checked={!formData.unavailableShiftCodes?.includes(shift.code)}
                                           onChange={(e) => handleShiftAvailabilityChange(shift.code, !e.target.checked)}
                                           className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                                    <label htmlFor={`shift-${staff.id}-${shift.code}`} className="ml-3 flex items-center text-sm text-gray-700">
                                        <span className={`w-8 text-center mr-2 font-bold p-1 text-xs rounded-sm ${shift.color} ${shift.textColor}`}>{shift.code.replace('_doc', '')}</span>
                                        {shift.description}
                                    </label>
                                </div>
                             ))}
                         </div>
                    </div>
                </div>
                 {/* Action Buttons */}
                <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Annulla</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Salva Modifiche</button>
                </div>
            </div>
        </div>
    );
};