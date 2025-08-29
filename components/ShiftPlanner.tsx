
// FIX: Import `useCallback` from `react` to resolve 'Cannot find name' error.
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Staff, ScheduledShift, ShiftDefinition, ShiftRequirements, RequirementPreset } from '../types';
import { UNASSIGNED_STAFF_ID } from '../constants';
import { Location, ShiftTime, ContractType, StaffRole } from '../types';
import { isShiftAllowed } from '../utils/shiftUtils';
import { REQUIREMENT_PRESETS } from '../constants/plannerPresets';
import type { ActiveTab } from '../App';
import { AddShiftModal } from './AddShiftModal';
import { EditShiftModal } from './EditShiftModal';

interface ShiftPlannerProps {
    staffList: Staff[]; // This will be pre-filtered by App.tsx based on the active tab
    activeTab: ActiveTab;
    onGenerateSchedule: (newShifts: ScheduledShift[], targetMonth: string, affectedStaffIds: string[]) => void;
    getShiftDefinitionByCode: (code: string) => ShiftDefinition | undefined;
    scheduledShifts: ScheduledShift[];
    shiftDefinitions: ShiftDefinition[];
    onAddShift: (newShift: ShiftDefinition) => void;
    deleteShiftDefinition: (code: string) => void;
    updateShiftDefinition: (originalCode: string, updatedShift: ShiftDefinition) => void;
    initialShiftDefinitions: ShiftDefinition[];
}

const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const tabTitleMap: Record<ActiveTab, string> = {
    nurses: 'Infermieri e Caposala',
    oss: 'OSS',
    doctors: 'Medici',
};

// Helper to format date to YYYY-MM-DD without timezone issues
const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const ShiftPlanner: React.FC<ShiftPlannerProps> = ({ staffList, activeTab, onGenerateSchedule, getShiftDefinitionByCode, scheduledShifts, shiftDefinitions, onAddShift, deleteShiftDefinition, updateShiftDefinition, initialShiftDefinitions }) => {
    
    const [requirements, setRequirements] = useState<ShiftRequirements>({});
    const [presets, setPresets] = useState<RequirementPreset[]>([]);
    const [selectedPresetId, setSelectedPresetId] = useState<string>('');
    const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 7));
    const [generationLog, setGenerationLog] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isSavingPreset, setIsSavingPreset] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(null);

    const initialShiftCodes = useMemo(() => new Set(initialShiftDefinitions.map(s => s.code)), [initialShiftDefinitions]);
    
    const relevantShifts = useMemo(() => {
        return shiftDefinitions.filter(s => {
            if (s.time === ShiftTime.Absence || s.time === ShiftTime.Rest || s.time === ShiftTime.OffShift) return false;
            switch(activeTab) {
                case 'nurses':
                    return s.roles.includes(StaffRole.Nurse) || s.roles.includes(StaffRole.HeadNurse);
                case 'oss':
                    return s.roles.includes(StaffRole.OSS);
                case 'doctors':
                    return s.roles.includes(StaffRole.Doctor);
                default:
                    return false;
            }
        }).sort((a,b) => a.code.localeCompare(b.code));
    }, [activeTab, shiftDefinitions]);

    const handlePresetChange = useCallback((presetId: string) => {
        setSelectedPresetId(presetId);
        const selected = presets.find(p => p.id === presetId);
        if (selected) {
            setRequirements(JSON.parse(JSON.stringify(selected.requirements)));
        }
        setIsConfirmingDelete(false); // Annulla la conferma di eliminazione quando si cambia template
    }, [presets]);

    // Helper function to save user-created presets to localStorage.
    const saveUserPresets = useCallback((currentPresets: RequirementPreset[]) => {
        const userPresetsToSave = currentPresets.filter(p => !p.id.startsWith('preset-'));
        try {
            localStorage.setItem(`userPresets_${activeTab}`, JSON.stringify(userPresetsToSave));
        } catch (error) {
            console.error("Failed to save user presets to localStorage:", error);
        }
    }, [activeTab]);
    
    // Effect to load presets from constants and localStorage when the tab changes.
    useEffect(() => {
        const defaultPresets = REQUIREMENT_PRESETS.filter(p => p.role === activeTab || p.role === 'all');
        let userPresets: RequirementPreset[] = [];
        try {
            const savedData = localStorage.getItem(`userPresets_${activeTab}`);
            if (savedData) {
                userPresets = JSON.parse(savedData);
            }
        } catch (error) {
            console.error("Failed to parse user presets from localStorage:", error);
            localStorage.removeItem(`userPresets_${activeTab}`);
        }
        
        const allPresets = [...defaultPresets, ...userPresets];
        setPresets(allPresets);

        const initialPresetToLoad = userPresets[0] || defaultPresets.find(p => p.id !== 'preset-empty') || defaultPresets[0];

        if (initialPresetToLoad) {
            setSelectedPresetId(initialPresetToLoad.id);
            setRequirements(JSON.parse(JSON.stringify(initialPresetToLoad.requirements)));
        } else {
             setSelectedPresetId('');
             setRequirements({});
        }
        setIsConfirmingDelete(false);
    }, [activeTab]);


    const handleRequirementChange = (code: string, dayIndex: number, value: number) => {
        setRequirements(prev => ({
            ...prev,
            [code]: (prev[code] || Array(7).fill(0)).map((v, i) => i === dayIndex ? Math.max(0, value) : v)
        }));
    };
    
    const handleConfirmSavePreset = () => {
        const roleName = tabTitleMap[activeTab];
        const name = newPresetName;

        if (!name || name.trim() === "") {
            alert("Il nome del template non può essere vuoto.");
            return;
        }

        const fullName = `${name.trim()} (${roleName})`;

        if (presets.some(p => p.name.toLowerCase() === fullName.toLowerCase())) {
            alert("Esiste già un template con questo nome.");
            return;
        }
        const newPreset: RequirementPreset = {
            id: `user-preset-${activeTab}-${Date.now()}`,
            name: fullName,
            requirements: JSON.parse(JSON.stringify(requirements)),
            role: activeTab,
        };
        const newPresets = [...presets, newPreset];
        setPresets(newPresets);
        saveUserPresets(newPresets);
        setSelectedPresetId(newPreset.id);
        alert(`Template "${name.trim()}" salvato con successo.`);

        setIsSavingPreset(false);
        setNewPresetName('');
    };
    
    const handleRenamePreset = () => {
        const selectedPreset = presets.find(p => p.id === selectedPresetId);
        if (!selectedPreset || selectedPreset.id.startsWith('preset-')) {
            alert("I template di default non possono essere rinominati.");
            return;
        }
        const roleName = tabTitleMap[activeTab];
        const baseName = selectedPreset.name.replace(/\s\(.*\)$/, '');

        const newBaseName = window.prompt(`Rinomina template "${baseName}":`, baseName);
        if (!newBaseName || newBaseName.trim() === "" || newBaseName.trim() === baseName) return;
        
        const finalNewName = `${newBaseName.trim()} (${roleName})`;

        if (presets.some(p => p.id !== selectedPresetId && p.name.toLowerCase() === finalNewName.toLowerCase())) {
            alert("Esiste già un template con questo nome.");
            return;
        }

        const newPresets = presets.map(p => p.id === selectedPresetId ? { ...p, name: finalNewName } : p);
        setPresets(newPresets);
        saveUserPresets(newPresets);
    };

    const handleDeletePreset = () => {
        const selectedPreset = presets.find(p => p.id === selectedPresetId);
        if (!selectedPreset || selectedPreset.id.startsWith('preset-')) {
            alert("I template di default non possono essere eliminati.");
            return;
        }
        setIsConfirmingDelete(true);
    };

    const confirmDeletePreset = () => {
        const newPresets = presets.filter(p => p.id !== selectedPresetId);
        setPresets(newPresets);
        saveUserPresets(newPresets);
        
        const presetToLoad = newPresets.find(p => !p.id.startsWith('preset-') && p.id !== 'preset-empty') || newPresets.find(p => p.id !== 'preset-empty') || newPresets[0];
        
        if (presetToLoad) {
            handlePresetChange(presetToLoad.id);
        } else {
            const emptyPreset = REQUIREMENT_PRESETS.find(p => p.id === 'preset-empty');
            if (emptyPreset) {
                handlePresetChange(emptyPreset.id);
            }
        }
        setIsConfirmingDelete(false);
    };

    const cancelDeletePreset = () => {
        setIsConfirmingDelete(false);
    };

    const handleResetRequirements = () => {
        const emptyPreset = REQUIREMENT_PRESETS.find(p => p.id === 'preset-empty');
        if(emptyPreset) handlePresetChange(emptyPreset.id);
    };
    
    const handleAddShift = (newShiftData: Omit<ShiftDefinition, 'roles'>) => {
        const roles: StaffRole[] = [];
        switch(activeTab) {
            case 'nurses':
                roles.push(StaffRole.Nurse, StaffRole.HeadNurse);
                break;
            case 'oss':
                roles.push(StaffRole.OSS);
                break;
            case 'doctors':
                roles.push(StaffRole.Doctor);
                break;
        }
        onAddShift({ ...newShiftData, roles });
        setIsAddShiftModalOpen(false);
    };

    const handleEditShiftClick = (shift: ShiftDefinition) => {
        setEditingShift(shift);
    };

    const handleSaveShift = (updatedShift: ShiftDefinition) => {
        if (editingShift) {
            updateShiftDefinition(editingShift.code, updatedShift);
        }
        setEditingShift(null);
    };
    
    const handleDeleteShift = (code: string) => {
        deleteShiftDefinition(code);
        setEditingShift(null);
    };

    const handleGenerate = useCallback(() => {
        setIsGenerating(true);
        setGenerationLog([]);

        setTimeout(() => {
            try {
                const [year, month] = targetDate.split('-').map(Number);
                const daysInMonth = new Date(year, month, 0).getDate();
                const log: string[] = [`ℹ️ Inizio generazione per ${tabTitleMap[activeTab]} - ${targetDate}...`];
                const newSchedule: ScheduledShift[] = [];
                const staffAssignments: Record<string, Record<string, string>> = {};

                // --- GESTIONE SMONTO NOTTE DAL MESE PRECEDENTE ---
                const firstDayOfMonth = new Date(year, month - 1, 1);
                const lastDayOfPrevMonth = new Date(firstDayOfMonth.getTime() - (24 * 60 * 60 * 1000));
                const lastDayOfPrevMonthStr = formatDate(lastDayOfPrevMonth);
                const firstDayOfTargetMonthStr = formatDate(firstDayOfMonth);

                log.push(`ℹ️ Controllo smonto notte dal mese precedente (${lastDayOfPrevMonthStr}).`);

                staffList.forEach(staff => {
                    const lastMonthShift = scheduledShifts.find(s => s.staffId === staff.id && s.date === lastDayOfPrevMonthStr);
                    const lastMonthShiftDef = lastMonthShift?.shiftCode ? getShiftDefinitionByCode(lastMonthShift.shiftCode) : null;

                    if (lastMonthShiftDef && lastMonthShiftDef.time === ShiftTime.Night) {
                        if (!staffAssignments[staff.id]) {
                            staffAssignments[staff.id] = {};
                        }
                        staffAssignments[staff.id][firstDayOfTargetMonthStr] = 'S';
                        log.push(`💡 Pre-assegnato smonto notte ('S') a ${staff.name} per il ${firstDayOfTargetMonthStr}.`);
                    }
                });

                // --- GESTIONE RIPOSO DOMENICALE (SPECIFICO PER INFERMIERI) ---
                if (activeTab === 'nurses') {
                    log.push(`ℹ️ Applica regola - Riposo Domenicale per Caposala, h6 e h12.`);
                    const staffToRestOnSunday = staffList.filter(s =>
                        s.role === StaffRole.HeadNurse ||
                        s.contract === ContractType.H6 ||
                        s.contract === ContractType.H12
                    );
                    for (let day = 1; day <= daysInMonth; day++) {
                        const date = new Date(year, month - 1, day);
                        if (date.getDay() === 0) { // È Domenica
                            const dateStr = formatDate(date);
                            staffToRestOnSunday.forEach(staff => {
                                if (!staffAssignments[staff.id]) staffAssignments[staff.id] = {};
                                if (!staffAssignments[staff.id][dateStr]) {
                                    staffAssignments[staff.id][dateStr] = 'RS';
                                }
                            });
                        }
                    }
                }

                // --- NUOVO ALGORITMO DI GENERAZIONE GIORNALIERO ---
                const shiftTimePriority: Record<ShiftTime, number> = {
                    [ShiftTime.Night]: 1,
                    [ShiftTime.Afternoon]: 2,
                    [ShiftTime.Morning]: 3,
                    [ShiftTime.FullDay]: 4,
                    [ShiftTime.Absence]: 9,
                    [ShiftTime.Rest]: 9,
                    [ShiftTime.OffShift]: 9
                };

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month - 1, day);
                    const dateStr = formatDate(date);
                    const dayOfWeek = date.getDay();

                    const requiredSlots: { code: string, originalIndex: number }[] = [];
                    Object.entries(requirements).forEach(([shiftCode, needs]) => {
                        const neededCount = needs[dayOfWeek] || 0;
                        for (let i = 0; i < neededCount; i++) {
                            requiredSlots.push({ code: shiftCode, originalIndex: i });
                        }
                    });

                    requiredSlots.sort((a, b) => {
                        const defA = getShiftDefinitionByCode(a.code);
                        const defB = getShiftDefinitionByCode(b.code);
                        const priorityA = defA ? shiftTimePriority[defA.time] : 99;
                        const priorityB = defB ? shiftTimePriority[defB.time] : 99;
                        if (priorityA !== priorityB) {
                            return priorityA - priorityB;
                        }
                        return a.code.localeCompare(b.code);
                    });

                    let dailyRequiredSlots = [...requiredSlots];
                    let availableStaff = staffList.filter(s => !staffAssignments[s.id]?.[dateStr]);
                    availableStaff.sort(() => Math.random() - 0.5);

                    for (const staffMember of availableStaff) {
                        const assignedSlotIndex = dailyRequiredSlots.findIndex(slot =>
                            isShiftAllowed(slot.code, staffMember, shiftDefinitions)
                        );

                        if (assignedSlotIndex !== -1) {
                            const [assignedShift] = dailyRequiredSlots.splice(assignedSlotIndex, 1);
                            if (!staffAssignments[staffMember.id]) {
                                staffAssignments[staffMember.id] = {};
                            }
                            staffAssignments[staffMember.id][dateStr] = assignedShift.code;

                            const shiftDef = getShiftDefinitionByCode(assignedShift.code);
                            if (shiftDef?.time === ShiftTime.Night && day < daysInMonth) {
                                const nextDate = new Date(year, month - 1, day + 1);
                                const nextDateStr = formatDate(nextDate);
                                if (!staffAssignments[staffMember.id]?.[nextDateStr]) {
                                    staffAssignments[staffMember.id][nextDateStr] = 'S';
                                }
                            }
                        }
                    }

                    dailyRequiredSlots.forEach((uncoveredSlot) => {
                        log.push(`❌ Personale insufficiente per ${uncoveredSlot.code} il ${dateStr}.`);
                        newSchedule.push({
                            id: `uncovered-${dateStr}-${uncoveredSlot.code}-${uncoveredSlot.originalIndex}`,
                            date: dateStr,
                            staffId: UNASSIGNED_STAFF_ID,
                            shiftCode: uncoveredSlot.code,
                        });
                    });
                }

                Object.entries(staffAssignments).forEach(([staffId, assignments]) => {
                    Object.entries(assignments).forEach(([date, shiftCode]) => {
                        newSchedule.push({ id: `${staffId}-${date}`, staffId, date, shiftCode });
                    });
                });

                staffList.forEach(staff => {
                    for (let day = 1; day <= daysInMonth; day++) {
                        const date = new Date(year, month - 1, day);
                        const dateStr = formatDate(date);
                        if (!staffAssignments[staff.id]?.[dateStr]) {
                            newSchedule.push({ id: `${staff.id}-${dateStr}`, staffId: staff.id, date: dateStr, shiftCode: 'R' });
                        }
                    }
                });

                const assignedCount = newSchedule.filter(s => s.staffId !== UNASSIGNED_STAFF_ID).length;
                log.push(`✅ Generazione completata. ${assignedCount} turni assegnati.`);
                setGenerationLog(log);
                const affectedIds = [...staffList.map(s => s.id), UNASSIGNED_STAFF_ID];
                onGenerateSchedule(newSchedule, targetDate, affectedIds);

            } catch (error) {
                console.error("Errore durante la generazione dei turni:", error);
                const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
                setGenerationLog(prev => [...prev, `❌ ERRORE CRITICO: ${errorMessage}`]);
            } finally {
                setIsGenerating(false);
                setIsConfirming(false); // Reset to initial state
            }
        }, 500);
    }, [
        activeTab,
        targetDate,
        requirements,
        staffList,
        scheduledShifts,
        getShiftDefinitionByCode,
        onGenerateSchedule,
        shiftDefinitions,
    ]);

    const selectedPresetIsDefault = useMemo(() => {
        const selected = presets.find(p => p.id === selectedPresetId);
        return selected ? selected.id.startsWith('preset-') : true;
    }, [selectedPresetId, presets]);


    return (
        <div className="space-y-8">
            {isAddShiftModalOpen && (
                <AddShiftModal
                    isOpen={isAddShiftModalOpen}
                    onClose={() => setIsAddShiftModalOpen(false)}
                    onAddShift={handleAddShift}
                    existingShiftCodes={shiftDefinitions.map(s => s.code)}
                />
            )}
            {editingShift && (
                <EditShiftModal
                    isOpen={!!editingShift}
                    shift={editingShift}
                    onClose={() => setEditingShift(null)}
                    onSave={handleSaveShift}
                    onDelete={handleDeleteShift}
                    isDefaultShift={initialShiftCodes.has(editingShift.code)}
                />
            )}

            <h2 className="text-3xl font-bold text-gray-800 border-b pb-4">Pianificazione Automatica Turni ({tabTitleMap[activeTab]})</h2>

            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-bold text-gray-700 mb-4">1. Definizione Fabbisogno Settimanale</h3>
                 <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b">
                    <div className="flex items-center gap-2">
                        <label htmlFor="preset-select" className="font-medium text-gray-700 whitespace-nowrap">Carica Template:</label>
                        <select 
                            id="preset-select"
                            value={selectedPresetId}
                            onChange={e => handlePresetChange(e.target.value)}
                            onDoubleClick={handleRenamePreset}
                            title="Seleziona un template o fai doppio click per rinominarlo"
                            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            aria-label="Seleziona un template di fabbisogno"
                        >
                            {presets.map(preset => (
                                <option key={preset.id} value={preset.id}>{preset.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {!isSavingPreset ? (
                            <button onClick={() => {setIsSavingPreset(true); setIsConfirmingDelete(false);}} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500">Salva Come Nuovo...</button>
                        ) : (
                            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                <input
                                    type="text"
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                    placeholder="Nome del template..."
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    aria-label="Nome del nuovo template"
                                    autoFocus
                                />
                                <button onClick={handleConfirmSavePreset} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700">Salva</button>
                                <button onClick={() => { setIsSavingPreset(false); setNewPresetName(''); }} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annulla</button>
                            </div>
                        )}
                        
                        {!isConfirmingDelete ? (
                            <button 
                                onClick={handleDeletePreset} 
                                disabled={isSavingPreset || selectedPresetIsDefault} 
                                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                            >
                                Elimina
                            </button>
                        ) : (
                             <div className="flex items-center gap-2 p-1 bg-red-50 border border-red-200 rounded-md">
                                <button onClick={confirmDeletePreset} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700">
                                    Conferma
                                </button>
                                <button onClick={cancelDeletePreset} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                    Annulla
                                </button>
                            </div>
                        )}

                        <button onClick={handleResetRequirements} disabled={isSavingPreset} title="Azzera tutti i valori della tabella" className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-200 disabled:text-gray-500">Azzera Tabella</button>
                    </div>
                </div>
                 <div className="overflow-x-auto max-h-[50vh]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20">Turno</th>
                                {weekDays.map(day => <th key={day} className="w-20 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{day}</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {relevantShifts.map(shift => (
                                <tr key={shift.code} className="border-t border-gray-200 first:border-t-0">
                                    <td className="px-2 py-1 whitespace-nowrap text-sm sticky left-0 bg-white group" title={shift.description}>
                                        <button 
                                            onClick={() => handleEditShiftClick(shift)}
                                            className="text-left w-full h-full flex items-center justify-between hover:bg-gray-100 p-2 -m-2 rounded-md transition-colors"
                                            aria-label={`Gestisci turno ${shift.code}`}
                                        >
                                            <span className="font-medium text-gray-900">{shift.code.replace('_doc','')}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </td>
                                    {weekDays.map((_, dayIndex) => (
                                        <td key={dayIndex} className="px-2 py-1">
                                            <input type="number" min="0" value={requirements[shift.code]?.[dayIndex] ?? 0}
                                                   onChange={(e) => handleRequirementChange(shift.code, dayIndex, parseInt(e.target.value, 10) || 0)}
                                                   className="w-16 p-1 text-center border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                   aria-label={`Fabbisogno per ${shift.code} di ${weekDays[dayIndex]}`} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
                 <div className="mt-4 pt-4 border-t">
                    <button 
                        onClick={() => setIsAddShiftModalOpen(true)}
                        className="flex items-center px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M9 17h6m-6-4h6m-6-4h6M3 7h18M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                        </svg>
                        Aggiungi Nuovo Turno
                    </button>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-bold text-gray-700 mb-4">2. Genera Calendario</h3>
                 <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex items-center space-x-4">
                        <label htmlFor="month-picker" className="font-medium text-gray-700">Mese:</label>
                        <input type="month" id="month-picker" value={targetDate} onChange={e => { setTargetDate(e.target.value); setIsConfirming(false); }}
                                className="p-2 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>

                    <div className="flex items-center space-x-3">
                        {!isConfirming ? (
                            <button onClick={() => setIsConfirming(true)} disabled={isGenerating}
                                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center">
                                Genera Turni
                            </button>
                        ) : (
                            <>
                                <button onClick={handleGenerate} disabled={isGenerating}
                                        className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center">
                                    {isGenerating && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>}
                                    {isGenerating ? 'Generazione...' : 'Conferma Sovrascrittura'}
                                </button>
                                <button onClick={() => setIsConfirming(false)} disabled={isGenerating}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                                    Annulla
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {(isGenerating || generationLog.length > 0) && (
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">Log di Generazione:</h4>
                        <pre className="bg-gray-900 text-white text-sm font-mono p-4 rounded-lg shadow-inner max-h-60 overflow-y-auto">
                            {generationLog.join('\n')}
                            {isGenerating && <span className="animate-pulse">...</span>}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};
