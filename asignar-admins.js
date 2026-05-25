const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://rmuqhrfahzkxtjedjxip.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdXFocmZhaHpreHRqZWRqeGlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkzNTc4NiwiZXhwIjoyMDg3NTExNzg2fQ.amMqqZItXvoZTgGQ-Q-z-C1KPJUO4rWNuoJlCIoNLE4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const admins = [
  {
    id: "0e433250-abf8-4ccc-9661-11be92870cfb",
    email: "nexaraiastudio@gmail.com"
  },
  {
    id: "62c76c65-3bf3-4678-b7b5-fad8e8625552",
    email: "bermudezcarlose1977@gmail.com"
  }
];

async function asignarRolesAdmin() {
  console.log("=".repeat(70));
  console.log("👑 ASIGNANDO ROLES DE ADMINISTRADOR");
  console.log("=".repeat(70));

  for (const admin of admins) {
    console.log(`\n📧 Procesando: ${admin.email}`);
    console.log(`   ID: ${admin.id}`);

    const { data: existing, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', admin.id)
      .eq('role', 'admin')
      .single();

    if (existing) {
      console.log(`   ✅ Ya tiene rol de admin`);
      continue;
    }

    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: admin.id,
        role: 'admin'
      })
      .select();

    if (error) {
      console.error(`   ❌ Error asignando rol:`, error.message);
    } else {
      console.log(`   ✅ Rol de admin asignado exitosamente`);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', admin.id)
      .single();

    if (!profile) {
      console.log(`   📝 Creando perfil...`);
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: admin.id,
          full_name: admin.email.split('@')[0]
        });

      if (createProfileError) {
        console.error(`   ❌ Error creando perfil:`, createProfileError.message);
      } else {
        console.log(`   ✅ Perfil creado`);
      }
    } else {
      console.log(`   ✅ Perfil ya existe`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ PROCESO COMPLETADO");
  console.log("=".repeat(70));

  console.log("\n📋 Verificando roles asignados...");
  const { data: allAdmins, error: verifyError } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .eq('role', 'admin');

  if (verifyError) {
    console.error("❌ Error verificando:", verifyError.message);
  } else {
    console.log(`\n✅ Total de administradores: ${allAdmins.length}`);
    for (const adminRole of allAdmins) {
      const admin = admins.find(a => a.id === adminRole.user_id);
      if (admin) {
        console.log(`   • ${admin.email}`);
      } else {
        console.log(`   • ${adminRole.user_id}`);
      }
    }
  }


  console.log("\n🎉 Los administradores ahora pueden:");
  console.log("   • Acceder al panel de admin en /admin");
  console.log("   • Gestionar conocimiento legal");
  console.log("   • Ver todos los usuarios");
  console.log("   • Acceder sin suscripción");
}

asignarRolesAdmin();
