
import type { Staff } from '../types';
import { mockStaff, mockTeams } from '../constants';
import type { StaffRole, ContractType } from '../types';

/**
 * Authenticates a user by checking credentials against the local mock data.
 * @param staffId The ID of the staff member trying to log in.
 * @param password The password provided by the user.
 * @returns A Promise that resolves with the Staff object (without password) on success, or rejects with an Error on failure.
 */
export const mockAuthenticateUser = (staffId: string, password: string): Promise<Staff> => {
    return new Promise((resolve, reject) => {
        // Find user from mock data
        const staffData = mockStaff.find(s => s.id === staffId);

        if (!staffData) {
            return reject(new Error('Utente non trovato o errore di connessione.'));
        }

        // Verify the password.
        if (staffData.password === password) {
            // Construct and resolve the user object.
            const user: Staff = {
                id: staffData.id,
                name: staffData.name,
                role: staffData.role as StaffRole,
                contract: staffData.contract as ContractType,
                teamIds: staffData.teamIds,
                phone: staffData.phone,
                email: staffData.email,
                hasLaw104: staffData.hasLaw104,
                specialRules: staffData.specialRules,
                unavailableShiftCodes: staffData.unavailableShiftCodes,
                nightSquad: staffData.nightSquad,
            };
            // The user object for the session does not need the password.
            resolve(user);
        } else {
            reject(new Error('Credenziali non valide. Riprova.'));
        }
    });
};
