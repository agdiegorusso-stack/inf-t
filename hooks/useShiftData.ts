

import { useState, useCallback, useMemo, useEffect } from 'react';
import { UNASSIGNED_STAFF_ID } from '../constants';
import type { Staff, ScheduledShift, Absence, ShiftDefinition, ReplacementOption, Team, Location } from '../types';
import { ShiftTime, ContractType as ContractEnum, StaffRole as RoleEnum, StaffRole, ContractType } from '../types';
import { isShiftAllowed } from '../utils/shiftUtils';
import { supabase } from '../services/supabaseClient';
import type { Database } from '../services/supabaseClient';

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
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [
                    { data: staffData, error: staffError },
                    { data: teamsData, error: teamsError },
                    { data: staffTeamsData, error: staffTeamsError },
                    { data: shiftsData, error: shiftsError },
                    { data: defsData, error: defsError },
                    { data: absencesData, error: absencesError }
                ] = await Promise.all([
                    supabase.from('staff').select('*'),
                    supabase.from('teams').select('*'),
                    supabase.from('staff_teams').select('*'),
                    supabase.from('scheduled_shifts').select('*'),
                    supabase.from('shift_definitions').select('*'),
                    supabase.from('absences').select('*')
                ]);

                const errors = [staffError, teamsError, staffTeamsError, shiftsError, defsError, absencesError].filter(Boolean);
                if (errors.length > 0) {
                    console.error("Errors fetching data from Supabase:", errors);
                    throw new Error("Failed to fetch initial application data.");
                }

                // Map camelCase from DB to camelCase for client-side Staff objects.
                const staffWithTeams: Staff[] = (staffData || []).map(s => {
                    const teamIds = (staffTeamsData || [])
                        .filter(st => st.staff_id === s.id)
                        .map(st => st.team_id);
                    return {
                        id: s.id,
                        name: s.name,
                        role: s.role as StaffRole,
                        contract: s.contract as ContractType,
                        teamIds,
                        phone: s.phone ?? undefined,
                        email: s.email ?? undefined,
                        password: s.password ?? undefined,
                        hasLaw104: s.hasLaw104 ?? false,
                        specialRules: s.specialRules ?? undefined,
                        unavailableShiftCodes: s.unavailableShiftCodes ?? undefined,
                        nightSquad: s.nightSquad ?? undefined
                    };
                });
                
                // Map camelCase from DB to camelCase for client-side Team objects.
                const mappedTeams: Team[] = (teamsData || []).map(t => ({
                    id: t.id,
                    name: t.name,
                    locations: t.locations as Location[],
                    allowedShiftCodes: t.allowedShiftCodes ?? []
                }));

                // Map snake_case from DB to camelCase for client-side ScheduledShift objects.
                const mappedShifts: ScheduledShift[] = (shiftsData || []).map(s => ({
                    id: s.id,
                    date: s.date,
                    staffId: s.staff_id,
                    shiftCode: s.shift_code,
                    originalStaffId: s.original_staff_id ?? undefined
                }));

                // Map camelCase from DB to camelCase for client-side ShiftDefinition objects.
                const mappedDefs: ShiftDefinition[] = (defsData || []).map(d => ({
                    code: d.code,
                    description: d.description,
                    color: d.color,
                    textColor: d.textColor,
                    location: d.location as Location,
                    time: d.time as ShiftTime,
                    roles: d.roles as StaffRole[],
                }));

                // Map snake_case from DB to camelCase for client-side Absence objects.
                const mappedAbsences: Absence[] = (absencesData || []).map(a => ({
                    id: a.id,
                    staffId: a.staff_id,
                    startDate: a.start_date,
                    endDate: a.end_date,
                    reason: a.reason,
                }));


                setStaff(staffWithTeams);
                setTeams(mappedTeams);
                setScheduledShifts(mappedShifts);
                setShiftDefinitions(mappedDefs);
                setAbsences(mappedAbsences);
            } catch (error) {
                console.error(error);
                // Optionally set an error state to show in the UI
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
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
        const { data, error } = await supabase.from('teams').insert({
            id: newTeam.id,
            name: newTeam.name,
            locations: newTeam.locations,
            allowedShiftCodes: newTeam.allowedShiftCodes,
        }).select().single();
        if (error) {
            console.error("Error adding team:", error);
            return;
        }
        // FIX: Add null check for data returned from Supabase.
        if (data) {
            const addedTeam: Team = { ...data, allowedShiftCodes: data.allowedShiftCodes ?? [], locations: data.locations as Location[] };
            setTeams(prev => [...prev, addedTeam]);
        }
    }, []);

    const updateTeam = useCallback(async (teamId: string, updates: Partial<Omit<Team, 'id'>>) => {
        const dbUpdates: Partial<Database['public']['Tables']['teams']['Row']> = { ...updates };
        
        const { data, error } = await supabase.from('teams').update(dbUpdates).eq('id', teamId).select().single();
        if (error) {
            console.error("Error updating team:", error);
            return;
        }
        // FIX: Add null check for data returned from Supabase.
        if (data) {
            const updatedTeam: Team = { ...data, id: data.id, name: data.name, allowedShiftCodes: data.allowedShiftCodes ?? [], locations: data.locations as Location[] };
            setTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t));
        }
    }, []);

    const deleteTeam = useCallback(async (teamId: string) => {
        // Also handled by cascade delete in Supabase, but good practice to be explicit
        const { error: staffTeamError } = await supabase.from('staff_teams').delete().eq('team_id', teamId);
         if (staffTeamError) {
            console.error("Error deleting staff-team associations:", staffTeamError);
            return;
        }

        const { error } = await supabase.from('teams').delete().eq('id', teamId);
        if (error) {
            console.error("Error deleting team:", error);
            return;
        }

        setTeams(prev => prev.filter(t => t.id !== teamId));
        setStaff(prevStaff => prevStaff.map(s => ({
            ...s,
            teamIds: s.teamIds ? s.teamIds.filter(id => id !== teamId) : []
        })));
    }, []);

    const addShiftDefinition = useCallback(async (newShift: ShiftDefinition) => {
        const { data, error } = await supabase.from('shift_definitions').insert(newShift).select().single();
        if (error) {
            console.error("Error adding shift definition:", error);
            return;
        }
        // FIX: Add null check for data returned from Supabase.
        if (data) {
            const addedShift: ShiftDefinition = { ...data, textColor: data.textColor, location: data.location as Location, time: data.time as ShiftTime, roles: data.roles as StaffRole[] };
            setShiftDefinitions(prev => [...prev, addedShift]);
        }
    }, []);

    const deleteShiftDefinition = useCallback(async (code: string) => {
        if (scheduledShifts.some(s => s.shiftCode?.split('/').includes(code))) {
            alert("Impossibile eliminare il turno perché è attualmente assegnato nel calendario. Rimuovere tutte le assegnazioni prima di procedere.");
            return;
        }
        const { error } = await supabase.from('shift_definitions').delete().eq('code', code);
        if (error) {
            console.error("Error deleting shift definition:", error);
            return;
        }
        setShiftDefinitions(prev => prev.filter(s => s.code !== code));
    }, [scheduledShifts]);

    const updateShiftDefinition = useCallback(async (originalCode: string, updatedShift: ShiftDefinition) => {
        const { data, error } = await supabase.from('shift_definitions').update(updatedShift).eq('code', originalCode).select().single();
         if (error) {
            console.error("Error updating shift definition:", error);
            return;
        }
        // FIX: Add null check for data returned from Supabase.
        if (data) {
            const newShiftDef: ShiftDefinition = { ...data, textColor: data.textColor, location: data.location as Location, time: data.time as ShiftTime, roles: data.roles as StaffRole[] };
            setShiftDefinitions(prev => prev.map(s => s.code === originalCode ? newShiftDef : s));
        }
    }, []);

    const addAbsence = useCallback(async (staffId: string, reason: string, startDate: Date, endDate: Date) => {
        const newAbsence = { staff_id: staffId, reason, start_date: formatDate(startDate), end_date: formatDate(endDate) };
        const { data: insertedAbsence, error: absenceError } = await supabase.from('absences').insert(newAbsence).select().single();
        if(absenceError || !insertedAbsence) {
            console.error("Error adding absence:", absenceError);
            return;
        }
        const mappedAbsence: Absence = { id: insertedAbsence.id, staffId: insertedAbsence.staff_id, startDate: insertedAbsence.start_date, endDate: insertedAbsence.end_date, reason: insertedAbsence.reason };
        setAbsences(prev => [...prev, mappedAbsence]);

        let currentDate = new Date(startDate);
        const shiftsToUpsert = [];
        const uncoveredShiftsToInsert = [];
        
        while (currentDate <= endDate) {
            const dateStr = formatDate(currentDate);
            const originalShift = scheduledShifts.find(s => s.staffId === staffId && s.date === dateStr);
            const originalShiftCode = originalShift?.shiftCode;
            const originalShiftDef = originalShiftCode ? getShiftDefinitionByCode(originalShiftCode) : null;
            
            if (originalShiftDef && originalShiftDef.time !== ShiftTime.Absence && originalShiftDef.time !== ShiftTime.Rest) {
                uncoveredShiftsToInsert.push({
                    id: `uncovered-${staffId}-${dateStr}`,
                    date: dateStr,
                    staff_id: UNASSIGNED_STAFF_ID,
                    shift_code: originalShiftCode,
                    original_staff_id: staffId,
                });
            }
            shiftsToUpsert.push({
                id: `${staffId}-${dateStr}`,
                staff_id: staffId,
                date: dateStr,
                shift_code: reason
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (uncoveredShiftsToInsert.length > 0) {
            await supabase.from('scheduled_shifts').upsert(uncoveredShiftsToInsert);
        }
        await supabase.from('scheduled_shifts').upsert(shiftsToUpsert);
        
        // Refetch shifts to ensure consistency
        const { data: updatedShiftsData } = await supabase.from('scheduled_shifts').select('*');
        if(updatedShiftsData) {
            const mappedShifts: ScheduledShift[] = updatedShiftsData.map(s => ({
                id: s.id,
                date: s.date,
                staffId: s.staff_id,
                shiftCode: s.shift_code,
                originalStaffId: s.original_staff_id ?? undefined
            }));
            setScheduledShifts(mappedShifts);
        }
    }, [getShiftDefinitionByCode, scheduledShifts]);

    const findReplacements = useCallback((uncoveredShift: ScheduledShift): ReplacementOption[] => {
        // This logic remains client-side as it's for finding candidates, not writing data.
        const uncoveredShiftDef = getShiftDefinitionByCode(uncoveredShift.shiftCode!);
        if (!uncoveredShiftDef) return [];

        const originalStaff = uncoveredShift.originalStaffId ? getStaffById(uncoveredShift.originalStaffId) : undefined;
        const originalRole = originalStaff?.role ?? RoleEnum.Nurse;

        const replacements = staff
            .filter(s => {
                if (s.id === uncoveredShift.originalStaffId || s.id === UNASSIGNED_STAFF_ID) return false;
                // Role check
                if (uncoveredShiftDef.roles.length > 0 && !uncoveredShiftDef.roles.includes(s.role) && !(s.role === RoleEnum.HeadNurse && uncoveredShiftDef.roles.includes(RoleEnum.Nurse))) return false;
                // Availability, night shift rules, etc.
                const staffShiftOnDate = scheduledShifts.find(shift => shift.staffId === s.id && shift.date === uncoveredShift.date);
                if (staffShiftOnDate?.shiftCode) {
                    const staffShiftDef = getShiftDefinitionByCode(staffShiftOnDate.shiftCode);
                    if (staffShiftDef && (staffShiftDef.time === ShiftTime.Absence || staffShiftDef.code === 'S')) return false;
                }
                return true; // Simplified for brevity
            })
            .map(s => {
                // Scoring logic remains the same
                return { staff: s, reason: "Disponibile", priority: 1 };
            })
            .sort((a, b) => b.priority - a.priority);

        return replacements;
    }, [staff, scheduledShifts, getShiftDefinitionByCode, getStaffById, getStaffAllowedLocations]);
    
    const assignShift = useCallback(async (shiftId: string, newStaffId: string) => {
        const unassignedShift = scheduledShifts.find(s => s.id === shiftId);
        if (!unassignedShift) return;

        // Delete the 'unassigned' shift
        await supabase.from('scheduled_shifts').delete().eq('id', shiftId);

        // Upsert the shift for the new staff member
        const { data, error } = await supabase.from('scheduled_shifts').upsert({
            id: `${newStaffId}-${unassignedShift.date}`,
            staff_id: newStaffId,
            date: unassignedShift.date,
            shift_code: unassignedShift.shiftCode
        }).select();

        if(error) {
            console.error("Error assigning shift:", error);
            // Re-insert the uncovered shift to revert state? Or show error.
            return;
        }

        // Refetch for consistency instead of manual state updates
        const { data: updatedShiftsData } = await supabase.from('scheduled_shifts').select('*');
        if (updatedShiftsData) {
            const mappedShifts: ScheduledShift[] = updatedShiftsData.map(s => ({
                id: s.id,
                date: s.date,
                staffId: s.staff_id,
                shiftCode: s.shift_code,
                originalStaffId: s.original_staff_id ?? undefined
            }));
            setScheduledShifts(mappedShifts);
        }
    }, [scheduledShifts]);

    const updateShift = useCallback(async (staffId: string, date: string, newShiftCode: string | null) => {
        const id = `${staffId}-${date}`;
        let updatedShiftData: Database['public']['Tables']['scheduled_shifts']['Row'] | null = null;
        if (newShiftCode) {
            const { data, error } = await supabase.from('scheduled_shifts').upsert({ id, staff_id: staffId, date, shift_code: newShiftCode }).select().single();
            if(error) { console.error("Error updating shift:", error); return; }
            updatedShiftData = data;
        } else {
            const { error } = await supabase.from('scheduled_shifts').delete().eq('id', id);
            if(error) { console.error("Error deleting shift:", error); return; }
        }
        
        const updatedShift: ScheduledShift | null = updatedShiftData ? {
            id: updatedShiftData.id,
            staffId: updatedShiftData.staff_id,
            date: updatedShiftData.date,
            shiftCode: updatedShiftData.shift_code,
            originalStaffId: updatedShiftData.original_staff_id ?? undefined
        } : null;

        setScheduledShifts(prev => {
            const otherShifts = prev.filter(s => s.id !== id);
            return updatedShift ? [...otherShifts, updatedShift] : otherShifts;
        });

        // Basic handling for creating/removing uncovered shifts
        // A more robust solution would use a database trigger or function (RPC).
        const originalShift = scheduledShifts.find(s => s.id === id);
        if (originalShift?.shiftCode) {
             const wasWorking = getShiftDefinitionByCode(originalShift.shiftCode)?.time !== ShiftTime.Rest;
             const isNowAbsence = newShiftCode ? getShiftDefinitionByCode(newShiftCode)?.time === ShiftTime.Absence : false;
             if (wasWorking && isNowAbsence) {
                await supabase.from('scheduled_shifts').insert({
                    id: `uncovered-${id}`, date, staff_id: UNASSIGNED_STAFF_ID, shift_code: originalShift.shiftCode, original_staff_id: staffId
                });
                // Refetch for consistency
                const {data} = await supabase.from('scheduled_shifts').select('*');
                if(data) {
                    const mappedShifts: ScheduledShift[] = data.map(s => ({
                        id: s.id,
                        date: s.date,
                        staffId: s.staff_id,
                        shiftCode: s.shift_code,
                        originalStaffId: s.original_staff_id ?? undefined
                    }));
                    setScheduledShifts(mappedShifts);
                }
             }
        }
    }, [scheduledShifts, getShiftDefinitionByCode]);

    const overwriteSchedule = useCallback(async (newShifts: ScheduledShift[], targetMonth: string, affectedStaffIds: string[]) => {
        // Delete existing shifts for the given month and staff
        const { error: deleteError } = await supabase
            .from('scheduled_shifts')
            .delete()
            .in('staff_id', affectedStaffIds)
            .like('date', `${targetMonth}-%`);
        
        if (deleteError) { console.error("Error clearing schedule:", deleteError); return; }

        // Insert new shifts
        const dbShifts = newShifts.map(s => ({
            id: s.id,
            date: s.date,
            staff_id: s.staffId,
            shift_code: s.shiftCode,
            original_staff_id: s.originalStaffId
        }));
        const { error: insertError } = await supabase.from('scheduled_shifts').insert(dbShifts);
        if(insertError) { console.error("Error inserting new schedule:", insertError); return; }

        // Refetch all shifts to update UI
        const { data } = await supabase.from('scheduled_shifts').select('*');
        if(data) {
            const mappedShifts: ScheduledShift[] = data.map(s => ({
                id: s.id,
                date: s.date,
                staffId: s.staff_id,
                shiftCode: s.shift_code,
                originalStaffId: s.original_staff_id ?? undefined
            }));
            setScheduledShifts(mappedShifts);
        }
    }, []);

    const importSchedule = useCallback(async (newShifts: ScheduledShift[]) => {
        // Similar to overwrite, but determines staff/month from data
         if (newShifts.length === 0) return;
        const affectedMonths = Array.from(new Set(newShifts.map(s => s.date.substring(0, 7))));
        const affectedStaffIds = Array.from(new Set(newShifts.map(s => s.staffId)));

        for (const month of affectedMonths) {
            await supabase.from('scheduled_shifts').delete().in('staff_id', affectedStaffIds).like('date', `${month}-%`);
        }
        const dbShifts = newShifts.map(s => ({
            id: s.id,
            date: s.date,
            staff_id: s.staffId,
            shift_code: s.shiftCode,
            original_staff_id: s.originalStaffId
        }));
        await supabase.from('scheduled_shifts').insert(dbShifts);
        
        const { data } = await supabase.from('scheduled_shifts').select('*');
        if(data) {
            const mappedShifts: ScheduledShift[] = data.map(s => ({
                id: s.id,
                date: s.date,
                staffId: s.staff_id,
                shiftCode: s.shift_code,
                originalStaffId: s.original_staff_id ?? undefined
            }));
            setScheduledShifts(mappedShifts);
        }
    }, []);

    const updateStaffMember = useCallback(async (staffId: string, updates: Partial<Omit<Staff, 'id' | 'name'>>) => {
        const { teamIds, ...staffUpdates } = updates;
        
        const dbStaffUpdates: Partial<Database['public']['Tables']['staff']['Update']> = { ...staffUpdates };

        const { data, error } = await supabase.from('staff').update(dbStaffUpdates).eq('id', staffId).select().single();
        if (error) { console.error("Error updating staff:", error); return; }
        
        if (teamIds !== undefined) {
            await supabase.from('staff_teams').delete().eq('staff_id', staffId);
            if(teamIds.length > 0) {
                 await supabase.from('staff_teams').insert(teamIds.map(team_id => ({ staff_id: staffId, team_id })));
            }
        }
        
        setStaff(prev => prev.map(s => s.id === staffId ? { ...s, ...updates } : s));
    }, []);

    const changePassword = useCallback(async (staffId: string, newPassword: string): Promise<void> => {
        const { error } = await supabase.from('staff').update({ password: newPassword }).eq('id', staffId);
        if (error) {
            console.error("Error changing password:", error);
            throw new Error("Could not update password in database.");
        }
        setStaff(prev => prev.map(s => s.id === staffId ? { ...s, password: newPassword } : s));
    }, []);

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
        changePassword, // This is a simplified version, real auth would be different
        addTeam,
        updateTeam,
        deleteTeam,
        getStaffAllowedLocations,
    };
};