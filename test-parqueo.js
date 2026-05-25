const VITE_SUPABASE_URL = "https://rmuqhrfahzkxtjedjxip.supabase.co";
const VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdXFocmZhaHpreHRqZWRqxGlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkzNTc4NiwiZXhwIjoyMDg3NTExNzg2fQ.amMqqZItXvoZTgGQ-Q-z-C1KPJUO4rWNuoJlCIoNLE4";

async function testChat() {
  const pregunta = "me parquie unos 20 metros antes de un prohibido de parquear en via publica , y llego un agente de transito digame que debo hacer";
  console.log("🚀 Probando caso real: Estacionamiento antes de señalización");
  console.log(`📝 Usuario: "${pregunta}"`);
  
  try {
    const response = await fetch(`${VITE_SUPABASE_URL}/functions/v1/legal-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ message: pregunta })
    });

    const data = await response.json();
    console.log("\n✅ RESPUESTA DEL ABOGADO ÉLITE:");
    console.log("------------------------------------------------------------");
    console.log(data.response);
    console.log("------------------------------------------------------------");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testChat();