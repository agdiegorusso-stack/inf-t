
import { ContractType, ShiftTime, ShiftDefinition, StaffRole, Staff } from '../types';
import { LONG_SHIFTS } from '../constants';

/**
 * Checks if a specific shift is allowed for a given staff member based on role, contract, and individual preferences.
 * @param shiftCode The code of the shift to check (e.g., 'M', 'P', 'N').
 * @param staff The staff member object.
 * @param shiftDefinitions The complete list of available shift definitions.
 * @returns `true` if the shift is allowed, `false` otherwise.
 */
export const isShiftAllowed = (shiftCode: string, staff: Staff, shiftDefinitions: ShiftDefinition[]): boolean => {
    const { contract, role, unavailableShiftCodes } = staff;
    
    // Rule 1: Check individual unavailability preferences
    if (unavailableShiftCodes?.includes(shiftCode)) {
        return false;
    }

    const shiftDef = shiftDefinitions.find(s => s.code === shiftCode);
    if (!shiftDef) return true; // Allow empty/unassigned by default

    // Absences and rests are always allowed for anyone that is part of any role group
    if (shiftDef.time === ShiftTime.Absence || shiftDef.time === ShiftTime.Rest) {
        return shiftDef.roles.includes(role);
    }
    
    // Primary rule: Check if the staff's role is permitted for this shift
    if (!shiftDef.roles.includes(role)) {
        // Special case: Head Nurses can substitute for Nurses
        if (role === StaffRole.HeadNurse && shiftDef.roles.includes(StaffRole.Nurse)) {
            // This is allowed, proceed to contract checks
        } else {
            return false; // Role is not allowed for this shift
        }
    }
    
    // Rule for long shifts
    if (LONG_SHIFTS.includes(shiftCode)) {
        return contract === ContractType.H12 || contract === ContractType.H24;
    }

    // Contract-based rules
    switch (contract) {
        case ContractType.H6:
            // h6 can only work Morning shifts.
            return shiftDef.time === ShiftTime.Morning;
        
        case ContractType.H12:
            // h12 cannot work Night shifts or the subsequent post-night rest.
            return shiftDef.time !== ShiftTime.Night && shiftDef.code !== 'S';
            
        case ContractType.H24:
            // h24 can work any shift.
            return true;
            
        default:
            return false;
    }
};

/**
 * Gets a list of all shift definitions that are permissible for a given staff member.
 * @param staff The staff member object, containing contract and role.
 * @param shiftDefinitions The complete list of available shift definitions.
 * @returns An array of allowed ShiftDefinition objects.
 */
export const getAllowedShifts = (staff: Staff, shiftDefinitions: ShiftDefinition[]): ShiftDefinition[] => {
    if (staff.id === 'unassigned') return [];
    
    return shiftDefinitions.filter(def => 
        def.code !== 'UNCOVERED' && isShiftAllowed(def.code, staff, shiftDefinitions)
    );
};
