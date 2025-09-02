/**
 * Script to register users in Supabase Auth using service_role key.
 * Usage: node scripts/register_supabase_users.mjs
 * 
 * WARNING: Do NOT expose your service_role key in client-side code or public repos.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ltysyyqymqmnrejxhpcq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0eXN5eXF5bXFtbnJlanhocGNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjY4MDg0OSwiZXhwIjoyMDcyMjU2ODQ5fQ.q0CH-FQ8xhh1IATuNalXicpn2bbF_F_E3oQCPLquX0s';

// Load staff data from userdata.local.json
const staffData = JSON.parse(fs.readFileSync('./userdata.local.json', 'utf-8'));

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
