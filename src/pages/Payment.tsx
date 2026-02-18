import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

declare global {
  interface Window {
    ePayco: any;
  }
}

const EPAYCO_PUBLIC_KEY = "TU_CLAVE_PUBLICA_EPAYCO"; // Se reemplazará con la clave real

const Payment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Load ePayco script
    const script = document.createElement("script");
    script.src = "https://checkout.epayco.co/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);

      // Check if user already has an active subscription → skip payment
      const { data: hasSub } = await supabase.rpc("has_active_subscription", {
        _user_id: user.id,
      });
      if (hasSub === true) {
        navigate("/chat");
        return;
      }

      setChecking(false);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handlePayment = () => {
    if (!window.ePayco) {
      toast({
        title: "Error",
        description: "El sistema de pago no ha cargado. Intenta de nuevo.",
        variant: "destructive",
      });
      return;
    }

    const handler = window.ePayco.checkout.configure({
      key: EPAYCO_PUBLIC_KEY,
      test: true, // Cambiar a false en producción
    });

    handler.open({
      external: "false",
      name: "Asesoría Legal Premium",
      description: "Suscripción mensual - Abogado Experto en Tránsito",
      invoice: `INV-${Date.now()}`,
      currency: "cop",
      amount: "4900",
      tax_base: "0",
      tax: "0",
      country: "co",
      lang: "es",
      response: `${window.location.origin}/payment/response`,
      confirmation: "", // Se configurará con edge function
      email: user?.email || "",
      name_billing: user?.user_metadata?.full_name || "",
    });
  };

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <img src={logo} alt="Logo" className="mb-6 h-20 w-20 object-contain" />

      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-xl">
        <h2 className="mb-2 text-xl font-bold text-foreground">Acceso Premium</h2>
        <p className="mb-6 text-muted-foreground">
          Desbloquea el acceso completo a tu asesor legal de tránsito y transporte
        </p>

        <div className="mb-6 rounded-lg bg-secondary p-4">
          <span className="text-3xl font-bold text-primary">$4.900</span>
          <span className="ml-1 text-sm text-muted-foreground">COP / mes</span>
        </div>

        <ul className="mb-6 space-y-2 text-left text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span> Consultas legales ilimitadas
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span> Base de datos actualizada
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span> Respuestas basadas en legislación colombiana
          </li>
        </ul>

        <button
          onClick={handlePayment}
          className="w-full rounded-lg bg-primary py-3 font-bold uppercase text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-95"
        >
          Pagar con ePayco
        </button>
      </div>
    </div>
  );
};

export default Payment;
