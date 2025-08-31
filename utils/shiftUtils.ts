import { ContractType, ShiftTime, ShiftDefinition, StaffRole, Staff, Team } from '../types';
import { LONG_SHIFTS } from '../constants';

/**
 * Checks if a specific shift is allowed for a given staff member based on role, contract, and individual preferences.
 * @param shiftCode The code of the shift to check (e.g., 'M', 'P', 'N').
 * @param staff The staff member object.
 * @param shiftDefinitions The complete list of available shift definitions.
 * @param teams The complete list of available teams.
 * @returns `true` if the shift is allowed, `false` otherwise.
 */
export const isShiftAllowed = (shiftCode: string, staff: Staff, shiftDefinitions: ShiftDefinition[], teams: Team[]): boolean => {
    const { contract, role, unavailableShiftCodes } = staff;
    
    if (unavailableShiftCodes?.includes(shiftCode)) {
        return false;
    }

    const shiftDef = shiftDefinitions.find(s => s.code === shiftCode);
    if (!shiftDef) return true;

    if (shiftDef.time === ShiftTime.Absence || shiftDef.time === ShiftTime.Rest) {
        return shiftDef.roles.includes(role);
    }
    
    // NEW LOGIC: Check if any of the staff's teams allow this specific shift code.
    // This is more precise than checking locations.
    const staffTeams = teams.filter(t => staff.teamIds?.includes(t.id));
    if (staffTeams.length === 0) {
        return false; // No team means no allowed shifts.
    }

    const isAllowedByAnyTeam = staffTeams.some(team => team.allowedShiftCodes?.includes(shiftCode));
    if (!isAllowedByAnyTeam) {
        return false;
    }

    if (!shiftDef.roles.includes(role)) {
        if (role === StaffRole.HeadNurse && shiftDef.roles.includes(StaffRole.Nurse)) {
            // Head nurses can cover nurse shifts.
        } else {
            return false;
        }
    }
    
    if (LONG_SHIFTS.includes(shiftCode)) {
        return contract === ContractType.H12 || contract === ContractType.H24;
    }

    switch (contract) {
        case ContractType.H6:
            return shiftDef.time === ShiftTime.Morning;
        
        case ContractType.H12:
            return shiftDef.time !== ShiftTime.Night && shiftDef.code !== 'S';
            
        case ContractType.H24:
            // H24 staff are contractually able to work morning, afternoon, and night shifts as part of their rotation.
            // This function checks general eligibility, while the planner enforces the specific M-P-N-S-R cycle.
            return shiftDef.time === ShiftTime.Morning || 
                   shiftDef.time === ShiftTime.Afternoon || 
                   shiftDef.time === ShiftTime.Night;
            
        default:
            return false;
    }
};

/**
 * Gets a list of all shift definitions that are permissible for a given staff member.
 * @param staff The staff member object.
 * @param shiftDefinitions The complete list of available shift definitions.
 * @param teams The complete list of available teams.
 * @returns An array of allowed ShiftDefinition objects.
 */
export const getAllowedShifts = (staff: Staff, shiftDefinitions: ShiftDefinition[], teams: Team[]): ShiftDefinition[] => {
    if (staff.id === 'unassigned') return [];
    
    return shiftDefinitions.filter(def => 
        def.code !== 'UNCOVERED' && isShiftAllowed(def.code, staff, shiftDefinitions, teams)
    );
};