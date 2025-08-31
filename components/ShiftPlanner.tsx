// FIX: Import `useCallback` from `react` to resolve 'Cannot find name' error.
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Staff, ScheduledShift, ShiftDefinition, ShiftRequirements, RequirementPreset, ShiftRequirementValue, Team } from '../types';
import { UNASSIGNED_STAFF_ID } from '../constants';
import { Location, ShiftTime, ContractType, StaffRole } from '../types';
import { isShiftAllowed } from '../utils/shiftUtils';
import { REQUIREMENT_PRESETS } from '../constants/plannerPresets';
import type { ActiveTab } from '../App';
import { AddShiftModal } from './AddShiftModal';
import { EditShiftModal } from './EditShiftModal';

// Declare XLSX for TypeScript since it's loaded from a script tag
declare var XLSX: any;

interface ShiftPlannerProps {
    staffList: Staff[]; // This will be pre-filtered by App.tsx based on the active tab
    activeTab: ActiveTab;
    onGenerateSchedule: (newShifts: ScheduledShift[], targetMonth: string, affectedStaffIds: string[]) => void;
    onImportSchedule: (newShifts: ScheduledShift[]) => void;
    getShiftDefinitionByCode: (code: string) => ShiftDefinition | undefined;
    scheduledShifts: ScheduledShift[];
    shiftDefinitions: ShiftDefinition[];
    teams: Team[];
    onAddShift: (newShift: ShiftDefinition) => void;
    deleteShiftDefinition: (code: string) => void;
    updateShiftDefinition: (originalCode: string, updatedShift: ShiftDefinition) => void;
}

type RuleType = 'specific_days' | 'all_days' | 'specific_date';
const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const tabTitleMap: Record<ActiveTab, string> = {
    nurses: 'Infermieri e Caposala',
    oss: 'OSS',
    doctors: 'Medici',
};
const requirementLabelMap: Record<ActiveTab, string> = {
    nurses: 'Infermieri necessari',
    oss: 'OSS necessari',
    doctors: 'Medici necessari',
};

// Helper to format date to YYYY-MM-DD without timezone issues
const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Helper to format requirement value for display
const formatRequirement = (req: ShiftRequirementValue | undefined): string => {
    if (req === undefined || req === null) return '0';
    if (typeof req === 'number') return req.toString();
    if (req.min === req.max) return req.min.toString();
    // Wrap with parentheses for clarity as requested
    return `(${req.min}-${req.max})`;
};

// Helper to parse requirement value from input string
const parseRequirement = (value: string): ShiftRequirementValue => {
    const trimmed = value.trim().replace(/[()]/g, ''); // Remove parentheses before parsing
    if (trimmed.includes('-')) {
        const parts = trimmed.split('-').map(p => parseInt(p.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            let [min, max] = [Math.max(0, parts[0]), Math.max(0, parts[1])];
            if (min > max) { // Swap if min is greater than max
                [min, max] = [max, min];
            }
            if (min === max) return min;
            return { min, max };
        }
    }
    const num = parseInt(trimmed, 10);
    return isNaN(num) ? 0 : Math.max(0, num);
};


export const ShiftPlanner: React.FC<ShiftPlannerProps> = ({ staffList, activeTab, onGenerateSchedule, onImportSchedule, getShiftDefinitionByCode, scheduledShifts, shiftDefinitions, teams, onAddShift, deleteShiftDefinition, updateShiftDefinition }) => {
    
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
    const fileInputRef = useRef<HTMLInputElement>(null);


    const [dateOverrides, setDateOverrides] = useState<Record<string, Record<string, ShiftRequirementValue>>>(() => {
        try {
            const stored = localStorage.getItem(`dateOverrides_${activeTab}`);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error("Failed to load date overrides from localStorage", e);
        }
        return {};
    });

    useEffect(() => {
        try {
            localStorage.setItem(`dateOverrides_${activeTab}`, JSON.stringify(dateOverrides));
        } catch (e) {
            console.error("Failed to save date overrides to localStorage", e);
        }
    }, [dateOverrides, activeTab]);
    
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

         try {
            const storedOverrides = localStorage.getItem(`dateOverrides_${activeTab}`);
            setDateOverrides(storedOverrides ? JSON.parse(storedOverrides) : {});
        } catch (e) {
            console.error("Failed to load date overrides for new tab", e);
            setDateOverrides({});
        }
    }, [activeTab]);


    const handleRequirementChange = (code: string, dayIndex: number, value: string) => {
        const parsedValue = parseRequirement(value);
        setRequirements(prev => {
            const newReqs = { ...prev };
            const currentReqs = [...(newReqs[code] || Array(7).fill(0))];
            currentReqs[dayIndex] = parsedValue;
            newReqs[code] = currentReqs;
            return newReqs;
        });
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
    
    const handleApplyShiftRule = useCallback((shiftCode: string, days: number[], count: { min: number; max: number }) => {
        setRequirements(prevReqs => {
            const newReqs = { ...prevReqs };
            const currentShiftReqs = [...(newReqs[shiftCode] || Array(7).fill(0))];
            
            const valueToSet: ShiftRequirementValue = count.min === count.max
                ? count.min
                : { min: count.min, max: count.max };
    
            days.forEach(dayIndex => {
                currentShiftReqs[dayIndex] = valueToSet;
            });
            
            newReqs[shiftCode] = currentShiftReqs;
            return newReqs;
        });
    }, []);

    const handleApplyDateOverride = useCallback((shiftCode: string, dates: string[], count: ShiftRequirementValue | null) => {
        setDateOverrides(prev => {
            const newOverrides = JSON.parse(JSON.stringify(prev)); // Deep copy
            if (!newOverrides[shiftCode]) {
                newOverrides[shiftCode] = {};
            }
            dates.forEach(date => {
                 const isZero = typeof count === 'number' && count === 0;
                 const isZeroRange = typeof count === 'object' && count !== null && count.min === 0 && count.max === 0;
                
                if (count === null || isZero || isZeroRange) {
                    delete newOverrides[shiftCode][date];
                } else {
                    newOverrides[shiftCode][date] = count;
                }
            });
            if (Object.keys(newOverrides[shiftCode]).length === 0) {
                delete newOverrides[shiftCode];
            }
            return newOverrides;
        });
    }, []);


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
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const [currentYear] = targetDate.split('-').map(Number);
        const log: string[] = [];

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                const normalizeName = (name: string) =>
                    name.trim().toLowerCase()
                        .replace(/['.]/g, '') // Rimuove apostrofi e punti
                        .replace(/\s+/g, ' '); // Normalizza gli spazi

                const staffNameCache = staffList.map(s => ({
                    id: s.id,
                    normalized: normalizeName(s.name),
                }));

                const findStaffByFlexibleName = (excelName: string): Staff | undefined => {
                    if (!excelName || typeof excelName !== 'string') return undefined;

                    // Pulisce il nome dall'Excel, rimuovendo annotazioni comuni
                    const cleanedExcelName = excelName.replace(/\(.*\)|\bdialisi-cto\b/g, '').trim();
                    const normalizedExcelName = normalizeName(cleanedExcelName);

                    if (normalizedExcelName.length < 3) return undefined;

                    // 1. Prova una corrispondenza esatta sul nome normalizzato
                    let found = staffNameCache.find(staffData => staffData.normalized === normalizedExcelName);
                    if (found) return staffList.find(s => s.id === found.id);

                    // 2. Se fallisce, prova una corrispondenza più permissiva (es. il nome nel DB è contenuto nel nome in Excel)
                    // Questo aiuta con nomi che hanno suffissi o dettagli aggiuntivi nel file.
                    found = staffNameCache.find(staffData => normalizedExcelName.includes(staffData.normalized));
                    if (found) return staffList.find(s => s.id === found.id);
                    
                    return undefined;
                };


                const monthMap: { [key: string]: number } = {
                    gennaio: 0, febbraio: 1, marzo: 2, aprile: 3, maggio: 4, giugno: 5,
                    luglio: 6, agosto: 7, settembre: 8, ottobre: 9, novembre: 10, dicembre: 11
                };
                const monthNames = Object.keys(monthMap);
                const monthRegex = new RegExp(`(${monthNames.join('|')})`, 'i');
                const yearRegex = /(\d{4})/;

                let parsedShifts: ScheduledShift[] = [];
                let importedMonths: string[] = [];

                workbook.SheetNames.forEach((sheetName: string) => {
                    const trimmedSheetName = sheetName.trim().toLowerCase();
                    const monthMatch = trimmedSheetName.match(monthRegex);
                    if (!monthMatch) return;

                    const monthName = monthMatch[1].toLowerCase();
                    const month = monthMap[monthName];
                    const yearMatch = trimmedSheetName.match(yearRegex);
                    const year = yearMatch ? parseInt(yearMatch[0], 10) : currentYear;
                    
                    if (!importedMonths.includes(sheetName)) {
                        importedMonths.push(sheetName);
                    }

                    const worksheet = workbook.Sheets[sheetName];
                    const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
                    if (json.length < 2) return;
                    
                    let lastProcessedRow = -1;

                    for (let rowIndex = 0; rowIndex < json.length; rowIndex++) {
                        if (rowIndex <= lastProcessedRow) continue;
                        
                        const row = json[rowIndex];
                        if (!Array.isArray(row) || row.every(cell => cell === null)) continue;
                        
                        const dayColumnMap: Map<number, number> = new Map();
                        let numericCells = 0;
                        row.forEach((cell, cellIndex) => {
                            const day = parseInt(String(cell), 10);
                            if (!isNaN(day) && day >= 1 && day <= 31) {
                                dayColumnMap.set(day, cellIndex);
                                numericCells++;
                            }
                        });

                        if (numericCells < 7) continue; // A week's worth of days is a good heuristic

                        let personnelColIndex = -1;
                        let bestColumn = { index: -1, score: 0 };
                        const sampleRows = json.slice(rowIndex + 1, rowIndex + 15);
                        const numCols = Math.max(...json.map(r => r ? r.length : 0));

                        for (let j = 0; j < numCols; j++) {
                            if (Array.from(dayColumnMap.values()).includes(j)) continue;

                            let matchCount = 0;
                            let validSamples = 0;
                            for (const sampleRow of sampleRows) {
                                const cellValue = sampleRow?.[j];
                                if (cellValue && typeof cellValue === 'string' && cellValue.trim().length > 3) {
                                    validSamples++;
                                    if (findStaffByFlexibleName(cellValue)) {
                                        matchCount++;
                                    }
                                }
                            }
                            const score = validSamples > 0 ? matchCount / validSamples : 0;
                            if (score > bestColumn.score) {
                                bestColumn = { index: j, score };
                            }
                        }
                        
                        if (bestColumn.score < 0.5) continue;
                        personnelColIndex = bestColumn.index;

                        log.push(`Trovata tabella in "${sheetName}" alla riga ${rowIndex + 1}. Colonna personale: ${personnelColIndex}.`);
                        
                        let dataRowIndex = rowIndex + 1;
                        let consecutiveEmptyRows = 0;
                        while (dataRowIndex < json.length) {
                            const dataRow = json[dataRowIndex];
                            const staffNameCell = dataRow?.[personnelColIndex];
                        
                            const isEffectivelyEmpty = !staffNameCell || typeof staffNameCell !== 'string' || staffNameCell.trim().length < 3;
                        
                            if (isEffectivelyEmpty) {
                                consecutiveEmptyRows++;
                                const isNewHeader = dataRow && Array.isArray(dataRow) && dataRow.filter(cell => {
                                    const day = parseInt(String(cell), 10);
                                    return !isNaN(day) && day >= 1 && day <= 31;
                                }).length > 7;
                        
                                if (consecutiveEmptyRows > 3 || isNewHeader) {
                                    break;
                                }
                                
                                dataRowIndex++;
                                continue;
                            }
                        
                            consecutiveEmptyRows = 0;
                        
                            const staffMember = findStaffByFlexibleName(staffNameCell);
                        
                            if (staffMember) {
                                dayColumnMap.forEach((colIndex, day) => {
                                    const shiftCode = dataRow[colIndex] ? String(dataRow[colIndex]).trim() : null;
                                    if (shiftCode) {
                                        const daysInTargetMonth = new Date(year, month + 1, 0).getDate();
                                        if (day > 0 && day <= daysInTargetMonth) {
                                            const date = new Date(year, month, day);
                                            const dateStr = formatDate(date);
                                            parsedShifts.push({
                                                id: `${staffMember.id}-${dateStr}`,
                                                staffId: staffMember.id,
                                                date: dateStr,
                                                shiftCode,
                                            });
                                        }
                                    }
                                });
                            } else {
                                if (typeof staffNameCell === 'string' && staffNameCell.trim().length > 3) {
                                    console.warn(`Personale non trovato durante l'importazione: ${staffNameCell}`);
                                }
                            }
                            dataRowIndex++;
                        }
                        lastProcessedRow = dataRowIndex - 1;
                    }
                });

                if (parsedShifts.length > 0) {
                    onImportSchedule(parsedShifts);
                    alert(`Importazione completata con successo da: ${importedMonths.join(', ')}.\nSono stati importati ${parsedShifts.length} turni.`);
                } else {
                     alert("Nessun turno valido trovato nel file. Controlla che:\n- Il nome di un foglio contenga un mese (es. 'Settembre 2025' o 'Settembre').\n- All'interno del foglio ci sia una tabella con una riga di intestazione contenente i numeri dei giorni (1, 2, 3...).\n- Sotto l'intestazione, ci sia una colonna con nomi di personale riconoscibili.");
                }

            } catch (error) {
                console.error("Errore durante l'importazione del file Excel:", error);
                alert("Si è verificato un errore durante la lettura del file. Assicurati che sia un file .xlsx valido.");
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsArrayBuffer(file);
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
                // Pre-fill assignments with existing shifts for the month
                const staffAssignments: Record<string, Record<string, string>> = {};
                let existingShiftsCount = 0;
                const affectedStaffIds = new Set(staffList.map(s => s.id));
                scheduledShifts.forEach(shift => {
                    if (shift.date.startsWith(targetDate) && affectedStaffIds.has(shift.staffId)) {
                        if (!staffAssignments[shift.staffId]) staffAssignments[shift.staffId] = {};
                        staffAssignments[shift.staffId][shift.date] = shift.shiftCode || '';
                        existingShiftsCount++;
                    }
                });
                if (existingShiftsCount > 0) {
                    log.push(`✅ Rispettati ${existingShiftsCount} turni pre-esistenti in questo mese.`);
                }
    
                const firstDayOfMonth = new Date(year, month - 1, 1);
                const lastDayOfPrevMonth = new Date(firstDayOfMonth.getTime() - 86400000);
                const lastDayOfPrevMonthStr = formatDate(lastDayOfPrevMonth);
    
                const h24InitialState: Record<string, string | null> = {};
                staffList.forEach(staff => {
                    const lastMonthShift = scheduledShifts.find(s => s.staffId === staff.id && s.date === lastDayOfPrevMonthStr);
                    h24InitialState[staff.id] = lastMonthShift?.shiftCode || null;
                });
    
                // --- Main Daily Loop ---
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month - 1, day);
                    const dateStr = formatDate(date);
                    const dayOfWeek = date.getDay();
                    const prevDateStr = formatDate(new Date(date.getTime() - 86400000));
    
                    const dailyNeeds: Record<string, { min: number; max: number; assigned: number }> = {};
                    relevantShifts.forEach(shiftDef => {
                        const shiftCode = shiftDef.code;
                        const override = dateOverrides[shiftCode]?.[dateStr];
                        let reqValue = override !== undefined ? override : requirements[shiftCode]?.[dayOfWeek];
                        
                        if (reqValue !== undefined && reqValue !== null) {
                            let min = 0, max = 0;
                            if (typeof reqValue === 'number') { min = max = reqValue; }
                            else if (typeof reqValue === 'object') { min = reqValue.min; max = reqValue.max; }
                            
                            // Count already assigned staff towards the need
                            let alreadyAssigned = 0;
                            staffList.forEach(s => {
                                if (staffAssignments[s.id]?.[dateStr] === shiftCode) {
                                    alreadyAssigned++;
                                }
                            });

                            if (max > 0) {
                                dailyNeeds[shiftCode] = { min, max, assigned: alreadyAssigned };
                            }
                        }
                    });
    
                    let availableStaffIds = new Set(staffList.filter(s => !staffAssignments[s.id]?.[dateStr]).map(s => s.id));

                    const assignShift = (staffId: string, shiftCode: string) => {
                        if (!staffAssignments[staffId]) staffAssignments[staffId] = {};
                        staffAssignments[staffId][dateStr] = shiftCode;
                        availableStaffIds.delete(staffId);
                        const need = dailyNeeds[shiftCode];
                        if (need) {
                            need.assigned++;
                        }
                    };
    
                    // Pass 1: Mandatory assignments for available staff.
                    staffList.forEach(staff => {
                        if (!availableStaffIds.has(staff.id)) return; // Skip if already assigned
    
                        const lastShiftCode = staffAssignments[staff.id]?.[prevDateStr] ?? h24InitialState[staff.id];
    
                        if (lastShiftCode && getShiftDefinitionByCode(lastShiftCode)?.time === ShiftTime.Night) {
                            assignShift(staff.id, 'S'); return;
                        }
                        if (staff.contract === ContractType.H24 && lastShiftCode === 'S') {
                            assignShift(staff.id, 'R'); return;
                        }
                        if (date.getDay() === 0 && (staff.contract === ContractType.H6 || staff.contract === ContractType.H12)) {
                            assignShift(staff.id, 'RS'); return;
                        }
                    });
    
                    const shiftPriorityOrder = Object.keys(dailyNeeds).sort((a,b) => {
                        const timeA = getShiftDefinitionByCode(a)?.time;
                        const timeB = getShiftDefinitionByCode(b)?.time;
                        const prio: Record<string, number> = { [ShiftTime.Night]: 1, [ShiftTime.Afternoon]: 2, [ShiftTime.Morning]: 3, [ShiftTime.FullDay]: 4 };
                        return (prio[timeA!] || 5) - (prio[timeB!] || 5);
                    });
    
                    // Pass 2: Fill MINIMUM requirements with available staff
                    shiftPriorityOrder.forEach(shiftCode => {
                        const need = dailyNeeds[shiftCode];
                        while (need.assigned < need.min) {
                            const candidate = staffList.find(s => 
                                availableStaffIds.has(s.id) && 
                                isShiftAllowed(shiftCode, s, shiftDefinitions, teams)
                            );
    
                            if (candidate) {
                                assignShift(candidate.id, shiftCode);
                            } else {
                                break;
                            }
                        }
                    });
                    
                    // Pass 3: Assign remaining available staff to fill up to MAX requirements
                    const remainingStaff = staffList.filter(s => availableStaffIds.has(s.id)).sort(() => Math.random() - 0.5);
                    remainingStaff.forEach(staff => {
                        const suitableShift = shiftPriorityOrder.find(shiftCode => {
                            const need = dailyNeeds[shiftCode];
                            return need && (need.assigned < need.max) && isShiftAllowed(shiftCode, staff, shiftDefinitions, teams);
                        });
                        
                        if (suitableShift) {
                            assignShift(staff.id, suitableShift);
                        }
                    });

                    // Pass 4: Final check for uncovered shifts.
                    Object.entries(dailyNeeds).forEach(([shiftCode, need]) => {
                        if (need.assigned < need.min) {
                            const deficit = need.min - need.assigned;
                            log.push(`❌ Fabbisogno MINIMO non coperto per ${shiftCode} il ${dateStr}: mancano ${deficit} unità.`);
                            for (let i = 0; i < deficit; i++) {
                                newSchedule.push({ id: `uncovered-${dateStr}-${shiftCode}-${i}`, date: dateStr, staffId: UNASSIGNED_STAFF_ID, shiftCode });
                            }
                        }
                    });
                }
    
                // --- Finalization ---
                Object.entries(staffAssignments).forEach(([staffId, assignments]) => {
                    Object.entries(assignments).forEach(([date, shiftCode]) => {
                        newSchedule.push({ id: `${staffId}-${date}`, staffId, date, shiftCode: shiftCode || null });
                    });
                });
    
                log.push(`✅ Generazione completata.`);
                setGenerationLog(log);
                onGenerateSchedule(newSchedule, targetDate, [...staffList.map(s => s.id), UNASSIGNED_STAFF_ID]);
            
            } catch (error) {
                console.error("Errore durante la generazione dei turni:", error);
                const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
                setGenerationLog(prev => [...prev, `❌ ERRORE CRITICO: ${errorMessage}`]);
            } finally {
                setIsGenerating(false);
                setIsConfirming(false);
            }
        }, 500);
    }, [activeTab, targetDate, requirements, staffList, scheduledShifts, getShiftDefinitionByCode, onGenerateSchedule, shiftDefinitions, teams, dateOverrides, relevantShifts]);


    const selectedPresetIsDefault = useMemo(() => {
        const selected = presets.find(p => p.id === selectedPresetId);
        return selected ? selected.id.startsWith('preset-') : true;
    }, [selectedPresetId, presets]);

    const shiftsWithMonthlyOverrides = useMemo(() => {
        const codes = new Set<string>();
        for (const shiftCode in dateOverrides) {
            const overridesForShift = dateOverrides[shiftCode];
            if (overridesForShift) {
                for (const dateStr in overridesForShift) {
                    if (dateStr.startsWith(targetDate)) {
                        codes.add(shiftCode);
                        break; 
                    }
                }
            }
        }
        return codes;
    }, [dateOverrides, targetDate]);


    return (
        <div className="space-y-8">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileImport}
            />

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
                    onApplyRule={handleApplyShiftRule}
                    targetDate={targetDate}
                    dateOverrides={dateOverrides[editingShift.code] || {}}
                    onApplyDateOverride={handleApplyDateOverride}
                />
            )}

            <h2 className="text-3xl font-bold text-gray-800 border-b pb-4">Pianificazione Automatica Turni ({tabTitleMap[activeTab]})</h2>

            <div className="bg-white p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-700">1. Definizione Fabbisogno Settimanale</h3>
                    <button onClick={handleImportClick} className="flex items-center px-3 py-1.5 text-sm bg-teal-600 text-white rounded-md shadow-sm hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Importa Excel
                    </button>
                 </div>
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
                                <th rowSpan={2} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 align-bottom">Turno</th>
                                <th colSpan={7} className="pt-2 pb-1 text-center text-xm font-medium text-gray-500 uppercase tracking-wider">{requirementLabelMap[activeTab]}</th>
                            </tr>
                            <tr>
                                {weekDays.map(day => <th key={day} className="w-20 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{day}</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {relevantShifts.map(shift => {
                                const hasOverride = shiftsWithMonthlyOverrides.has(shift.code);
                                const cellTitle = hasOverride 
                                    ? `${shift.description} - Contiene eccezioni per giorni singoli in questo mese.` 
                                    : shift.description;
                                
                                return (
                                    <tr key={shift.code} className="border-t border-gray-200 first:border-t-0">
                                        <td className={`px-2 py-1 whitespace-nowrap text-sm sticky left-0 bg-white group ${hasOverride ? 'bg-green-50' : ''}`} title={cellTitle}>
                                            <button 
                                                onClick={() => handleEditShiftClick(shift)}
                                                className={`text-left w-full h-full flex items-center justify-between ${hasOverride ? 'hover:bg-green-100' : 'hover:bg-gray-100'} p-2 -m-2 rounded-md transition-colors`}
                                                aria-label={`Gestisci turno ${shift.code}`}
                                            >
                                                <div className="flex items-center">
                                                    <span className="font-medium text-gray-900">{shift.code.replace('_doc','')}</span>
                                                    {hasOverride && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </td>
                                        {weekDays.map((_, dayIndex) => {
                                            const reqValue = requirements[shift.code]?.[dayIndex];
                                            const isRange = typeof reqValue === 'object' && reqValue !== null;

                                            return (
                                                <td key={dayIndex} className="px-2 py-1">
                                                    {isRange ? (
                                                        <div
                                                            className="w-20 h-[38px] p-1 flex items-center justify-center text-center border border-gray-200 bg-gray-100 text-gray-700 rounded-md shadow-sm"
                                                            title={`Intervallo: ${reqValue.min}-${reqValue.max}. Usa "Gestisci Turno" per modificare.`}
                                                        >
                                                            {formatRequirement(reqValue)}
                                                        </div>
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={typeof reqValue === 'number' ? reqValue : 0}
                                                            onChange={(e) => handleRequirementChange(shift.code, dayIndex, e.target.value)}
                                                            className="w-20 p-1 text-center border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                            aria-label={`Fabbisogno per ${shift.code} di ${weekDays[dayIndex]}`}
                                                        />
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
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
                                    {isGenerating ? 'Generazione...' : 'Conferma e Completa'}
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