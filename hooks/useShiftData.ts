
import { useState, useCallback, useMemo } from 'react';
import { STAFF_LIST, SHIFT_DEFINITIONS as INITIAL_SHIFT_DEFINITIONS, UNASSIGNED_STAFF_ID } from '../constants';
import type { Staff, ScheduledShift, Absence, ShiftDefinition, ReplacementOption, ContractType, StaffRole } from '../types';
import { ShiftTime, ContractType as ContractEnum, StaffRole as RoleEnum } from '../types';
import { isShiftAllowed } from '../utils/shiftUtils';

// Helper to format date to YYYY-MM-DD
const formatDate = (date: Date): string => date.toISOString().split('T')[0];

// Mock initial schedule data
const generateInitialSchedule = (): ScheduledShift[] => {
    const schedule: ScheduledShift[] = [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const restShifts = ['RS', 'S', 'R'];

    const allShiftDefinitions = [...INITIAL_SHIFT_DEFINITIONS]; // In this initial generation, we only use the base shifts

    STAFF_LIST.forEach(staff => {
        // Don't generate shifts for the unassigned placeholder
        if (staff.id === UNASSIGNED_STAFF_ID) return;

        // Get a list of working shifts that are ALLOWED for this specific staff member
        const allowedWorkingShifts = allShiftDefinitions
            .filter(def => 
                def.time !== ShiftTime.Absence && 
                def.time !== ShiftTime.Rest && 
                def.time !== ShiftTime.OffShift &&
                isShiftAllowed(def.code, staff, allShiftDefinitions)
            )
            .map(def => def.code);

        let restCounter = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = formatDate(date);
            
            let shiftCode: string | null = null;
            if (restCounter > 0) {
                shiftCode = restShifts[restCounter-1] || 'RS';
                restCounter--;
            } else if (date.getDay() === 0 || date.getDay() === 6) { // Weekend
                shiftCode = 'RS';
            } else if (allowedWorkingShifts.length > 0) {
                 // Pick a random shift from the allowed list
                 shiftCode = allowedWorkingShifts[Math.floor(Math.random() * allowedWorkingShifts.length)];
            } else {
                 // Fallback to rest if no working shifts are possible for this role
                 shiftCode = 'R';
            }
             if (Math.random() < 0.05) { // 5% chance of being on holiday
                 shiftCode = 'FE';
             }

            schedule.push({
                id: `${staff.id}-${dateStr}`,
                staffId: staff.id,
                date: dateStr,
                shiftCode: shiftCode,
            });
        }
    });
    
    return schedule;
};


export const useShiftData = () => {
    const [staff, setStaff] = useState<Staff[]>(() => {
        try {
            const storedStaff = localStorage.getItem('staffListStorage');
            if (storedStaff) {
                return JSON.parse(storedStaff);
            }
        } catch (e) {
            console.error("Failed to load staff list from localStorage", e);
        }
        // Fallback to initial list and save it
        localStorage.setItem('staffListStorage', JSON.stringify(STAFF_LIST));
        return STAFF_LIST;
    });
    const [scheduledShifts, setScheduledShifts] = useState<ScheduledShift[]>(generateInitialSchedule());
    const [absences, setAbsences] = useState<Absence[]>([]);

    const [shiftDefinitions, setShiftDefinitions] = useState<ShiftDefinition[]>(() => {
        try {
            const userShiftsData = localStorage.getItem('userShiftDefinitions');
            const userShifts = userShiftsData ? JSON.parse(userShiftsData) : [];
            const combinedShifts = [...INITIAL_SHIFT_DEFINITIONS, ...userShifts];
            // Remove duplicates by code, user-defined shifts override initial ones
            const uniqueShifts = Array.from(new Map(combinedShifts.map(s => [s.code, s])).values());
            return uniqueShifts;
        } catch (e) {
            console.error("Failed to load shift definitions from localStorage", e);
            return INITIAL_SHIFT_DEFINITIONS;
        }
    });

    const shiftDefMap = useMemo(() => {
        return new Map(shiftDefinitions.map(def => [def.code, def]));
    }, [shiftDefinitions]);

    const staffMap = useMemo(() => {
        return new Map(staff.map(s => [s.id, s]));
    }, [staff]);

    const getStaffById = useCallback((id: string) => staffMap.get(id), [staffMap]);
    const getShiftDefinitionByCode = useCallback((code: string) => shiftDefMap.get(code), [shiftDefMap]);

    const addShiftDefinition = useCallback((newShift: ShiftDefinition) => {
        setShiftDefinitions(prev => {
            const updated = [...prev, newShift];
            // Update localStorage with user-defined shifts only
            const userShifts = updated.filter(s => !INITIAL_SHIFT_DEFINITIONS.some(is => is.code === s.code));
            try {
                localStorage.setItem('userShiftDefinitions', JSON.stringify(userShifts));
            } catch (e) {
                console.error("Failed to save new shift definition to localStorage", e);
            }
            return updated;
        });
    }, []);

    const deleteShiftDefinition = useCallback((code: string) => {
        // Check if it's a default shift
        if (INITIAL_SHIFT_DEFINITIONS.some(s => s.code === code)) {
            alert("I turni di default non possono essere eliminati.");
            return;
        }

        // Check if the shift is currently in use (including combined shifts)
        if (scheduledShifts.some(s => s.shiftCode?.split('/').includes(code))) {
            alert("Impossibile eliminare il turno perché è attualmente assegnato nel calendario. Rimuovere tutte le assegnazioni prima di procedere.");
            return;
        }

        setShiftDefinitions(prev => {
            const updated = prev.filter(s => s.code !== code);
            
            // Update localStorage with user-defined shifts only
            const userShifts = updated.filter(s => !INITIAL_SHIFT_DEFINITIONS.some(is => is.code === s.code));
            try {
                localStorage.setItem('userShiftDefinitions', JSON.stringify(userShifts));
            } catch (e) {
                console.error("Failed to update shift definitions in localStorage after deletion", e);
            }
            return updated;
        });
    }, [scheduledShifts]);

    const updateShiftDefinition = useCallback((originalCode: string, updatedShift: ShiftDefinition) => {
        // This check is a safeguard. UI should prevent this.
        if (INITIAL_SHIFT_DEFINITIONS.some(s => s.code === originalCode)) {
            alert("I turni di default non possono essere modificati.");
            return;
        }
    
        // Code cannot be changed, so we can find by originalCode and replace.
        setShiftDefinitions(prev => {
            const updated = prev.map(s => s.code === originalCode ? updatedShift : s);
            
            // Persist only user-defined shifts to localStorage.
            const userShifts = updated.filter(s => !INITIAL_SHIFT_DEFINITIONS.some(is => is.code === s.code));
            try {
                localStorage.setItem('userShiftDefinitions', JSON.stringify(userShifts));
            } catch (e) {
                console.error("Failed to update shift definitions in localStorage", e);
            }
            return updated;
        });
    }, []);


    const addAbsence = useCallback((staffId: string, reason: string, startDate: Date, endDate: Date) => {
        setAbsences(prev => [...prev, {
            id: `abs-${Date.now()}`,
            staffId,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            reason,
        }]);

        setScheduledShifts(prevShifts => {
            let updatedShifts = [...prevShifts];
            let currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                const dateStr = formatDate(currentDate);
                const shiftIndex = updatedShifts.findIndex(s => s.staffId === staffId && s.date === dateStr);

                if (shiftIndex !== -1) {
                    const originalShift = updatedShifts[shiftIndex];
                    const originalShiftCode = originalShift.shiftCode; // Capture code before any changes
                    const originalShiftDef = originalShiftCode ? getShiftDefinitionByCode(originalShiftCode) : null;
                    
                    // If the original shift was a working shift, create an uncovered shift
                    if (originalShiftDef && originalShiftDef.time !== ShiftTime.Absence && originalShiftDef.time !== ShiftTime.Rest) {
                        const uncoveredShift: ScheduledShift = {
                            id: `uncovered-${originalShift.id}`,
                            date: originalShift.date,
                            staffId: UNASSIGNED_STAFF_ID,
                            shiftCode: originalShiftCode, // Use the captured original code
                            originalStaffId: originalShift.staffId,
                        };
                        updatedShifts.push(uncoveredShift);
                    }
                    
                    // Update the staff member's shift to the absence code
                    updatedShifts[shiftIndex] = { ...originalShift, shiftCode: reason };

                } else {
                    // If no shift existed, just add the absence
                     updatedShifts.push({
                        id: `${staffId}-${dateStr}`,
                        staffId,
                        date: dateStr,
                        shiftCode: reason
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return updatedShifts;
        });
    }, [getShiftDefinitionByCode]);

    const findReplacements = useCallback((uncoveredShift: ScheduledShift): ReplacementOption[] => {
        const uncoveredShiftDef = getShiftDefinitionByCode(uncoveredShift.shiftCode!);
        if (!uncoveredShiftDef) return [];

        const originalStaff = uncoveredShift.originalStaffId ? getStaffById(uncoveredShift.originalStaffId) : undefined;
        // If we can't determine the original staff member's role, we can't find replacements.
        // This could happen for a manually created uncovered shift, so we default to Nurse.
        const originalRole = originalStaff?.role ?? RoleEnum.Nurse;

        const replacements = staff
            .filter(s => {
                // Exclude the person who is absent and the unassigned placeholder
                if (s.id === uncoveredShift.originalStaffId || s.id === UNASSIGNED_STAFF_ID) {
                    return false;
                }

                // New role-based substitution rules
                switch (originalRole) {
                    case RoleEnum.Nurse:
                        // A Nurse can be replaced by another Nurse or a Head Nurse
                        if (s.role !== RoleEnum.Nurse && s.role !== RoleEnum.HeadNurse) return false;
                        break;
                    case RoleEnum.HeadNurse:
                        // If the shift is not 'M', a Nurse can also substitute.
                        if (uncoveredShift.shiftCode !== 'M') {
                            // Can be replaced by another Head Nurse or a Nurse
                            if (s.role !== RoleEnum.HeadNurse && s.role !== RoleEnum.Nurse) return false;
                        } else {
                            // If the shift is 'M', only another Head Nurse can substitute.
                            if (s.role !== RoleEnum.HeadNurse) return false;
                        }
                        break;
                    case RoleEnum.OSS:
                         // An OSS can only be replaced by another OSS
                        if (s.role !== RoleEnum.OSS) return false;
                        break;
                    case RoleEnum.Doctor:
                         // A Doctor can only be replaced by another Doctor
                        if (s.role !== RoleEnum.Doctor) return false;
                        break;
                    default:
                        // Deny any other combination
                        return false;
                }

                // Existing check: Exclude staff who are on leave, rest, or sick
                const staffShiftOnDate = scheduledShifts.find(shift => shift.staffId === s.id && shift.date === uncoveredShift.date);
                const staffShiftDef = staffShiftOnDate?.shiftCode ? getShiftDefinitionByCode(staffShiftOnDate.shiftCode) : null;
                if (staffShiftDef && (staffShiftDef.time === ShiftTime.Absence || staffShiftDef.time === ShiftTime.Rest)) {
                    return false;
                }

                return true; // Staff is eligible
            })
            .map(s => {
                const staffShiftOnDate = scheduledShifts.find(shift => shift.staffId === s.id && shift.date === uncoveredShift.date);
                const staffShiftDef = staffShiftOnDate?.shiftCode ? getShiftDefinitionByCode(staffShiftOnDate.shiftCode) : null;

                let priority = 0;
                let reason = "Libero/a da turni";
                
                const canDoLongShift = s.contract === ContractEnum.H12 || s.contract === ContractEnum.H24;

                if (canDoLongShift && staffShiftDef && staffShiftDef.time === ShiftTime.Morning && uncoveredShiftDef.time === ShiftTime.Afternoon) {
                    priority = 2; // Highest priority
                    reason = "Può estendere il turno di mattina";
                } else if (canDoLongShift && staffShiftDef && staffShiftDef.time === ShiftTime.Afternoon && uncoveredShiftDef.time === ShiftTime.Morning) {
                    priority = 1; // High priority
                    reason = "Può anticipare il turno di pomeriggio";
                } else if (!staffShiftDef) {
                    priority = 0; // Standard priority
                } else {
                    // Staff is working another shift that day that cannot be combined
                    return null; 
                }

                // Bonus for department experience
                if (s.usualLocations.includes(uncoveredShiftDef.location)) {
                    reason += " (Esperto/a)";
                    priority += 0.5;
                }
                
                // Small bonus for same-role replacement to act as a tie-breaker
                if (s.role === originalRole) {
                    priority += 0.1;
                }

                return { staff: s, reason, priority };
            })
            .filter((option): option is (ReplacementOption & { priority: number }) => option !== null)
            .sort((a, b) => b.priority - a.priority);

        return replacements;
    }, [staff, scheduledShifts, getShiftDefinitionByCode, getStaffById]);
    
    const assignShift = useCallback((shiftId: string, newStaffId: string) => {
        setScheduledShifts(prev => {
            const shifts = [...prev];
            const unassignedShiftIndex = shifts.findIndex(s => s.id === shiftId);
            if (unassignedShiftIndex === -1) return prev;
    
            const unassignedShift = shifts[unassignedShiftIndex];
            const newStaff = staffMap.get(newStaffId);
            const unassignedShiftDef = unassignedShift.shiftCode ? getShiftDefinitionByCode(unassignedShift.shiftCode) : null;
            
            if (!newStaff || !unassignedShiftDef) return prev;
    
            const existingShiftIndex = shifts.findIndex(s => s.staffId === newStaffId && s.date === unassignedShift.date);
    
            if (existingShiftIndex !== -1) {
                // Staff has a shift, try to combine
                const existingShift = shifts[existingShiftIndex];
                const existingShiftDef = existingShift.shiftCode ? getShiftDefinitionByCode(existingShift.shiftCode) : null;
    
                if (existingShiftDef && (newStaff.contract === ContractEnum.H12 || newStaff.contract === ContractEnum.H24)) {
                    if (existingShiftDef.time === ShiftTime.Morning && unassignedShiftDef.time === ShiftTime.Afternoon) {
                        existingShift.shiftCode = `${existingShift.shiftCode}/${unassignedShift.shiftCode}`;
                        shifts.splice(unassignedShiftIndex, 1); // remove unassigned
                        return shifts;
                    }
                    if (existingShiftDef.time === ShiftTime.Afternoon && unassignedShiftDef.time === ShiftTime.Morning) {
                        existingShift.shiftCode = `${unassignedShift.shiftCode}/${existingShift.shiftCode}`;
                        shifts.splice(unassignedShiftIndex, 1); // remove unassigned
                        return shifts;
                    }
                }
                
                // Cannot combine
                alert(`${newStaff.name} è già impegnato/a in un turno non compatibile e non può coprire questo turno.`);
                return prev;
            } else {
                // Staff has no shift, just assign it
                // Remove unassigned shift
                shifts.splice(unassignedShiftIndex, 1);
                // Add new shift
                shifts.push({
                    ...unassignedShift,
                    staffId: newStaffId,
                    originalStaffId: undefined,
                    id: `${newStaffId}-${unassignedShift.date}`
                });
                return shifts;
            }
        });
    }, [getShiftDefinitionByCode, staffMap]);

    const updateShift = useCallback((staffId: string, date: string, newShiftCode: string | null) => {
        setScheduledShifts(prevShifts => {
            let updatedShifts = [...prevShifts];

            // Special logic for the "Turni Scoperti" row - no changes needed here
            if (staffId === UNASSIGNED_STAFF_ID) {
                const newShiftDef = newShiftCode ? getShiftDefinitionByCode(newShiftCode) : null;
                const isWorkShift = newShiftDef && newShiftDef.time !== ShiftTime.Absence && newShiftDef.time !== ShiftTime.Rest;
                const shiftIndex = updatedShifts.findIndex(s => s.staffId === staffId && s.date === date);

                if (shiftIndex === -1) return prevShifts;

                if (newShiftCode && isWorkShift) {
                    updatedShifts[shiftIndex] = { ...updatedShifts[shiftIndex], shiftCode: newShiftCode };
                } else {
                    updatedShifts.splice(shiftIndex, 1);
                }
                return updatedShifts;
            }

            // Logic for regular staff members
            const shiftIndex = updatedShifts.findIndex(s => s.staffId === staffId && s.date === date);

            // Get original shift info BEFORE any modifications
            const originalShift = shiftIndex !== -1 ? updatedShifts[shiftIndex] : null;
            const originalShiftCode = originalShift?.shiftCode || null;
            const originalShiftDef = originalShiftCode ? getShiftDefinitionByCode(originalShiftCode) : null;
            
            // Get new shift info
            const newShiftDef = newShiftCode ? getShiftDefinitionByCode(newShiftCode) : null;

            // Determine shift types
            const wasWorking = originalShiftDef && originalShiftDef.time !== ShiftTime.Absence && originalShiftDef.time !== ShiftTime.Rest;
            const isNowAbsence = newShiftDef && newShiftDef.time === ShiftTime.Absence;
            const wasAbsence = originalShiftDef && originalShiftDef.time === ShiftTime.Absence;
            const isNowWorking = newShiftDef && newShiftDef.time !== ShiftTime.Absence && newShiftDef.time !== ShiftTime.Rest;

            // First, update the staff member's actual shift record
            if (shiftIndex !== -1) {
                if (newShiftCode) {
                    updatedShifts[shiftIndex] = { ...updatedShifts[shiftIndex], shiftCode: newShiftCode };
                } else {
                    updatedShifts.splice(shiftIndex, 1);
                }
            } else if (newShiftCode) {
                updatedShifts.push({
                    id: `${staffId}-${date}`,
                    staffId,
                    date,
                    shiftCode: newShiftCode
                });
            }

            // Now, handle the creation or resolution of a corresponding "uncovered" shift
            
            // Case 1: An employee on a working shift is marked as absent.
            // This should create a new "uncovered" shift.
            if (wasWorking && isNowAbsence) {
                const uncoveredShift: ScheduledShift = {
                    id: `uncovered-${originalShift!.id}`, // Use original shift ID for uniqueness
                    date: originalShift!.date,
                    staffId: UNASSIGNED_STAFF_ID,
                    shiftCode: originalShiftCode, // Use the original shift code that was captured before the update
                    originalStaffId: originalShift!.staffId,
                };
                updatedShifts.push(uncoveredShift);
            }

            // Case 2: An employee who was absent is now assigned a working shift.
            // This should resolve (delete) a previously created "uncovered" shift for them on that day.
            if (wasAbsence && isNowWorking) {
                const uncoveredShiftIndex = updatedShifts.findIndex(s => 
                    s.staffId === UNASSIGNED_STAFF_ID &&
                    s.date === date &&
                    s.originalStaffId === staffId
                );

                if (uncoveredShiftIndex !== -1) {
                    updatedShifts.splice(uncoveredShiftIndex, 1);
                }
            }
            
            return updatedShifts;
        });
    }, [getShiftDefinitionByCode]);

    const overwriteSchedule = useCallback((newShifts: ScheduledShift[], targetMonth: string, affectedStaffIds: string[]) => {
        // targetMonth è nel formato "YYYY-MM"
        const affectedStaffIdsSet = new Set(affectedStaffIds);

        setScheduledShifts(prevShifts => {
            // 1. Rimuovi i vecchi turni per il personale interessato e il mese target.
            // Questo include sia il personale regolare che UNASSIGNED_STAFF_ID per i turni scoperti.
            const remainingShifts = prevShifts.filter(shift => {
                const isAffectedStaff = affectedStaffIdsSet.has(shift.staffId);
                const isInTargetMonth = shift.date.startsWith(targetMonth);
                
                // Mantieni il turno se NON è per un membro dello staff interessato NEL mese target.
                return !(isAffectedStaff && isInTargetMonth);
            });

            // 2. Combina i turni rimanenti con i nuovi turni generati.
            const updatedSchedule = [...remainingShifts, ...newShifts];
            
            return updatedSchedule;
        });
    }, []);

    const updateStaffMember = useCallback((staffId: string, updates: Partial<Omit<Staff, 'id' | 'name'>>) => {
        setStaff(prevStaff => {
            const updatedStaff = prevStaff.map(s =>
                s.id === staffId ? { ...s, ...updates } : s
            );
            try {
                localStorage.setItem('staffListStorage', JSON.stringify(updatedStaff));
            } catch (e) {
                 console.error("Failed to save updated staff list to localStorage", e);
            }
            return updatedStaff;
        });
    }, []);

    const changePassword = useCallback(async (staffId: string, oldPassword: string, newPassword: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            setStaff(prevStaff => {
                const userIndex = prevStaff.findIndex(s => s.id === staffId);
                if (userIndex === -1) {
                    reject(new Error("Utente non trovato."));
                    return prevStaff;
                }
    
                const user = prevStaff[userIndex];
                if (user.password !== oldPassword) {
                    reject(new Error("La vecchia password non è corretta."));
                    return prevStaff;
                }
    
                const updatedUser = { ...user, password: newPassword };
                const updatedStaff = [...prevStaff];
                updatedStaff[userIndex] = updatedUser;
    
                try {
                    localStorage.setItem('staffListStorage', JSON.stringify(updatedStaff));
                    resolve();
                    return updatedStaff;
                } catch (e) {
                    console.error("Failed to save updated staff list to localStorage", e);
                    reject(new Error("Impossibile salvare la nuova password."));
                    return prevStaff;
                }
            });
        });
    }, []);

    return { 
        staff, 
        scheduledShifts, 
        shiftDefinitions,
        addAbsence, 
        findReplacements, 
        assignShift, 
        getStaffById, 
        getShiftDefinitionByCode,
        updateShift,
        overwriteSchedule,
        updateStaffMember,
        addShiftDefinition,
        deleteShiftDefinition,
        updateShiftDefinition,
        changePassword,
    };
};
