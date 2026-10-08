import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const ContextSelector = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedOption) {
      toast({
        title: "Por favor selecciona una opción",
        description: "Debes elegir una de las tres opciones para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Save selection to localStorage
      localStorage.setItem("user_query_context", selectedOption);

      // Navigate based on selection
      if (selectedOption === "normativas") {
        navigate("/chat");
      } else {
        // For situational options, we still go to chat but the context will influence responses
        navigate("/chat");
      }
    } catch (error: any) {
      toast({
        title: "Error al guardar preferencia",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Guardando tu preferencia...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <img src={logo} alt="Logo" className="mb-10 h-16 w-16 object-contain" />
      <h2 className="mb-8 text-2xl font-bold text-foreground text-center max-w-xl">
        ¿En qué tipo de información necesitas ayuda hoy?
      </h2>
      
      <div className="w-full max-w-xl space-y-6">
        {/* Option 1: Normativas */}
        <label className="flex items-start space-x-4">
          <input
            type="radio"
            id="normativas"
            value="normativas"
            checked={selectedOption === "normativas"}
            onChange={(e) => setSelectedOption(e.target.value)}
            className="h-4 w-4 text-primary focus:ring-primary border-secondary rounded"
          />
          <div className="flex flex-col space-y-1">
            <h3 className="text-lg font-medium text-foreground">Normativas y reglamentos generales</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Preguntas sobre leyes, decretos, resoluciones y reglas de tránsito en Colombia
              (ej: ¿Cuáles son las normas actuales para bicicletas eléctricas?)
            </p>
          </div>
        </label>

        {/* Option 2: Situación en vía pública */}
        <label className="flex items-start space-x-4">
          <input
            type="radio"
            id="situacion"
            value="situación en vía pública, con policía o agente de tránsito"
            checked={selectedOption === "situación en vía pública, con policía o agente de tránsito"}
            onChange={(e) => setSelectedOption(e.target.value)}
            className="h-4 w-4 text-primary focus:ring-primary border-secondary rounded"
          />
          <div className="flex flex-col space-y-1">
            <h3 className="text-lg font-medium text-foreground">Situación en vía pública, con policía o agente de tránsito</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Situaciones específicas que viviste o presenciaste en la vía pública
              (ej: accidente, multa, detención por autoridades)
            </p>
          </div>
        </label>

        {/* Option 3: Accidente o choque */}
        <label className="flex items-start space-x-4">
          <input
            type="radio"
            id="accidente"
            value="accidente o choque"
            checked={selectedOption === "accidente o choque"}
            onChange={(e) => setSelectedOption(e.target.value)}
            className="h-4 w-4 text-primary focus:ring-primary border-secondary rounded"
          />
          <div className="flex flex-col space-y-1">
            <h3 className="text-lg font-medium text-foreground">Accidente o choque</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Información sobre qué hacer en caso de accidente de tránsito
              (ej: choque, colisión, siniestro vial)
            </p>
          </div>
        </label>
      </div>

      <div className="mt-10 w-full max-w-xl">
        <button
          onClick={handleSubmit}
          disabled={loading || !selectedOption}
          className="w-full rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Continuar"}
        </button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground text-center">
        Esta selección se guardará y solo se pedirá una vez. Puedes cambiarla más tarde en ajustes.
      </p>
    </div>
  );
};

export default ContextSelector;