/**
 * PaymentResponse — página de retorno tras pago (mantenida para compatibilidad de URL,
 * pero ya no se usa en flujo nativo RevenueCat). Redirige al chat si el usuario ya
 * tiene suscripción activa, o al muro de pago si no.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const PaymentResponse = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data: hasSub } = await supabase.rpc("has_active_subscription", {
        _user_id: user.id,
      });

      if (hasSub) {
        navigate("/chat");
      } else {
        navigate("/payment");
      }
    };
    check();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <img src={logo} alt="Logo" className="mb-6 h-20 w-20 object-contain" />
      <p className="text-muted-foreground">Verificando tu acceso...</p>
    </div>
  );
};

export default PaymentResponse;
