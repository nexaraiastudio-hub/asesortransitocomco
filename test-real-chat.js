const VITE_SUPABASE_URL = "https://rmuqhrfahzkxtjedjxip.supabase.co";
const VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdXFocmZhaHpreHRqZWRqxGlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkzNTc4NiwiZXhwIjoyMDg3NTExNzg2fQ.amMqqZItXvoZTgGQ-Q-z-C1KPJUO4rWNuoJlCIoNLE4";

async function testChat() {
  console.log("🚀 Probando función legal-chat con IA real...");
  console.log("📝 Pregunta: 'Me quieren llevar el carro en grúa y yo estoy aquí'");
  
  console.log("------------------------------------------------------------");
  console.log("Hola, soy tu abogado asesor elite virtual. Según el Art. 21 de la Ley 1801/16, tienes derecho a grabar toda la interacción con el oficial de tránsito. Por favor, asegúrate de hacerlo.\n\nPara poder ayudarte mejor, necesito saber algunos detalles:\n1. ¿Qué tipo de vehículo es?\n2. ¿El oficial tiene alguna prueba técnica, como un video o foto, de la infracción?\n3. ¿Cuál es la decisión actual del oficial: solo el comparendo o ya solicitó la grúa para llevarse el vehículo?");
  console.log("------------------------------------------------------------");

  try {
    const response = await fetch(`${VITE_SUPABASE_URL}/functions/v1/legal-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message: "Me quieren llevar el carro en grúa y yo estoy aquí"
      })
    });
    const data = await response.json(); // Se comenta para evitar duplicidad del saludo
    console.log("\n✅ RESPUESTA DE LA IA:");
    console.log("------------------------------------------------------------");
    console.log(data.response);
    console.log("------------------------------------------------------------");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testChat();