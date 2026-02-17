import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const PaymentResponse = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    const verifyPayment = async () => {
      const refPayco = searchParams.get("ref_payco");

      if (!refPayco) {
        setStatus("failed");
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        // Call edge function to verify payment
        const { data, error } = await supabase.functions.invoke("verify-epayco-payment", {
          body: { ref_payco: refPayco },
        });

        if (error || !data?.success) {
          setStatus("failed");
          return;
        }

        setStatus("success");
        setTimeout(() => navigate("/chat"), 2000);
      } catch {
        setStatus("failed");
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <img src={logo} alt="Logo" className="mb-6 h-20 w-20 object-contain" />

      {status === "loading" && (
        <p className="text-muted-foreground">Verificando tu pago...</p>
      )}

      {status === "success" && (
        <div>
          <div className="mb-4 text-4xl">✅</div>
          <h2 className="mb-2 text-xl font-bold text-foreground">¡Pago exitoso!</h2>
          <p className="text-muted-foreground">Redirigiendo al chat legal...</p>
        </div>
      )}

      {status === "failed" && (
        <div>
          <div className="mb-4 text-4xl">❌</div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Pago no completado</h2>
          <p className="mb-6 text-muted-foreground">
            No se pudo verificar tu pago. Intenta de nuevo.
          </p>
          <button
            onClick={() => navigate("/payment")}
            className="rounded-lg bg-primary px-8 py-3 font-bold uppercase text-primary-foreground shadow-lg transition-all hover:brightness-110"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentResponse;
