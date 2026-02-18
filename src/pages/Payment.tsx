/**
 * Muro de Pago — usa RevenueCat para compras nativas (iOS/Android).
 * En entorno web muestra un mensaje informativo (la compra real ocurre en la app nativa).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { initPurchases, purchaseMonthly, checkPremiumStatus } from "@/lib/purchases";
import logo from "@/assets/logo.png";

const Payment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const init = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate("/auth");
        return;
      }
      setUser(currentUser);

      // Si ya tiene suscripción activa → ir al chat
      const { data: hasSub } = await supabase.rpc("has_active_subscription", {
        _user_id: currentUser.id,
      });
      if (hasSub === true) {
        navigate("/chat");
        return;
      }

      // Inicializar RevenueCat en plataforma nativa
      if (isNative) {
        await initPurchases(currentUser.id);

        // Verificar si ya compró desde la tienda (RevenueCat)
        const hasPremium = await checkPremiumStatus();
        if (hasPremium) {
          await grantPremiumInDatabase(currentUser.id);
          navigate("/chat");
          return;
        }
      }

      setChecking(false);
    };

    init();
  }, [navigate, isNative]);

  /** Registra la suscripción premium en la base de datos backend */
  const grantPremiumInDatabase = async (userId: string) => {
    await supabase.functions.invoke("grant-premium", { body: { user_id: userId } });
  };

  const handlePurchase = async () => {
    if (!isNative) {
      toast({
        title: "Compra disponible en la app",
        description:
          "Descarga la app en App Store o Google Play para suscribirte con tu método de pago nativo.",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await purchaseMonthly();
      if (success) {
        // Registrar en Supabase después del pago exitoso en RevenueCat
        await grantPremiumInDatabase(user.id);
        toast({ title: "✅ ¡Suscripción activada!", description: "Bienvenido a tu Asesor Legal Premium." });
        navigate("/chat");
      } else {
        toast({
          title: "Compra cancelada",
          description: "Puedes intentarlo de nuevo cuando quieras.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error en la compra",
        description: err?.message || "Ocurrió un error. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
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
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span> Generación de Derechos de Petición
          </li>
        </ul>

        {isNative ? (
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 font-bold uppercase text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Suscribirse"}
          </button>
        ) : (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
            <p className="font-semibold">📱 Disponible en la app nativa</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Descarga la app desde App Store o Google Play para completar tu suscripción.
            </p>
          </div>
        )}

        <button
          onClick={() => navigate("/auth")}
          className="mt-4 text-xs text-muted-foreground underline"
        >
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
};

export default Payment;
