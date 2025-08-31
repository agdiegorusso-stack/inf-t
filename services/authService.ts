

import type { Staff } from '../types';
import { supabase } from './supabaseClient';
import type { StaffRole, ContractType } from '../types';

/**
 * Authenticates a user by checking credentials against the Supabase database.
 * This function assumes the user has added a 'password' column to their 'staff' table.
 * @param staffId The ID of the staff member trying to log in.
 * @param password The password provided by the user.
 * @returns A Promise that resolves with the Staff object (without password) on success, or rejects with an Error on failure.
 */
export const mockAuthenticateUser = (staffId: string, password: string): Promise<Staff> => {
    return new Promise(async (resolve, reject) => {
        // Step 1: Fetch the staff member's details.
        const { data: staffData, error: staffError } = await supabase
            .from('staff')
            .select('*')
            .eq('id', staffId)
            .single();

        if (staffError || !staffData) {
            console.error('Authentication error:', staffError);
            return reject(new Error('Utente non trovato o errore di connessione.'));
        }

        // Step 2: Verify the password.
        // In a real-world application, passwords should be hashed.
        if ((staffData.password === password) || (!staffData.password && password === 'password')) { // Allow default 'password' if none is set
            // Step 3: If password is correct, fetch team associations.
            const { data: staffTeamsData, error: staffTeamsError } = await supabase
              .from('staff_teams')
              .select('team_id')
              .eq('staff_id', staffId);

            if (staffTeamsError) {
              console.error('Team fetch error:', staffTeamsError);
              return reject(new Error('Errore nel recuperare i team dell\'utente.'));
            }
            
            const teamIds = staffTeamsData ? staffTeamsData.map(st => st.team_id) : [];

            // Step 4: Construct and resolve the user object.
            const user: Staff = {
                id: staffData.id,
                name: staffData.name,
                role: staffData.role as StaffRole,
                contract: staffData.contract as ContractType,
                teamIds,
                phone: staffData.phone ?? undefined,
                email: staffData.email ?? undefined,
                hasLaw104: staffData.hasLaw104 ?? undefined,
                specialRules: staffData.specialRules ?? undefined,
                unavailableShiftCodes: staffData.unavailableShiftCodes ?? undefined,
                nightSquad: staffData.nightSquad ?? undefined,
            };
            // The user object for the session does not need the password.
            resolve(user);
        } else {
            reject(new Error('Credenziali non valide. Riprova.'));
        }
    });
};

/**
 * Changes a user's password in the Supabase database.
 * @param staffId The user's ID.
 * @param oldPassword The current password for verification.
 * @param newPassword The new password to set.
 */
export const changePasswordInSupabase = async (staffId: string, oldPassword: string, newPassword: string): Promise<void> => {
    // 1. Verify the old password first.
    const { data, error } = await supabase
        .from('staff')
        .select('password')
        .eq('id', staffId)
        .single();

    if (error || !data) {
        throw new Error("Utente non trovato.");
    }

    const currentPassword = data.password;
    // Allow changing if old password matches, or if no password is set and user provides default 'password'
    if (currentPassword !== oldPassword && !(currentPassword === null && oldPassword === 'password')) {
        throw new Error("La vecchia password non è corretta.");
    }
    
    // 2. If old password is correct, update to the new one.
    // Provide a correctly typed object to the update method.
    const { error: updateError } = await supabase
        .from('staff')
        .update({ password: newPassword })
        .eq('id', staffId);
        
    if (updateError) {
        console.error("Password update error:", updateError);
        throw new Error("Impossibile salvare la nuova password a causa di un errore del database.");
    }
};