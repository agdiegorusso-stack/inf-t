// FIX: Import `useCallback` from `react` to resolve 'Cannot find name' error.
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Staff, ScheduledShift, ShiftDefinition, ShiftRequirements, RequirementPreset } from '../types';
import { UNASSIGNED_STAFF_ID, SHIFT_DEFINITIONS } from '../constants';
import { Location, ShiftTime, ContractType, StaffRole } from '../types';
import { isShiftAllowed } from '../utils/shiftUtils';
import { REQUIREMENT_PRESETS } from '../constants/plannerPresets';
import type { ActiveTab } from '../App';

type TeamName = 'Team Misto' | 'Team Sant\'Eugenio' | 'Team Santa Caterina' | 'Team CTO';
type Teams = Record<TeamName, string[]>;

interface ShiftPlannerProps {
    staffList: Staff[]; // This will be pre-filtered by App.tsx based on the active tab
    activeTab: ActiveTab;
    onGenerateSchedule: (newShifts: ScheduledShift[], targetMonth: string, affectedStaffIds: string[]) => void;
    getShiftDefinitionByCode: (code: string) => ShiftDefinition | undefined;
    scheduledShifts: ScheduledShift[];
}

const initialTeams: Teams = {
    'Team Misto': [],
    'Team Sant\'Eugenio': [],
    'Team Santa Caterina': [],
    'Team CTO': [],
};

const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const tabTitleMap: Record<ActiveTab, string> = {
    nurses: 'Infermieri e Caposala',
    oss: 'OSS',
    doctors: 'Medici'
};

// Helper to format date to YYYY-MM-DD without timezone issues
const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const ShiftPlanner: React.FC<ShiftPlannerProps> = ({ staffList, activeTab, onGenerateSchedule, getShiftDefinitionByCode, scheduledShifts }) => {
    
    const [teams, setTeams] = useState<Teams>(initialTeams);
    const [selectedTeam, setSelectedTeam] = useState<TeamName>('Team Misto');
    const [requirements, setRequirements] = useState<ShiftRequirements>({});
    const [presets, setPresets] = useState<RequirementPreset[]>([]);
    const [selectedPresetId, setSelectedPresetId] = useState<string>('');
    const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 7));
    const [generationLog, setGenerationLog] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const relevantShifts = useMemo(() => {
        return SHIFT_DEFINITIONS.filter(s => {
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
    }, [activeTab]);

    const handlePresetChange = useCallback((presetId: string) => {
        setSelectedPresetId(presetId);
        const selected = presets.find(p => p.id === presetId);
        if (selected) {
            setRequirements(JSON.parse(JSON.stringify(selected.requirements)));
        }
    }, [presets]);
    
    // Effect to update planner context when the active tab changes
    useEffect(() => {
        const relevantPresets = REQUIREMENT_PRESETS.filter(p => p.role === activeTab || p.role === 'all');
        setPresets(relevantPresets);

        // Prefer loading the first non-empty preset for the role.
        const firstMeaningfulPreset = relevantPresets.find(p => p.id !== 'preset-empty');
        const presetToLoad = firstMeaningfulPreset || relevantPresets[0]; // Fallback to the very first one (e.g., 'preset-empty')

        if (presetToLoad) {
            setSelectedPresetId(presetToLoad.id);
            // Deep copy requirements to avoid mutation
            setRequirements(JSON.parse(JSON.stringify(presetToLoad.requirements)));
        } else {
             // This should not happen with current data, but it's a safe fallback.
             setSelectedPresetId('');
             setRequirements({});
        }
    }, [activeTab]);


    const handleTeamChange = (staffId: string, team: TeamName) => {
        setTeams(prev => {
            const newTeams = { ...prev };
            Object.keys(newTeams).forEach(key => {
                newTeams[key as TeamName] = newTeams[key as TeamName].filter(id => id !== staffId);
            });
            newTeams[team].push(staffId);
            return newTeams;
        });
    };

    const handleRequirementChange = (code: string, dayIndex: number, value: number) => {
        setRequirements(prev => ({
            ...prev,
            [code]: (prev[code] || Array(7).fill(0)).map((v, i) => i === dayIndex ? Math.max(0, value) : v)
        }));
    };

    const handleSaveAsPreset = () => {
        const roleName = tabTitleMap[activeTab];
        const name = window.prompt(`Inserisci il nome per il nuovo template (${roleName}):`);
        if (!name || name.trim() === "") return;

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
        setPresets(prev => [...prev, newPreset]);
        setSelectedPresetId(newPreset.id);
        alert(`Template "${name.trim()}" salvato con successo.`);
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
        setPresets(prev => prev.map(p => p.id === selectedPresetId ? { ...p, name: finalNewName } : p));
    };

    const handleDeletePreset = () => {
        const selectedPreset = presets.find(p => p.id === selectedPresetId);
        if (!selectedPreset || selectedPreset.id.startsWith('preset-')) {
            alert("I template di default non possono essere eliminati.");
            return;
        }
        if (window.confirm(`Sei sicuro di voler eliminare il template "${selectedPreset.name}"?`)) {
            const newPresets = presets.filter(p => p.id !== selectedPresetId);
            setPresets(newPresets);

            // After deleting, select the first available preset from the updated list.
            const presetToLoad = newPresets.find(p => p.id !== 'preset-empty') || newPresets[0];
            
            if (presetToLoad) {
                setSelectedPresetId(presetToLoad.id);
                setRequirements(JSON.parse(JSON.stringify(presetToLoad.requirements)));
            } else {
                const emptyPreset = REQUIREMENT_PRESETS.find(p => p.id === 'preset-empty');
                if (emptyPreset) {
                    setSelectedPresetId(emptyPreset.id);
                    setRequirements(JSON.parse(JSON.stringify(emptyPreset.requirements)));
                }
            }
        }
    };

    const handleResetRequirements = () => {
        const emptyPreset = REQUIREMENT_PRESETS.find(p => p.id === 'preset-empty');
        if(emptyPreset) handlePresetChange(emptyPreset.id);
    };
    
    const handleGenerate = () => {
        setIsGenerating(true);
        setGenerationLog([]);

        setTimeout(() => {
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

                // 1. Costruisce una lista prioritaria di tutti gli slot richiesti per il giorno
                const requiredSlots: { code: string, originalIndex: number }[] = [];
                Object.entries(requirements).forEach(([shiftCode, needs]) => {
                    const neededCount = needs[dayOfWeek] || 0;
                    for (let i = 0; i < neededCount; i++) {
                        requiredSlots.push({code: shiftCode, originalIndex: i});
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
                    return a.code.localeCompare(b.code); // Ordinamento stabile per stessa priorità
                });
                
                let dailyRequiredSlots = [...requiredSlots];

                // 2. Ottiene il personale disponibile per questo giorno
                let availableStaff = staffList.filter(s => !staffAssignments[s.id]?.[dateStr]);

                if (dailyRequiredSlots.length > availableStaff.length) {
                    log.push(`⚠️ Fabbisogno per ${dateStr} (${dailyRequiredSlots.length}) supera il personale disponibile (${availableStaff.length}). Saranno generati turni scoperti.`);
                }
                
                // 3. Mescola il personale per variare le assegnazioni
                availableStaff.sort(() => Math.random() - 0.5);
                
                // 4. Assegna i turni iterando sul personale
                for (const staffMember of availableStaff) {
                    // Trova lo slot a più alta priorità che questo membro può coprire
                    const assignedSlotIndex = dailyRequiredSlots.findIndex(slot => 
                        isShiftAllowed(slot.code, staffMember.contract, staffMember.role)
                    );

                    if (assignedSlotIndex !== -1) {
                        // Assegna il turno rimuovendolo dalla lista dei richiesti
                        const [assignedShift] = dailyRequiredSlots.splice(assignedSlotIndex, 1);
                        
                        if (!staffAssignments[staffMember.id]) {
                            staffAssignments[staffMember.id] = {};
                        }
                        staffAssignments[staffMember.id][dateStr] = assignedShift.code;

                        // Gestisce lo smonto notte per il giorno successivo
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

                // 5. Gli slot rimanenti sono scoperti
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

            // --- FINALIZZAZIONE ---
            // Popola il calendario finale con i turni assegnati
            Object.entries(staffAssignments).forEach(([staffId, assignments]) => {
                Object.entries(assignments).forEach(([date, shiftCode]) => {
                    newSchedule.push({ id: `${staffId}-${date}`, staffId, date, shiftCode });
                });
            });
            
            // Assegna 'R' (Riposo) a chi non ha ricevuto turni in un dato giorno
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
            log.push(`ℹ️ Generazione completata. ${assignedCount} turni assegnati.`);
            setGenerationLog(log);
            const affectedIds = [...staffList.map(s => s.id), UNASSIGNED_STAFF_ID];
            onGenerateSchedule(newSchedule, targetDate, affectedIds);
            setIsGenerating(false);
        }, 500);
    };


    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 border-b pb-4">Pianificazione Automatica Turni ({tabTitleMap[activeTab]})</h2>

            {activeTab === 'nurses' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-700 mb-4">1. Gestione dei Team Infermieristici</h3>
                    <div className="flex space-x-2 mb-4 border-b">
                        {Object.keys(teams).map(teamName => (
                            <button key={teamName} onClick={() => setSelectedTeam(teamName as TeamName)}
                                className={`px-4 py-2 text-sm font-semibold rounded-t-md ${selectedTeam === teamName ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                {teamName}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-60 overflow-y-auto pr-2">
                        {staffList.map(staff => (
                            <div key={staff.id} className="flex items-center p-2 bg-gray-50 rounded-md">
                                <input type="checkbox" id={`staff-${staff.id}`} checked={teams[selectedTeam].includes(staff.id)}
                                    onChange={() => handleTeamChange(staff.id, selectedTeam)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                <label htmlFor={`staff-${staff.id}`} className="ml-3 text-sm font-medium text-gray-800">{staff.name}</label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-bold text-gray-700 mb-4">{activeTab === 'nurses' ? '2.' : '1.'} Definizione Fabbisogno Settimanale</h3>
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
                        <button onClick={handleSaveAsPreset} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500">Salva Come Nuovo...</button>
                        <button onClick={handleDeletePreset} className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400">Elimina</button>
                        <button onClick={handleResetRequirements} title="Azzera tutti i valori della tabella" className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400">Azzera Tabella</button>
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
                        <tbody className="bg-white divide-y divide-gray-200">
                            {relevantShifts.map(shift => (
                                <tr key={shift.code}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white" title={shift.description}>{shift.code.replace('_doc','')}</td>
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
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-bold text-gray-700 mb-4">{activeTab === 'nurses' ? '3.' : '2.'} Genera Calendario</h3>
                 <div className="flex items-center space-x-4">
                     <label htmlFor="month-picker" className="font-medium text-gray-700">Mese:</label>
                     <input type="month" id="month-picker" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                            className="p-2 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                    <button onClick={handleGenerate} disabled={isGenerating}
                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center">
                        {isGenerating && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>}
                        {isGenerating ? 'Generazione...' : 'Genera Turni'}
                    </button>
                 </div>

                 {generationLog.length > 0 && (
                     <div className="mt-6 p-4 bg-gray-900 text-white rounded-lg font-mono text-sm max-h-60 overflow-y-auto">
                        <h4 className="font-bold mb-2">Report di Generazione:</h4>
                        <ul>
                          {generationLog.map((line, index) => {
                              const color = line.startsWith('❌') ? 'text-red-400' : line.startsWith('⚠️') ? 'text-yellow-400' : line.startsWith('💡') ? 'text-cyan-400' : 'text-gray-300';
                              const iconMatch = line.match(/^[❌⚠️💡ℹ️✅]/u);
                              const icon = iconMatch ? iconMatch[0] : '✅';
                              const message = iconMatch ? line.substring(icon.length).trim() : line;
                              return <li key={index} className={`${color}`}><span className="mr-2">{icon}</span>{message}</li>
                          })}
                        </ul>
                     </div>
                 )}
            </div>
        </div>
    );
};