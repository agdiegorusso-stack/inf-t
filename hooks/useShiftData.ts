
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { UNASSIGNED_STAFF_ID, mockStaff, mockTeams, mockShiftDefinitions } from '../constants';
import { supabase } from '../services/supabaseClient';
import type { Staff, ScheduledShift, Absence, ShiftDefinition, ReplacementOption, Team, Location } from '../types';
import { ShiftTime, StaffRole as RoleEnum, StaffRole } from '../types';
import { isShiftAllowed } from '../utils/shiftUtils';

 // Helper to format date to YYYY-MM-DD
const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const STORAGE_KEY = 'shiftDataCacheV1';
interface CachedData {
    staff: Staff[];
    teams: Team[];
    shiftDefinitions: ShiftDefinition[];
    scheduledShifts: ScheduledShift[];
    absences: Absence[];
}

export const useShiftData = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [staff, setStaff] = useState<Staff[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.staff?.length) return parsed.staff as Staff[];
            }
        } catch {}
        return JSON.parse(JSON.stringify(mockStaff));
    });
    const [teams, setTeams] = useState<Team[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.teams?.length) return parsed.teams as Team[];
            }
        } catch {}
        return JSON.parse(JSON.stringify(mockTeams));
    });
    const [scheduledShifts, setScheduledShifts] = useState<ScheduledShift[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [shiftDefinitions, setShiftDefinitions] = useState<ShiftDefinition[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.shiftDefinitions?.length) return parsed.shiftDefinitions as ShiftDefinition[];
            }
        } catch {}
        return JSON.parse(JSON.stringify(mockShiftDefinitions));
    });
    const [isRemote, setIsRemote] = useState(false);
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!hasLoadedRef.current) {
                setIsLoading(true);
            }
            let staffData, staffError, teamsData, teamsError, shiftDefData, shiftDefError;

            if (supabase) {
                try {
                    ({ data: staffData, error: staffError } = await supabase.from('staff').select('*'));
                    ({ data: teamsData, error: teamsError } = await supabase.from('teams').select('*'));
                    ({ data: shiftDefData, error: shiftDefError } = await supabase.from('shift_definitions').select('*'));
                } catch (e) {
                    console.warn('Errore fetch Supabase, fallback ai cache/mock', e);
                }
            }

            const hasRemote =
                supabase &&
                !staffError &&
                !teamsError &&
                !shiftDefError &&
                Array.isArray(staffData) &&
                Array.isArray(teamsData) &&
                Array.isArray(shiftDefData);

            if (hasRemote) {
                setIsRemote(true);
                setStaff(staffData!);
                setTeams(teamsData!);
                setShiftDefinitions(shiftDefData!);
                try {
                    const { data: schedData, error: schedError } = await supabase.from('scheduled_shifts').select('*');
                    if (!schedError) {
                        setScheduledShifts(schedData || []);
                    }
                    const { data: absData, error: absErr } = await supabase.from('absences').select('*');
                    if (!absErr) {
                        setAbsences(absData || []);
                    }
                } catch (e) {
                    console.warn('Errore caricamento scheduled_shifts/absences, proseguo senza', e);
                }
            } else {
                setIsRemote(false);
                // Prova prima a prendere da localStorage
                let loaded = false;
                try {
                    const raw = localStorage.getItem(STORAGE_KEY);
                    if (raw) {
                        const parsed: Partial<CachedData> = JSON.parse(raw);
                        if (parsed && parsed.staff && parsed.teams && parsed.shiftDefinitions) {
                            setStaff(parsed.staff as Staff[]);
                            setTeams(parsed.teams as Team[]);
                            setShiftDefinitions(parsed.shiftDefinitions as ShiftDefinition[]);
                            setScheduledShifts(parsed.scheduledShifts || []);
                            setAbsences(parsed.absences || []);
                            loaded = true;
                            console.info('Dati caricati da cache locale');
                        }
                    }
                } catch (e) {
                    console.warn('Errore parsing cache locale', e);
                }

                if (!loaded) {
                    console.warn('Uso mock (supabase non configurato/dataset vuoto e nessuna cache)', {
                        supabasePresent: !!supabase,
                        staffError, teamsError, shiftDefError,
                        staffCount: staffData?.length ?? null,
                        teamsCount: teamsData?.length ?? null,
                        shiftDefCount: shiftDefData?.length ?? null
                    });
                    setStaff(JSON.parse(JSON.stringify(mockStaff)));
                    setTeams(JSON.parse(JSON.stringify(mockTeams)));
                    setShiftDefinitions(JSON.parse(JSON.stringify(mockShiftDefinitions)));
                    setScheduledShifts([]);
                    setAbsences([]);
                }
            }

            hasLoadedRef.current = true;
            setIsLoading(false);
        };
        fetchData();
    }, []);

    // Persistenza locale quando in modalità senza backend
    useEffect(() => {
        if (!isRemote && !isLoading) {
            try {
                const payload: CachedData = {
                    staff,
                    teams,
                    shiftDefinitions,
                    scheduledShifts,
                    absences
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            } catch (e) {
                console.warn('Impossibile salvare cache locale', e);
            }
        }
    }, [isRemote, isLoading, staff, teams, shiftDefinitions, scheduledShifts, absences]);


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
        if (!supabase || !isRemote) {
            setTeams(prev => [...prev, newTeam]);
            return;
        }
        try {
            const { error } = await supabase.from('teams').insert([newTeam]);
            if (!error) {
                const { data: teamsData } = await supabase.from('teams').select('*');
                setTeams(teamsData || []);
            } else {
                console.warn('Errore insert team, fallback locale', error);
                setTeams(prev => [...prev, newTeam]);
            }
        } catch (e) {
            console.warn('Eccezione insert team, fallback locale', e);
            setTeams(prev => [...prev, newTeam]);
        }
    }, [isRemote]);

    const updateTeam = useCallback(async (teamId: string, updates: Partial<Omit<Team, 'id'>>) => {
        if (!supabase || !isRemote) {
            setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...updates } : t));
            return;
        }
        try {
            const { error } = await supabase.from('teams').update(updates).eq('id', teamId);
            if (!error) {
                const { data: teamsData } = await supabase.from('teams').select('*');
                setTeams(teamsData || []);
            } else {
                console.warn('Errore update team, fallback locale', error);
                setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...updates } : t));
            }
        } catch (e) {
            console.warn('Eccezione update team, fallback locale', e);
            setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...updates } : t));
        }
    }, [isRemote]);

    const deleteTeam = useCallback(async (teamId: string) => {
        setTeams(prev => prev.filter(t => t.id !== teamId));
        setStaff(prevStaff => prevStaff.map(s => ({
            ...s,
            teamIds: s.teamIds ? s.teamIds.filter(id => id !== teamId) : []
        })));
    }, []);

    const addShiftDefinition = useCallback(async (newShift: ShiftDefinition) => {
        if (!supabase || !isRemote) {
            setShiftDefinitions(prev => [...prev, newShift]);
            return;
        }
        try {
            const { error } = await supabase.from('shift_definitions').insert([newShift]);
            if (!error) {
                const { data: shiftDefData } = await supabase.from('shift_definitions').select('*');
                setShiftDefinitions(shiftDefData || []);
            } else {
                console.warn('Errore insert shift_def, fallback locale', error);
                setShiftDefinitions(prev => [...prev, newShift]);
            }
        } catch (e) {
            console.warn('Eccezione insert shift_def, fallback locale', e);
            setShiftDefinitions(prev => [...prev, newShift]);
        }
    }, [isRemote]);

    const deleteShiftDefinition = useCallback(async (code: string) => {
        if (scheduledShifts.some(s => s.shiftCode?.split('/').includes(code))) {
            alert("Impossibile eliminare il turno perché è attualmente assegnato nel calendario. Rimuovere tutte le assegnazioni prima di procedere.");
            return;
        }
        if (!supabase || !isRemote) {
            setShiftDefinitions(prev => prev.filter(s => s.code !== code));
            return;
        }
        try {
            const { error } = await supabase.from('shift_definitions').delete().eq('code', code);
            if (!error) {
                const { data: shiftDefData } = await supabase.from('shift_definitions').select('*');
                setShiftDefinitions(shiftDefData || []);
            } else {
                console.warn('Errore delete shift_def, fallback locale', error);
                setShiftDefinitions(prev => prev.filter(s => s.code !== code));
            }
        } catch (e) {
            console.warn('Eccezione delete shift_def, fallback locale', e);
            setShiftDefinitions(prev => prev.filter(s => s.code !== code));
        }
    }, [scheduledShifts, isRemote]);

    const updateShiftDefinition = useCallback(async (originalCode: string, updatedShift: ShiftDefinition) => {
        if (!supabase || !isRemote) {
            setShiftDefinitions(prev => prev.map(s => s.code === originalCode ? updatedShift : s));
        } else {
            try {
                const { error } = await supabase.from('shift_definitions').update(updatedShift).eq('code', originalCode);
                if (!error) {
                    const { data: shiftDefData } = await supabase.from('shift_definitions').select('*');
                    setShiftDefinitions(shiftDefData || []);
                } else {
                    console.warn('Errore update shift_def, fallback locale', error);
                    setShiftDefinitions(prev => prev.map(s => s.code === originalCode ? updatedShift : s));
                }
            } catch (e) {
                console.warn('Eccezione update shift_def, fallback locale', e);
                setShiftDefinitions(prev => prev.map(s => s.code === originalCode ? updatedShift : s));
            }
        }
        if (originalCode !== updatedShift.code) {
            setScheduledShifts(prevShifts => prevShifts.map(ss => {
                if (ss.shiftCode === originalCode) {
                    return { ...ss, shiftCode: updatedShift.code };
                }
                return ss;
            }));
        }
    }, [isRemote]);
    
    const addAbsence = useCallback(async (staffId: string, reason: string, startDate: Date, endDate: Date) => {
        const newAbsence: Absence = {
            id: `abs-${staffId}-${Date.now()}`,
            staffId,
            reason,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
        };
        if (!supabase || !isRemote) {
            setAbsences(prev => [...prev, newAbsence]);
        } else {
            try {
                const { error } = await supabase.from('absences').insert([newAbsence]);
                if (!error) {
                    const { data: absData } = await supabase.from('absences').select('*');
                    setAbsences(absData || []);
                } else {
                    console.warn('Errore insert absence, fallback locale', error);
                    setAbsences(prev => [...prev, newAbsence]);
                }
            } catch (e) {
                console.warn('Eccezione insert absence, fallback locale', e);
                setAbsences(prev => [...prev, newAbsence]);
            }
        }

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

        if (supabase && isRemote) {
            try {
                if (newShifts.length > 0 || uncoveredShifts.length > 0) {
                    await supabase.from('scheduled_shifts').upsert([...newShifts, ...uncoveredShifts], { onConflict: 'id' });
                }
                // refresh both shifts & absences
                const [{ data: shiftsData }, { data: absData }] = await Promise.all([
                    supabase.from('scheduled_shifts').select('*'),
                    supabase.from('absences').select('*')
                ]);
                setScheduledShifts(shiftsData || []);
                setAbsences(absData || []);
            } catch (e) {
                console.warn('Persistenza remote assenze fallita, aggiorno solo locale', e);
                setScheduledShifts(prev => {
                    const otherShifts = prev.filter(s => {
                        if (s.staffId !== staffId) return true;
                        const shiftDate = new Date(s.date);
                        return shiftDate < startDate || shiftDate > endDate;
                    });
                    return [...otherShifts, ...newShifts, ...uncoveredShifts];
                });
            }
        } else {
            setScheduledShifts(prev => {
                const otherShifts = prev.filter(s => {
                    if (s.staffId !== staffId) return true;
                    const shiftDate = new Date(s.date);
                    return shiftDate < startDate || shiftDate > endDate;
                });
                return [...otherShifts, ...newShifts, ...uncoveredShifts];
            });
        }
    }, [scheduledShifts, getShiftDefinitionByCode, isRemote]);

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
        const newShift: ScheduledShift = {
            id: `${newStaffId}-${unassignedShift.date}`,
            staffId: newStaffId,
            date: unassignedShift.date,
            shiftCode: unassignedShift.shiftCode,
        };

        setScheduledShifts(prev => {
            const filtered = prev.filter(s => s.id !== shiftId);
            const existingShiftIndex = filtered.findIndex(s => s.staffId === newStaffId && s.date === unassignedShift.date);
            if (existingShiftIndex > -1) {
                filtered[existingShiftIndex] = newShift;
                return filtered;
            }
            return [...filtered, newShift];
        });

        if (supabase && isRemote) {
            try {
                await supabase.from('scheduled_shifts').delete().eq('id', shiftId);
                await supabase.from('scheduled_shifts').upsert([newShift], { onConflict: 'id' });
            } catch (e) {
                console.warn('Errore persistenza assignShift remoto', e);
            }
        }
    }, [scheduledShifts, isRemote]);

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
        if (supabase && isRemote) {
            try {
                if (newShiftCode) {
                    await supabase.from('scheduled_shifts').upsert([{ id, staffId, date, shiftCode: newShiftCode }], { onConflict: 'id' });
                } else {
                    await supabase.from('scheduled_shifts').delete().eq('id', id);
                }
            } catch (e) {
                console.warn('Errore persistenza updateShift remoto', e);
            }
        }
    }, [isRemote]);

    const overwriteSchedule = useCallback(async (newShifts: ScheduledShift[], targetMonth: string, affectedStaffIds: string[]) => {
        setScheduledShifts(prev => {
            const otherShifts = prev.filter(s => {
                const isInMonth = s.date.startsWith(targetMonth);
                const isAffected = affectedStaffIds.includes(s.staffId);
                return !(isInMonth && isAffected);
            });
            return [...otherShifts, ...newShifts];
        });

        if (supabase && isRemote) {
            try {
                if (affectedStaffIds.length > 0) {
                    await supabase
                        .from('scheduled_shifts')
                        .delete()
                        .in('staffId', affectedStaffIds)
                        .like('date', `${targetMonth}%`);
                }
                if (newShifts.length > 0) {
                    await supabase.from('scheduled_shifts').upsert(newShifts, { onConflict: 'id' });
                }
            } catch (e) {
                console.warn('Errore persistenza overwriteSchedule remoto', e);
            }
        }
    }, [isRemote]);

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

        if (supabase && isRemote) {
            try {
                for (const m of affectedMonths) {
                    await supabase
                        .from('scheduled_shifts')
                        .delete()
                        .in('staffId', affectedStaffIds)
                        .like('date', `${m}%`);
                }
                await supabase.from('scheduled_shifts').upsert(newShifts, { onConflict: 'id' });
            } catch (e) {
                console.warn('Errore persistenza importSchedule remoto', e);
            }
        }
    }, [isRemote]);

    const updateStaffMember = useCallback(async (staffId: string, updates: Partial<Omit<Staff, 'id' | 'name'>>) => {
        if (!supabase || !isRemote) {
            setStaff(prev => prev.map(s => s.id === staffId ? { ...s, ...updates } : s));
        } else {
            try {
                const { error } = await supabase.from('staff').update(updates).eq('id', staffId);
                if (!error) {
                    const { data: staffData } = await supabase.from('staff').select('*');
                    setStaff(staffData || []);
                } else {
                    console.warn('Errore update staff, fallback locale', error);
                    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, ...updates } : s));
                }
            } catch (e) {
                console.warn('Eccezione update staff, fallback locale', e);
                setStaff(prev => prev.map(s => s.id === staffId ? { ...s, ...updates } : s));
            }
        }
        const staffMember = mockStaff.find(s => s.id === staffId);
        if (staffMember) {
            Object.assign(staffMember, updates);
        }
    }, [isRemote]);
    
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
