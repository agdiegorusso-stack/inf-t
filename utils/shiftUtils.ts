
import { ContractType, ShiftTime, ShiftDefinition, StaffRole, Staff } from '../types';
import { SHIFT_DEFINITIONS, LONG_SHIFTS } from '../constants';

/**
 * Checks if a specific shift is allowed for a given staff member based on role and contract.
 * @param shiftCode The code of the shift to check (e.g., 'M', 'P', 'N').
 * @param contract The contract type of the staff member.
 * @param role The role of the staff member.
 * @returns `true` if the shift is allowed, `false` otherwise.
 */
export const isShiftAllowed = (shiftCode: string, contract: ContractType, role: StaffRole): boolean => {
    const shiftDef = SHIFT_DEFINITIONS.find(s => s.code === shiftCode);
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
 * @returns An array of allowed ShiftDefinition objects.
 */
export const getAllowedShifts = (staff: Staff): ShiftDefinition[] => {
    if (staff.id === 'unassigned') return [];
    
    return SHIFT_DEFINITIONS.filter(def => 
        def.code !== 'UNCOVERED' && isShiftAllowed(def.code, staff.contract, staff.role)
    );
};
