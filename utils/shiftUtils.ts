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
    
    // Check if it's a long shift and if staff is available for long shifts
    if (LONG_SHIFTS.includes(shiftCode)) {
        // Check if staff is available for long shifts
        if (staff.availableForLongShifts === false) {
            return false;
        }
        
        // For H6 contracts, long shifts are never allowed
        if (contract === ContractType.H6) {
            return false;
        }
        
        // For H12 and H24, long shifts are allowed based on contract
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

/**
 * Checks if assigning a long shift to a staff member would exceed their monthly limit.
 * @param staff The staff member object.
 * @param date The date of the shift.
 * @param scheduledShifts All currently scheduled shifts.
 * @returns `true` if the assignment is within limits, `false` otherwise.
 */
export const isWithinLongShiftLimit = (staff: Staff, date: string, scheduledShifts: any[]): boolean => {
    // If staff is not available for long shifts, return false
    if (!staff.availableForLongShifts) {
        return false;
    }
    
    // Get the month from the date
    const [year, month] = date.split('-').map(Number);
    const monthStart = `${year}-${month.toString().padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const monthEnd = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    
    // Count long shifts already assigned to this staff member in the month
    const longShiftsThisMonth = scheduledShifts.filter(shift => {
        // Check if shift is in the same month
        if (shift.date < monthStart || shift.date >= monthEnd) {
            return false;
        }
        
        // Check if shift is a long shift and assigned to this staff member
        return shift.staffId === staff.id && LONG_SHIFTS.includes(shift.shiftCode);
    }).length;
    
    // Check if adding another long shift would exceed the limit
    const maxLongShifts = staff.maxLongShiftsPerMonth ?? 1;
    return longShiftsThisMonth < maxLongShifts;
};

/**
 * Checks if two long shifts are from the same hospital/location group.
 * @param shiftCode1 First shift code
 * @param shiftCode2 Second shift code
 * @param shiftDefinitions All shift definitions
 * @returns `true` if both shifts are from the same hospital, `false` otherwise.
 */
export const areLongShiftsFromSameHospital = (shiftCode1: string, shiftCode2: string, shiftDefinitions: ShiftDefinition[]): boolean => {
    // If neither shift is a long shift, return true
    if (!LONG_SHIFTS.includes(shiftCode1) || !LONG_SHIFTS.includes(shiftCode2)) {
        return true;
    }
    
    const shift1 = shiftDefinitions.find(s => s.code === shiftCode1);
    const shift2 = shiftDefinitions.find(s => s.code === shiftCode2);
    
    if (!shift1 || !shift2) {
        return true; // If we can't find the shifts, assume they're safe
    }
    
    // Group hospitals by prefix
    const hospitalGroups: Record<string, string[]> = {
        'SantEugenio': ['Md', 'Ps', 'Mu', 'Pu', 'Mn', 'Pn', 'N', 'Mat', 'Mat/e', 'Me', 'Pe', 'Mb', 'Pb'],
        'SantaCaterina': ['Msc', 'Psc'],
        'CTO': ['Mc', 'Pc', 'Mac'],
        'CameraOperatoria': ['Mco']
    };
    
    // Find which hospital group each shift belongs to
    let group1 = '';
    let group2 = '';
    
    for (const [group, codes] of Object.entries(hospitalGroups)) {
        if (codes.includes(shiftCode1)) {
            group1 = group;
        }
        if (codes.includes(shiftCode2)) {
            group2 = group;
        }
    }
    
    // Return true if both shifts are from the same hospital group
    return group1 === group2;
};

/**
 * Checks if a combined long shift is dangerous (from different hospitals).
 * @param combinedShiftCode Combined shift code (e.g., "Msc/Ps")
 * @param shiftDefinitions All shift definitions
 * @returns `true` if the combined shift is dangerous, `false` otherwise.
 */
export const isDangerousLongShiftCombination = (combinedShiftCode: string, shiftDefinitions: ShiftDefinition[]): boolean => {
    if (!combinedShiftCode.includes('/')) {
        return false;
    }
    
    const [shift1, shift2] = combinedShiftCode.split('/');
    return !areLongShiftsFromSameHospital(shift1, shift2, shiftDefinitions);
};
