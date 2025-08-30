


import { ContractType, ShiftTime, ShiftDefinition, StaffRole, Staff, Team, Location } from '../types';
import { LONG_SHIFTS } from '../constants';

const getStaffAllowedLocations = (staffMember: Staff, teams: Team[]): Location[] => {
    if (!staffMember.teamIds || !teams) return [];
    const teamsMap = new Map(teams.map(t => [t.id, t]));
    const locationsSet = new Set<Location>();
    staffMember.teamIds.forEach(teamId => {
        const team = teamsMap.get(teamId);
        if (team) {
            team.locations.forEach(loc => locationsSet.add(loc));
        }
    });
    return Array.from(locationsSet);
};


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
    
    const allowedLocations = getStaffAllowedLocations(staff, teams);
    if (!allowedLocations.includes(shiftDef.location)) {
        return false;
    }

    if (!shiftDef.roles.includes(role)) {
        if (role === StaffRole.HeadNurse && shiftDef.roles.includes(StaffRole.Nurse)) {
            // Allowed
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
            return true;
            
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