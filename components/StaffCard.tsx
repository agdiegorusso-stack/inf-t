
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Staff, ShiftDefinition, Team } from '../types';
import { StaffRole, ContractType, ShiftTime } from '../types';

interface StaffCardProps {
    staff: Staff;
    onSave: (staffId: string, updates: Partial<Omit<Staff, 'id' | 'name'>>) => void;
    shiftDefinitions: ShiftDefinition[];
    teams: Team[];
}

export const StaffCard: React.FC<StaffCardProps> = ({ staff, onSave, shiftDefinitions, teams }) => {
    const [isExpanded, setIsExpanded] = useState(false);
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

    const handleCancel = useCallback(() => {
        setFormData(staff);
        setIsExpanded(false);
    }, [staff]);

    const handleSave = useCallback(() => {
        const { id, name, ...updates } = formData;
        onSave(staff.id, updates);
        setIsExpanded(false);
    }, [formData, onSave, staff.id]);
    
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
    }

    return (
        <div className="bg-white rounded-lg shadow-md transition-all duration-300">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                     <div className={`w-3 h-10 rounded-full ${isExpanded ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <div>
                        <p className="text-lg font-bold text-gray-800">{staff.name}</p>
                        <p className="text-sm text-gray-500">{staff.role} - Contratto: <span className="font-semibold">{contractLabel[staff.contract]}</span></p>
                    </div>
                </div>
                <button onClick={() => setIsExpanded(!isExpanded)} className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                    {isExpanded ? 'Chiudi' : 'Gestisci'}
                </button>
            </div>
            
            {isExpanded && (
                <div className="border-t border-gray-200 p-6 space-y-6 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Column 1: Dati e Contratto */}
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-700">Dati e Contratto</h4>
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
                                </div>
                            </div>
                             <div>
                                <label htmlFor={`specialRules-${staff.id}`} className="block text-sm font-medium text-gray-700 mb-1">Note e Regole Specifiche</label>
                                <textarea id={`specialRules-${staff.id}`} value={formData.specialRules || ''} onChange={(e) => handleInputChange('specialRules', e.target.value)}
                                          rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="Es. 'Evitare doppi turni'"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team di Appartenenza</label>
                                <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-white rounded-md border">
                                    {teams.map(team => (
                                        <div key={team.id} className="flex items-center">
                                            <input type="checkbox" id={`team-${staff.id}-${team.id}`} 
                                                   checked={formData.teamIds?.includes(team.id)}
                                                   onChange={(e) => handleTeamChange(team.id, e.target.checked)}
                                                   className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                                            <label htmlFor={`team-${staff.id}-${team.id}`} className="ml-3 flex items-center text-sm text-gray-700">
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
                                        <input type="checkbox" id={`shift-card-${staff.id}-${shift.code}`} 
                                               checked={!formData.unavailableShiftCodes?.includes(shift.code)}
                                               onChange={(e) => handleShiftAvailabilityChange(shift.code, !e.target.checked)}
                                               className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                                        <label htmlFor={`shift-card-${staff.id}-${shift.code}`} className="ml-3 flex items-center text-sm text-gray-700">
                                            <span className={`w-8 text-center mr-2 font-bold p-1 text-xs rounded-sm ${shift.color} ${shift.textColor}`}>{shift.code.replace('_doc', '')}</span>
                                            {shift.description}
                                        </label>
                                    </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button onClick={handleCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Annulla</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Salva Modifiche</button>
                    </div>
                </div>
            )}
        </div>
    );
};