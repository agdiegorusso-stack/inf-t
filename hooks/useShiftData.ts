import { useState, useCallback, useMemo, useEffect } from 'react';
import { STAFF_LIST, SHIFT_DEFINITIONS as INITIAL_SHIFT_DEFINITIONS, UNASSIGNED_STAFF_ID, TEAMS_LIST } from '../constants';
import type { Staff, ScheduledShift, Absence, ShiftDefinition, ReplacementOption, Team, Location } from '../types';
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

    const allShiftDefinitions = [...INITIAL_SHIFT_DEFINITIONS]; 

    STAFF_LIST.forEach(staff => {
        if (staff.id === UNASSIGNED_STAFF_ID) return;

        const allowedWorkingShifts = allShiftDefinitions
            .filter(def => 
                def.time !== ShiftTime.Absence && 
                def.time !== ShiftTime.Rest && 
                def.time !== ShiftTime.OffShift &&
                isShiftAllowed(def.code, staff, allShiftDefinitions, TEAMS_LIST)
            )
            .map(def => def.code);

        let previousShiftCode: string | null = null; // Track previous day's shift

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = formatDate(date);
            
            let shiftCode: string | null = null;

            // --- CORRECTED LOGIC ---
            // H24 staff rotation: Night -> Post-night -> Rest
            if (staff.contract === ContractEnum.H24) {
                if (previousShiftCode === 'N') {
                    shiftCode = 'S';
                } else if (previousShiftCode === 'S') {
                    shiftCode = 'R';
                }
            }

            // H6 & H12 staff have rest on Sundays
            if (staff.contract === ContractEnum.H6 || staff.contract === ContractEnum.H12) {
                if (date.getDay() === 0) { // Sunday
                    shiftCode = 'RS';
                }
            }
            
            // If no specific rule assigned a shift, assign a random working shift
            if (shiftCode === null) {
                if (allowedWorkingShifts.length > 0) {
                     shiftCode = allowedWorkingShifts[Math.floor(Math.random() * allowedWorkingShifts.length)];
                } else {
                     // Fallback if no working shifts are possible (e.g., wrong team setup)
                     shiftCode = 'R';
                }
            }

            // Add some random days off (Ferie) to make it more realistic, but don't override mandatory rests
             if (Math.random() < 0.05 && shiftCode !== 'S' && shiftCode !== 'R') {
                 shiftCode = 'FE';
             }
            // --- END CORRECTED LOGIC ---

            schedule.push({
                id: `${staff.id}-${dateStr}`,
                staffId: staff.id,
                date: dateStr,
                shiftCode: shiftCode,
            });

            previousShiftCode = shiftCode; // Update for the next day's logic
        }
    });
    
    return schedule;
};


export const useShiftData = () => {
    const [staff, setStaff] = useState<Staff[]>(() => {
        const storedStaff = localStorage.getItem('staffListStorage');
        if (storedStaff) {
            try {
                const parsed = JSON.parse(storedStaff);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (e) {
                console.error("Found corrupted staff list in localStorage, starting with default.", e);
                return STAFF_LIST;
            }
        }
        // If storage is empty, this is the first run. Initialize it.
        localStorage.setItem('staffListStorage', JSON.stringify(STAFF_LIST));
        return STAFF_LIST;
    });

    const [teams, setTeams] = useState<Team[]>(() => {
        const storedTeams = localStorage.getItem('teamsListStorage');
        if (storedTeams) {
            try {
                const parsed = JSON.parse(storedTeams);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (e) {
                console.error("Found corrupted teams list in localStorage, starting with default.", e);
                return TEAMS_LIST;
            }
        }
        // First run
        localStorage.setItem('teamsListStorage', JSON.stringify(TEAMS_LIST));
        return TEAMS_LIST;
    });

    const [scheduledShifts, setScheduledShifts] = useState<ScheduledShift[]>(() => {
        try {
            const storedShifts = localStorage.getItem('scheduledShiftsStorage');
            if (storedShifts && storedShifts !== 'undefined') {
                const parsed = JSON.parse(storedShifts);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error("Failed to load/parse scheduled shifts from localStorage", e);
        }
        return generateInitialSchedule();
    });

    const [absences, setAbsences] = useState<Absence[]>(() => {
        try {
            const storedAbsences = localStorage.getItem('absencesStorage');
            if (storedAbsences && storedAbsences !== 'undefined') {
                const parsed = JSON.parse(storedAbsences);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error("Failed to load/parse absences from localStorage", e);
        }
        return [];
    });

    const [shiftDefinitions, setShiftDefinitions] = useState<ShiftDefinition[]>(() => {
        try {
            const userShiftsData = localStorage.getItem('userShiftDefinitions');
            const deletedCodesData = localStorage.getItem('deletedShiftCodes');

            const userShifts = userShiftsData ? JSON.parse(userShiftsData) : [];
            const deletedCodes = deletedCodesData ? JSON.parse(deletedCodesData) : [];
            
            const baseShifts = INITIAL_SHIFT_DEFINITIONS.filter(s => !deletedCodes.includes(s.code));

            const combinedShifts = [...baseShifts, ...userShifts];

            const uniqueShifts = Array.from(new Map(combinedShifts.map(s => [s.code, s])).values());
            return uniqueShifts;
        } catch (e) {
            console.error("Failed to load shift definitions from localStorage", e);
            return INITIAL_SHIFT_DEFINITIONS;
        }
    });
    
    useEffect(() => {
        try {
            localStorage.setItem('scheduledShiftsStorage', JSON.stringify(scheduledShifts));
        } catch (e) {
            console.error("Failed to save scheduled shifts to localStorage", e);
        }
    }, [scheduledShifts]);

    useEffect(() => {
        try {
            localStorage.setItem('absencesStorage', JSON.stringify(absences));
        } catch (e) {
            console.error("Failed to save absences to localStorage", e);
        }
    }, [absences]);


    const shiftDefMap = useMemo(() => new Map(shiftDefinitions.map(def => [def.code, def])), [shiftDefinitions]);
    const staffMap = useMemo(() => new Map(staff.map(s => [s.id, s])), [staff]);
    const teamsMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams]);

    const getStaffById = useCallback((id: string) => staffMap.get(id), [staffMap]);
    const getShiftDefinitionByCode = useCallback((code: string) => shiftDefMap.get(code), [shiftDefMap]);
    const getTeamById = useCallback((id: string) => teamsMap.get(id), [teamsMap]);

    const getStaffAllowedLocations = useCallback((staffMember: Staff): Location[] => {
        if (!staffMember?.teamIds) return [];
        const locationsSet = new Set<Location>();
        staffMember.teamIds.forEach(teamId => {
            const team = getTeamById(teamId);
            if (team) {
                team.locations.forEach(loc => locationsSet.add(loc));
            }
        });
        return Array.from(locationsSet);
    }, [getTeamById]);

    const addTeam = useCallback((newTeam: Team) => {
        setTeams(prev => {
            const updated = [...prev, newTeam];
            localStorage.setItem('teamsListStorage', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const updateTeam = useCallback((teamId: string, updates: Partial<Omit<Team, 'id'>>) => {
        setTeams(prev => {
            const updated = prev.map(t => t.id === teamId ? { ...t, ...updates } : t);
            localStorage.setItem('teamsListStorage', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const deleteTeam = useCallback((teamId: string) => {
        setStaff(prevStaff => {
            const updatedStaff = prevStaff.map(s => ({
                ...s,
                teamIds: s.teamIds ? s.teamIds.filter(id => id !== teamId) : []
            }));
            localStorage.setItem('staffListStorage', JSON.stringify(updatedStaff));
            return updatedStaff;
        });
        
        setTeams(prev => {
            const updated = prev.filter(t => t.id !== teamId);
            localStorage.setItem('teamsListStorage', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const addShiftDefinition = useCallback((newShift: ShiftDefinition) => {
        setShiftDefinitions(prev => {
            const updated = [...prev, newShift];
            
            const initialShiftMap = new Map(INITIAL_SHIFT_DEFINITIONS.map(is => [is.code, is]));
            const userShifts = updated.filter(s => {
                const initialShift = initialShiftMap.get(s.code);
                if (!initialShift) return true;
                return JSON.stringify(s) !== JSON.stringify(initialShift);
            });

            try {
                localStorage.setItem('userShiftDefinitions', JSON.stringify(userShifts));

                const deletedCodesData = localStorage.getItem('deletedShiftCodes');
                if (deletedCodesData) {
                    let deletedCodes = JSON.parse(deletedCodesData);
                    if (deletedCodes.includes(newShift.code)) {
                        deletedCodes = deletedCodes.filter((c: string) => c !== newShift.code);
                        localStorage.setItem('deletedShiftCodes', JSON.stringify(deletedCodes));
                    }
                }
            } catch (e) {
                console.error("Failed to save new shift definition to localStorage", e);
            }
            return updated;
        });
    }, []);

    const deleteShiftDefinition = useCallback((code: string) => {
        if (scheduledShifts.some(s => s.shiftCode?.split('/').includes(code))) {
            alert("Impossibile eliminare il turno perché è attualmente assegnato nel calendario. Rimuovere tutte le assegnazioni prima di procedere.");
            return;
        }

        setShiftDefinitions(prev => {
            const isInitialShift = INITIAL_SHIFT_DEFINITIONS.some(s => s.code === code);
            const updated = prev.filter(s => s.code !== code);
            
            try {
                if (isInitialShift) {
                    const deletedCodesData = localStorage.getItem('deletedShiftCodes');
                    const deletedCodes = deletedCodesData ? JSON.parse(deletedCodesData) : [];
                    if (!deletedCodes.includes(code)) {
                        const newDeletedCodes = [...deletedCodes, code];
                        localStorage.setItem('deletedShiftCodes', JSON.stringify(newDeletedCodes));
                    }
                }

                const userShiftsData = localStorage.getItem('userShiftDefinitions');
                if (userShiftsData) {
                    const userShifts = JSON.parse(userShiftsData);
                    const updatedUserShifts = userShifts.filter((s: ShiftDefinition) => s.code !== code);
                    localStorage.setItem('userShiftDefinitions', JSON.stringify(updatedUserShifts));
                }
            } catch (e) {
                console.error("Failed to update localStorage after shift deletion", e);
            }
            
            return updated;
        });
    }, [scheduledShifts]);

    const updateShiftDefinition = useCallback((originalCode: string, updatedShift: ShiftDefinition) => {
        setShiftDefinitions(prev => {
            const updated = prev.map(s => s.code === originalCode ? updatedShift : s);
            
            const initialShiftMap = new Map(INITIAL_SHIFT_DEFINITIONS.map(is => [is.code, is]));
            const userShifts = updated.filter(s => {
                const initialShift = initialShiftMap.get(s.code);
                if (!initialShift) {
                    return true;
                }
                return JSON.stringify(s) !== JSON.stringify(initialShift);
            });

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
                    const originalShiftCode = originalShift.shiftCode;
                    const originalShiftDef = originalShiftCode ? getShiftDefinitionByCode(originalShiftCode) : null;
                    
                    if (originalShiftDef && originalShiftDef.time !== ShiftTime.Absence && originalShiftDef.time !== ShiftTime.Rest) {
                        const uncoveredShift: ScheduledShift = {
                            id: `uncovered-${originalShift.id}`,
                            date: originalShift.date,
                            staffId: UNASSIGNED_STAFF_ID,
                            shiftCode: originalShiftCode,
                            originalStaffId: originalShift.staffId,
                        };
                        updatedShifts.push(uncoveredShift);
                    }
                    
                    updatedShifts[shiftIndex] = { ...originalShift, shiftCode: reason };

                } else {
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
        const originalRole = originalStaff?.role ?? RoleEnum.Nurse;

        const replacements = staff
            .filter(s => {
                if (s.id === uncoveredShift.originalStaffId || s.id === UNASSIGNED_STAFF_ID) {
                    return false;
                }

                switch (originalRole) {
                    case RoleEnum.Nurse:
                        if (s.role !== RoleEnum.Nurse && s.role !== RoleEnum.HeadNurse) return false;
                        break;
                    case RoleEnum.HeadNurse:
                        if (uncoveredShift.shiftCode !== 'M') {
                            if (s.role !== RoleEnum.HeadNurse && s.role !== RoleEnum.Nurse) return false;
                        } else {
                            if (s.role !== RoleEnum.HeadNurse) return false;
                        }
                        break;
                    case RoleEnum.OSS:
                        if (s.role !== RoleEnum.OSS) return false;
                        break;
                    case RoleEnum.Doctor:
                        if (s.role !== RoleEnum.Doctor) return false;
                        break;
                    default:
                        return false;
                }

                const staffShiftOnDate = scheduledShifts.find(shift => shift.staffId === s.id && shift.date === uncoveredShift.date);
                const staffShiftDef = staffShiftOnDate?.shiftCode ? getShiftDefinitionByCode(staffShiftOnDate.shiftCode) : null;
                if (staffShiftDef && (staffShiftDef.time === ShiftTime.Absence || staffShiftDef.time === ShiftTime.Rest)) {
                    return false;
                }

                return true;
            })
            .map(s => {
                const staffShiftOnDate = scheduledShifts.find(shift => shift.staffId === s.id && shift.date === uncoveredShift.date);
                const staffShiftDef = staffShiftOnDate?.shiftCode ? getShiftDefinitionByCode(staffShiftOnDate.shiftCode) : null;

                let priority = 0;
                let reason = "Libero/a da turni";
                
                const canDoLongShift = s.contract === ContractEnum.H12 || s.contract === ContractEnum.H24;

                if (canDoLongShift && staffShiftDef && staffShiftDef.time === ShiftTime.Morning && uncoveredShiftDef.time === ShiftTime.Afternoon) {
                    priority = 2;
                    reason = "Può estendere il turno di mattina";
                } else if (canDoLongShift && staffShiftDef && staffShiftDef.time === ShiftTime.Afternoon && uncoveredShiftDef.time === ShiftTime.Morning) {
                    priority = 1;
                    reason = "Può anticipare il turno di pomeriggio";
                } else if (!staffShiftDef) {
                    priority = 0;
                } else {
                    return null; 
                }

                const staffAllowedLocations = getStaffAllowedLocations(s);
                if (staffAllowedLocations.includes(uncoveredShiftDef.location)) {
                    reason += " (Esperto/a)";
                    priority += 0.5;
                }
                
                if (s.role === originalRole) {
                    priority += 0.1;
                }

                return { staff: s, reason, priority };
            })
            .filter((option): option is (ReplacementOption & { priority: number }) => option !== null)
            .sort((a, b) => b.priority - a.priority);

        return replacements;
    }, [staff, scheduledShifts, getShiftDefinitionByCode, getStaffById, getStaffAllowedLocations]);
    
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
                const existingShift = shifts[existingShiftIndex];
                const existingShiftDef = existingShift.shiftCode ? getShiftDefinitionByCode(existingShift.shiftCode) : null;
    
                if (existingShiftDef && (newStaff.contract === ContractEnum.H12 || newStaff.contract === ContractEnum.H24)) {
                    if (existingShiftDef.time === ShiftTime.Morning && unassignedShiftDef.time === ShiftTime.Afternoon) {
                        existingShift.shiftCode = `${existingShift.shiftCode}/${unassignedShift.shiftCode}`;
                        shifts.splice(unassignedShiftIndex, 1);
                        return shifts;
                    }
                    if (existingShiftDef.time === ShiftTime.Afternoon && unassignedShiftDef.time === ShiftTime.Morning) {
                        existingShift.shiftCode = `${unassignedShift.shiftCode}/${existingShift.shiftCode}`;
                        shifts.splice(unassignedShiftIndex, 1);
                        return shifts;
                    }
                }
                
                alert(`${newStaff.name} è già impegnato/a in un turno non compatibile e non può coprire questo turno.`);
                return prev;
            } else {
                shifts.splice(unassignedShiftIndex, 1);
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

            const shiftIndex = updatedShifts.findIndex(s => s.staffId === staffId && s.date === date);

            const originalShift = shiftIndex !== -1 ? updatedShifts[shiftIndex] : null;
            const originalShiftCode = originalShift?.shiftCode || null;
            const originalShiftDef = originalShiftCode ? getShiftDefinitionByCode(originalShiftCode) : null;
            
            const newShiftDef = newShiftCode ? getShiftDefinitionByCode(newShiftCode) : null;

            const wasWorking = originalShiftDef && originalShiftDef.time !== ShiftTime.Absence && originalShiftDef.time !== ShiftTime.Rest;
            const isNowAbsence = newShiftDef && newShiftDef.time === ShiftTime.Absence;
            const wasAbsence = originalShiftDef && originalShiftDef.time === ShiftTime.Absence;
            const isNowWorking = newShiftDef && newShiftDef.time !== ShiftTime.Absence && newShiftDef.time !== ShiftTime.Rest;

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
            
            if (wasWorking && isNowAbsence) {
                const uncoveredShift: ScheduledShift = {
                    id: `uncovered-${originalShift!.id}`,
                    date: originalShift!.date,
                    staffId: UNASSIGNED_STAFF_ID,
                    shiftCode: originalShiftCode,
                    originalStaffId: originalShift!.staffId,
                };
                updatedShifts.push(uncoveredShift);
            }

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
        const affectedStaffIdsSet = new Set(affectedStaffIds);

        setScheduledShifts(prevShifts => {
            const remainingShifts = prevShifts.filter(shift => {
                const isAffectedStaff = affectedStaffIdsSet.has(shift.staffId);
                const isInTargetMonth = shift.date.startsWith(targetMonth);
                
                return !(isAffectedStaff && isInTargetMonth);
            });

            const updatedSchedule = [...remainingShifts, ...newShifts];
            
            return updatedSchedule;
        });
    }, []);

    const importSchedule = useCallback((newShifts: ScheduledShift[]) => {
        if (newShifts.length === 0) {
            return;
        }

        const affectedMonths = new Set(newShifts.map(s => s.date.substring(0, 7)));
        const affectedStaffIds = new Set(newShifts.map(s => s.staffId));

        setScheduledShifts(prevShifts => {
            const remainingShifts = prevShifts.filter(shift => {
                const month = shift.date.substring(0, 7);
                const isAffected = affectedMonths.has(month) && affectedStaffIds.has(shift.staffId);
                return !isAffected;
            });
            return [...remainingShifts, ...newShifts];
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

    const changePassword = useCallback((staffId: string, oldPassword: string, newPassword: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            setStaff(currentStaff => {
                const userIndex = currentStaff.findIndex(s => s.id === staffId);
                if (userIndex === -1) {
                    reject(new Error("Utente non trovato."));
                    return currentStaff;
                }
    
                const user = currentStaff[userIndex];
                if (user.password !== oldPassword) {
                    reject(new Error("La vecchia password non è corretta."));
                    return currentStaff;
                }
    
                const updatedStaff = [...currentStaff];
                updatedStaff[userIndex] = { ...user, password: newPassword };
    
                try {
                    localStorage.setItem('staffListStorage', JSON.stringify(updatedStaff));
                    resolve();
                    return updatedStaff;
                } catch (e) {
                    console.error("Failed to save updated staff list to localStorage", e);
                    reject(new Error("Impossibile salvare la nuova password."));
                    return currentStaff;
                }
            });
        });
    }, []);

    return { 
        staff, 
        teams,
        scheduledShifts, 
        shiftDefinitions,
        addAbsence, 
        findReplacements, 
        assignShift, 
        getStaffById, 
        getShiftDefinitionByCode,
        updateShift,
        overwriteSchedule,
        importSchedule,
        updateStaffMember,
        addShiftDefinition,
        deleteShiftDefinition,
        updateShiftDefinition,
        changePassword,
        addTeam,
        updateTeam,
        deleteTeam,
        getStaffAllowedLocations,
    };
};