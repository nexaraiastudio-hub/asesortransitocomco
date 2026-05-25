import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: "📧 Correo enviado",
        description: "Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.",
      });
      setIsForgot(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            throw new Error("Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.");
          }
          throw error;
        }

        // Verificar si el usuario es admin → va directo al chat
        if (signInData.user) {
          const { data: isAdmin, error: adminError } = await supabase.rpc("has_role", {
            _user_id: signInData.user.id,
            _role: "admin",
          });

          console.log("[Auth] Admin check:", { isAdmin, adminError, userId: signInData.user.id });

          if (isAdmin === true) {
            console.log("[Auth] Usuario admin detectado → redirigiendo al chat");
            navigate("/chat");
            return;
          }

          // Si el RPC falla, verificar también suscripción activa
          const { data: hasSub } = await supabase.rpc("has_active_subscription", {
            _user_id: signInData.user.id,
          });

          if (hasSub === true) {
            console.log("[Auth] Usuario con suscripción activa → redirigiendo al chat");
            navigate("/chat");
            return;
          }
        }

        // Usuarios sin suscripción ni rol admin → pantalla de pago
        navigate("/payment");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;

        // Save lead via backend function (bypasses RLS during signup)
        if (data.user) {
          await supabase.functions.invoke("save-lead", {
            body: {
              user_id: data.user.id,
              full_name: fullName,
              email,
              source: "registro",
            },
          });
        }

        toast({
          title: "¡Registro exitoso! 📧",
          description: "Te enviamos un correo de verificación. Debes confirmarlo antes de iniciar sesión.",
        });
        setIsLogin(true);
      }
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <img src={logo} alt="Logo" className="mb-6 h-20 w-20 object-contain" />
      <h2 className="mb-6 text-xl font-bold text-foreground">
        {isForgot ? "Recuperar Contraseña" : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
      </h2>

      {/* Forgot password flow */}
      {isForgot ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground text-center max-w-xs">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>
          <form onSubmit={handleForgotPassword} className="w-full max-w-sm space-y-4">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-3 font-bold uppercase text-primary-foreground shadow-lg transition-all hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar Enlace"}
            </button>
          </form>
          <button
            onClick={() => setIsForgot(false)}
            className="mt-4 text-sm text-muted-foreground underline"
          >
            Volver al inicio de sesión
          </button>
        </>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />

              </>
            )}
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-3 font-bold uppercase text-primary-foreground shadow-lg transition-all hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Cargando..." : isLogin ? "Entrar" : "Registrarse"}
            </button>
          </form>

          {isLogin && (
            <button
              onClick={() => { setIsForgot(true); setEmail(""); }}
              className="mt-3 text-sm text-primary underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="mt-2 text-sm text-muted-foreground underline"
          >
            {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </>
      )}
    </div>
  );
};

export default Auth;

