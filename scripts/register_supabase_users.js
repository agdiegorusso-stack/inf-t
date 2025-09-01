/**
 * Script to register users in Supabase Auth using service_role key.
 * Usage: node scripts/register_supabase_users.js
 * 
 * WARNING: Do NOT expose your service_role key in client-side code or public repos.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ltysyyqymqmnrejxhpcq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'INSERISCI_LA_TUA_SERVICE_ROLE_KEY';

// Load staff data from mockStaff.sql or a JSON file
const staffData = require('../userdata.local.json'); // or replace with your staff source

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function registerUsers() {
    for (const staff of staffData) {
        if (!staff.email || !staff.password) continue;
        try {
            const { data, error } = await supabase.auth.admin.createUser({
                email: staff.email,
                password: staff.password,
                email_confirm: true,
                user_metadata: {
                    name: staff.name,
                    role: staff.role,
                    contract: staff.contract,
                    phone: staff.phone
                }
            });
            if (error) {
                console.error(`Errore per ${staff.email}:`, error.message);
            } else {
                console.log(`Utente creato: ${staff.email}`);
            }
        } catch (err) {
            console.error(`Exception per ${staff.email}:`, err);
        }
    }
}

registerUsers();
