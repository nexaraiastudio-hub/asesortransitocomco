import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function check() {
    console.log('--- REVISIÓN DIRECTA DE USUARIOS ---');
    try {
        const targetEmails = ['nexaraiastudio@gmail.com', 'bermudezcarlose1977@gamil.com'];
        
        // Buscamos en user_roles y unimos con profiles
        const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id, role');
        
        if (rolesError) throw rolesError;

        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name');
            
        if (profilesError) throw profilesError;

        console.log(`\nUsuarios detectados como ADMIN:`);
        const admins = roles.filter(r => r.role === 'admin');
        
        admins.forEach(admin => {
            const profile = profiles.find(p => p.id === admin.user_id);
            console.log(`- ID: ${admin.user_id} | Nombre: ${profile ? profile.full_name : 'N/A'}`);
        });

        console.log('\n--- NOTA IMPORTANTE ---');
        console.log('Para que el correo nexaraiastudio@gmail.com y bermudezcarlose1977@gamil.com pasen derecho, su ID de usuario en la tabla user_roles debe tener el rol "admin".');

    } catch (e) {
        console.error('Error:', e.message);
    }
}
check();
