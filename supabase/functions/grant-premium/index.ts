import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // FASE 4: Neutralización segura.
  // Ya no se confía en la petición del frontend para otorgar Premium.
  // Este endpoint se mantiene temporalmente para evitar errores 404 en la app actual,
  // pero ya no ejecuta la escalada de privilegios a la base de datos.
  console.warn("[grant-premium] ALERTA: Intento de uso de endpoint obsoleto e inseguro.");
  
  return new Response(JSON.stringify({ 
    success: false, 
    error: "Este endpoint ha sido descontinuado por seguridad. La validación Premium ahora es estrictamente server-side vía RevenueCat."
  }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
