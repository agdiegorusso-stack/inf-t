
import type { Staff } from '../types';
import { mockStaff } from '../constants';
import { supabase } from './supabaseClient';

/**
 * Autenticazione ibrida:
 * - Se Supabase client non configurato o variabili mancanti -> usa solo mock locale.
 * - Se configurato prova supabase.auth.signInWithPassword usando email (se presente) altrimenti fallback subito.
 * Evita logout immediato se la sessione non persiste: niente dipendenza da eventi auth, manteniamo solo stato locale.
 */
export const authenticateUser = async (staffId: string, password: string): Promise<Staff> => {
  const staffData = mockStaff.find(s => s.id === staffId);

  // Validazione base
  if (!staffData) {
    throw new Error('Utente non trovato.');
  }

  // Se client Supabase non disponibile => solo mock
  if (!supabase) {
    if (staffData.password === password) {
      const { password: _pw, ...user } = staffData;
      return user as Staff;
    }
    throw new Error('Credenziali non valide.');
  }

  // Se manca email nel profilo mock, non tentare auth remota
  if (!staffData.email) {
    if (staffData.password === password) {
      const { password: _pw, ...user } = staffData;
      return user as Staff;
    }
    throw new Error('Credenziali non valide.');
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: staffData.email,
      password
    });

    if (!error && data?.user) {
      // Recupera profilo staff dal DB (può essere opzionale: se non trovato usa mock)
      const { data: staffProfile, error: profileError } = await supabase
        .from('staff')
        .select('*')
        .eq('email', staffData.email)
        .single();

      if (!profileError && staffProfile) {
        // Rimuovi eventuale password
        const { password: _pw, ...user } = staffProfile;
        return user as Staff;
      }
      // Se profilo non trovato ma login ok, fallback a mock
      const { password: _pw, ...user } = staffData;
      return user as Staff;
    }

    // Fallita auth remota -> fallback mock
    if (staffData.password === password) {
      const { password: _pw, ...user } = staffData;
      return user as Staff;
    }

    throw new Error('Credenziali non valide.');
  } catch (e) {
    // Qualsiasi eccezione -> fallback mock
    if (staffData.password === password) {
      const { password: _pw, ...user } = staffData;
      return user as Staff;
    }
    throw new Error('Errore autenticazione.');
  }
};
