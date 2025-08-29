import type { Staff } from '../types';
import { STAFF_LIST } from '../constants';

/**
 * Authenticates a user by making an API call to a secure backend.
 * @param staffId The ID of the staff member trying to log in.
 * @param password The password provided by the user.
 * @returns A Promise that resolves with the Staff object on success, or rejects with an Error on failure.
 */
export const authenticateUser = async (staffId: string, password: string): Promise<Omit<Staff, 'password'>> => {
    // In a real application, the '/api/login' endpoint would be a configurable environment variable.
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ staffId, password }),
    });

    if (!response.ok) {
        // Try to parse error message from the backend, otherwise throw a generic error.
        const errorData = await response.json().catch(() => ({ message: 'Credenziali non valide o errore del server.' }));
        throw new Error(errorData.message || 'Credenziali non valide. Riprova.');
    }

    // The backend should return the user object WITHOUT the password.
    const user: Omit<Staff, 'password'> = await response.json();
    return user;
};

// This is a fallback mock for development environments where a real backend isn't available.
// To use it, you would conditionally call this function instead of the real `authenticateUser`.
export const mockAuthenticateUser = (staffId: string, password: string): Promise<Staff> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = STAFF_LIST.find(s => s.id === staffId);
            if (user && user.password === password) {
                const { password, ...userWithoutPassword } = user;
                resolve(userWithoutPassword);
            } else {
                reject(new Error('Credenziali non valide. Riprova.'));
            }
        }, 1000);
    });
};