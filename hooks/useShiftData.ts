
import { useState, useCallback, useMemo, useEffect } from 'react';
import { UNASSIGNED_STAFF_ID, mockStaff, mockTeams, mockShiftDefinitions } from '../constants';
import type { Staff, ScheduledShift, Absence, ShiftDefinition, ReplacementOption, Team, Location } from '../types';
import { ShiftTime, StaffRole as RoleEnum, StaffRole } from '../types';
import { isShiftAllowed } from '../utils/shiftUtils';

// Helper to format date to YYYY-MM-DD
const formatDate = (date: Date): string => date.toISOString().split('T')[0];

export const useShiftData = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [scheduledShifts, setScheduledShifts] = useState<ScheduledShift[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [shiftDefinitions, setShiftDefinitions] = useState<ShiftDefinition[]>([]);

    useEffect(() => {
        // Simulate loading data from constants
        setStaff(JSON.parse(JSON.stringify(mockStaff)));
        setTeams(JSON.parse(JSON.stringify(mockTeams)));
        setShiftDefinitions(JSON.parse(JSON.stringify(mockShiftDefinitions)));
        setScheduledShifts([]); 
        setAbsences([]);
        // Use a timeout to ensure the loading spinner shows briefly, preventing UI flicker.
        setTimeout(() => setIsLoading(false), 50); 
    }, []);


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
                (team.locations as Location[]).forEach(loc => locationsSet.add(loc));
            }
        });
        return Array.from(locationsSet);
    }, [getTeamById]);
    
    const addTeam = useCallback(async (newTeam: Team) => {
        setTeams(prev => [...prev, newTeam]);
    }, []);

    const updateTeam = useCallback(async (teamId: string, updates: Partial<Omit<Team, 'id'>>) => {
        setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...updates } : t));
    }, []);

    const deleteTeam = useCallback(async (teamId: string) => {
        setTeams(prev => prev.filter(t => t.id !== teamId));
        setStaff(prevStaff => prevStaff.map(s => ({
            ...s,
            teamIds: s.teamIds ? s.teamIds.filter(id => id !== teamId) : []
        })));
    }, []);

    const addShiftDefinition = useCallback(async (newShift: ShiftDefinition) => {
        setShiftDefinitions(prev => [...prev, newShift]);
    }, []);

    const deleteShiftDefinition = useCallback(async (code: string) => {
        if (scheduledShifts.some(s => s.shiftCode?.split('/').includes(code))) {
            alert("Impossibile eliminare il turno perché è attualmente assegnato nel calendario. Rimuovere tutte le assegnazioni prima di procedere.");
            return;
        }
        setShiftDefinitions(prev => prev.filter(s => s.code !== code));
    }, [scheduledShifts]);

    const updateShiftDefinition = useCallback(async (originalCode: string, updatedShift: ShiftDefinition) => {
        setShiftDefinitions(prev => prev.map(s => s.code === originalCode ? updatedShift : s));
        // Also update any scheduled shifts that use the old code
        if (originalCode !== updatedShift.code) {
             setScheduledShifts(prevShifts => prevShifts.map(ss => {
                if (ss.shiftCode === originalCode) {
                    return { ...ss, shiftCode: updatedShift.code };
                }
                return ss;
            }));
        }
    }, []);
    
    const addAbsence = useCallback((staffId: string, reason: string, startDate: Date, endDate: Date) => {
        const newAbsence: Absence = {
            id: `abs-${staffId}-${Date.now()}`,
            staffId,
            reason,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
        };
        setAbsences(prev => [...prev, newAbsence]);

        let newShifts: ScheduledShift[] = [];
        let uncoveredShifts: ScheduledShift[] = [];
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = formatDate(d);
            
            // Find if there was an original shift that needs to be uncovered
            const originalShift = scheduledShifts.find(s => s.staffId === staffId && s.date === dateStr);
            const originalShiftDef = originalShift?.shiftCode ? getShiftDefinitionByCode(originalShift.shiftCode) : null;
            
            if (originalShiftDef && originalShiftDef.time !== ShiftTime.Absence && originalShiftDef.time !== ShiftTime.Rest) {
                 uncoveredShifts.push({
                    id: `uncovered-${staffId}-${dateStr}-${Math.random()}`,
                    date: dateStr,
                    staffId: UNASSIGNED_STAFF_ID,
                    shiftCode: originalShift!.shiftCode,
                    originalStaffId: staffId,
                });
            }

            // Add the new absence shift
            newShifts.push({
                id: `${staffId}-${dateStr}`,
                staffId,
                date: dateStr,
                shiftCode: reason,
            });
        }

        setScheduledShifts(prev => {
            // Filter out old shifts for the user in the date range
            const otherShifts = prev.filter(s => {
                if (s.staffId !== staffId) return true;
                const shiftDate = new Date(s.date);
                return shiftDate < startDate || shiftDate > endDate;
            });
            // Add the new absence shifts and any new uncovered shifts
            return [...otherShifts, ...newShifts, ...uncoveredShifts];
        });

    }, [scheduledShifts, getShiftDefinitionByCode]);

    const findReplacements = useCallback((uncoveredShift: ScheduledShift): ReplacementOption[] => {
        const uncoveredShiftDef = getShiftDefinitionByCode(uncoveredShift.shiftCode!);
        if (!uncoveredShiftDef) return [];

        const originalStaff = uncoveredShift.originalStaffId ? getStaffById(uncoveredShift.originalStaffId) : undefined;
        const originalRole = originalStaff?.role ?? RoleEnum.Nurse;

        const replacements = staff
            .filter(s => {
                if (s.id === uncoveredShift.originalStaffId || s.id === UNASSIGNED_STAFF_ID) return false;
                if (!isShiftAllowed(uncoveredShift.shiftCode!, s, shiftDefinitions, teams)) return false;

                const staffShiftOnDate = scheduledShifts.find(shift => shift.staffId === s.id && shift.date === uncoveredShift.date);
                if (staffShiftOnDate?.shiftCode) {
                    const staffShiftDef = getShiftDefinitionByCode(staffShiftOnDate.shiftCode);
                    // Can't replace if they are already working, on absence, or post-night
                    if (staffShiftDef && (staffShiftDef.time !== ShiftTime.Rest || staffShiftDef.code === 'S')) return false;
                }
                return true;
            })
            .map(s => {
                return { staff: s, reason: "Disponibile", priority: 1 };
            })
            .sort((a, b) => b.priority - a.priority);

        return replacements;
    }, [staff, scheduledShifts, getShiftDefinitionByCode, getStaffById, teams]);
    
    const assignShift = useCallback(async (shiftId: string, newStaffId: string) => {
        const unassignedShift = scheduledShifts.find(s => s.id === shiftId);
        if (!unassignedShift) return;

        setScheduledShifts(prev => {
            // Remove the unassigned shift
            const filtered = prev.filter(s => s.id !== shiftId);
            
            // Upsert the new shift for the staff member
            const existingShiftIndex = filtered.findIndex(s => s.staffId === newStaffId && s.date === unassignedShift.date);
            const newShift: ScheduledShift = {
                id: `${newStaffId}-${unassignedShift.date}`,
                staffId: newStaffId,
                date: unassignedShift.date,
                shiftCode: unassignedShift.shiftCode,
            };

            if (existingShiftIndex > -1) {
                filtered[existingShiftIndex] = newShift;
                return filtered;
            } else {
                return [...filtered, newShift];
            }
        });
    }, [scheduledShifts]);

    const updateShift = useCallback(async (staffId: string, date: string, newShiftCode: string | null) => {
        const id = `${staffId}-${date}`;
        setScheduledShifts(prev => {
            const otherShifts = prev.filter(s => s.id !== id);
            if (newShiftCode) {
                const newShift: ScheduledShift = { id, staffId, date, shiftCode: newShiftCode };
                return [...otherShifts, newShift];
            }
            return otherShifts;
        });
    }, []);

    const overwriteSchedule = useCallback(async (newShifts: ScheduledShift[], targetMonth: string, affectedStaffIds: string[]) => {
        setScheduledShifts(prev => {
            const otherShifts = prev.filter(s => {
                const isInMonth = s.date.startsWith(targetMonth);
                const isAffected = affectedStaffIds.includes(s.staffId);
                // Keep shifts that are NOT in the affected month for the affected staff
                return !(isInMonth && isAffected);
            });
            return [...otherShifts, ...newShifts];
        });
    }, []);

    const importSchedule = useCallback(async (newShifts: ScheduledShift[]) => {
        if (newShifts.length === 0) return;
        const affectedMonths = Array.from(new Set(newShifts.map(s => s.date.substring(0, 7))));
        const affectedStaffIds = Array.from(new Set(newShifts.map(s => s.staffId)));

        setScheduledShifts(prev => {
            const otherShifts = prev.filter(s => {
                const month = s.date.substring(0, 7);
                const isAffectedMonth = affectedMonths.includes(month);
                const isAffectedStaff = affectedStaffIds.includes(s.staffId);
                return !(isAffectedMonth && isAffectedStaff);
            });
            return [...otherShifts, ...newShifts];
        });
    }, []);

    const updateStaffMember = useCallback(async (staffId: string, updates: Partial<Omit<Staff, 'id' | 'name'>>) => {
        setStaff(prev => prev.map(s => s.id === staffId ? { ...s, ...updates } : s));
        
        // This is needed because the mockStaff in constants.ts is also used by authService
        const staffMember = mockStaff.find(s => s.id === staffId);
        if (staffMember) {
            Object.assign(staffMember, updates);
        }
    }, []);
    
    const changePassword = useCallback(async (staffId: string, oldPassword: string, newPassword: string): Promise<void> => {
        const staffMember = staff.find(s => s.id === staffId);
        if (!staffMember) {
            throw new Error("Utente non trovato.");
        }
        
        if (staffMember.password !== oldPassword) {
            throw new Error("La vecchia password non è corretta.");
        }
        
        await updateStaffMember(staffId, { password: newPassword });
    }, [staff, updateStaffMember]);


    return { 
        isLoading,
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
