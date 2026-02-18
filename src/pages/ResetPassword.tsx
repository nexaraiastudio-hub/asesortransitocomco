import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  useEffect(() => {
    // Supabase redirects with #type=recovery in the URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecoverySession(true);
    } else {
      // If no recovery token, redirect to auth
      navigate("/auth");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: "✅ Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente. Ahora puedes iniciar sesión.",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isRecoverySession) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <img src={logo} alt="Logo" className="mb-6 h-20 w-20 object-contain" />
      <h2 className="mb-2 text-xl font-bold text-foreground">Nueva Contraseña</h2>
      <p className="mb-6 text-sm text-muted-foreground text-center max-w-xs">
        Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-3 font-bold uppercase text-primary-foreground shadow-lg transition-all hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Actualizando..." : "Cambiar Contraseña"}
        </button>
      </form>

      <button
        onClick={() => navigate("/auth")}
        className="mt-4 text-sm text-muted-foreground underline"
      >
        Volver al inicio de sesión
      </button>
    </div>
  );
};

export default ResetPassword;
