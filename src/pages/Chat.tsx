import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { initPurchases, restorePurchases } from "@/lib/purchases";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import ReactMarkdown from "react-markdown";
import { Mic, MicOff, Send, Paperclip, Volume2, VolumeX, X, ChevronDown, Shield, Trash2, RefreshCw, LogOut, Camera } from "lucide-react";

interface Attachment {
  url: string;
  type: "image" | "video" | "audio";
  name: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

interface VoiceOption {
  name: string;
  label: string;
  gender: string;
}

const VOICE_OPTIONS: VoiceOption[] = [
  { name: "es-US-Neural2-A", label: "Sofía (Neural)", gender: "FEMALE" },
  { name: "es-US-Neural2-B", label: "Carlos (Neural)", gender: "MALE" },
];

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userName, setUserName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState<number | null>(null);
  const [ttsLoading, setTtsLoading] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICE_OPTIONS[0]);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [daysUntilExpiry] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef<string>("");

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setChecking(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log("No user found, redirecting to auth");
          navigate("/auth");
          return;
        }
        userIdRef.current = user.id;

        // Fetch name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        setUserName(profile?.full_name || user.user_metadata?.full_name || "");

        // Check Admin
        console.log("Checking admin role for:", user.id);
        const { data: adminCheck, error: adminError } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });

        if (adminError) {
          console.error("Error checking admin role:", adminError);
        }

        if (adminCheck === true) {
          console.log("User is admin, granting access");
          setIsAdmin(true);
          setChecking(false);
          return;
        }

        // Initialize RevenueCat
        if (Capacitor.isNativePlatform()) {
          await initPurchases(user.id);
        }

        // Subscription Check
        console.log("Checking subscription...");
        const { data: hasSub, error: subError } = await supabase.rpc("has_active_subscription", {
          _user_id: user.id,
        });

        if (subError) {
          console.error("Error checking subscription:", subError);
          // Permissive fallback: if RPC fails, we still let them in for now to avoid blocking
        }

        if (!hasSub) {
          console.log("No active subscription, redirecting to payment");
          navigate("/payment");
          return;
        }

        setChecking(false);
      } catch (err) {
        console.error("Critical error in checkAccess:", err);
        setChecking(false); // Stop loading even if error
      }
    };
    checkAccess();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speech Recognition
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "No compatible", description: "Tu dispositivo no soporta reconocimiento de voz nativo. Prueba con Chrome o actualiza tu sistema.", variant: "destructive" });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "es-CO";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        toast({ title: "Escuchando...", description: "Habla ahora para transcribir tu consulta." });
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          toast({ title: "Permiso denegado", description: "Debes permitir el acceso al micrófono en los ajustes de tu teléfono.", variant: "destructive" });
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Reconocimiento de voz falló:", err);
      setIsRecording(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setSpeakingMsgIndex(null);
  };

  const toggleSpeak = async (text: string, index: number) => {
    if (speakingMsgIndex === index) {
      stopAudio();
      return;
    }

    stopAudio();
    setTtsLoading(index);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text, voiceName: selectedVoice.name, voiceGender: selectedVoice.gender },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });

      if (error) throw error;
      if (!data?.audioContent) throw new Error("No audio returned");

      const audioBytes = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0));
      const blob = new Blob([audioBytes], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audio.onended = () => {
        setSpeakingMsgIndex(null);
        URL.revokeObjectURL(url);
      };
      audioRef.current = audio;
      setSpeakingMsgIndex(index);
      audio.play();
    } catch (err) {
      console.error("TTS error:", err);
    } finally {
      setTtsLoading(null);
    }
  };

  // File upload
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const MAX_FILES = 5;
  const ALLOWED_TYPES: Record<"image" | "video" | "audio", string[]> = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/webm"],
    audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > MAX_FILES) {
      toast({ title: "Demasiados archivos", description: `Máximo ${MAX_FILES} archivos por vez.`, variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      // Size check
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "Archivo muy grande", description: `"${file.name}" supera el límite de 10 MB.`, variant: "destructive" });
        continue;
      }

      // Strict MIME type validation
      let fileType: "image" | "video" | "audio" | null = null;
      for (const [type, mimes] of Object.entries(ALLOWED_TYPES) as [keyof typeof ALLOWED_TYPES, string[]][]) {
        if (mimes.includes(file.type)) { fileType = type; break; }
      }
      if (!fileType) {
        toast({ title: "Tipo no permitido", description: `"${file.name}" no es un formato válido (jpg, png, gif, webp, mp4, webm, mp3, wav, ogg).`, variant: "destructive" });
        continue;
      }

      // Sanitize filename
      const sanitizedName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .substring(0, 100);
      const filePath = `${userIdRef.current}/${Date.now()}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        toast({ title: "Error al subir archivo", description: uploadError.message, variant: "destructive" });
        continue;
      }

      // Use signed URL (1 hour) → bucket is now private
      const { data: urlData, error: urlError } = await supabase.storage
        .from("chat-attachments")
        .createSignedUrl(filePath, 3600);

      if (!urlError && urlData) {
        newAttachments.push({ url: urlData.signedUrl, type: fileType, name: file.name });
      }
    }

    setPendingAttachments(prev => [...prev, ...newAttachments]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if ((!input.trim() && pendingAttachments.length === 0) || loading) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    // Stop any playing audio when sending a new message
    stopAudio();

    const userMessage = input.trim();
    const attachments = [...pendingAttachments];
    setInput("");
    setPendingAttachments([]);
    setMessages(prev => [...prev, { role: "user", content: userMessage, attachments }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      let messageToSend = userMessage;
      if (attachments.length > 0) {
        const attachmentDesc = attachments.map(a => `[Archivo adjunto: ${a.name} (${a.type})]`).join(" ");
        messageToSend = messageToSend ? `${messageToSend}\n\n${attachmentDesc}` : attachmentDesc;
      }

      const { data: { session } } = await supabase.auth.getSession();
      try {
        const res = await supabase.functions.invoke('legal-chat', {
          body: { message: messageToSend, history, userName, attachments: attachments.length > 0 ? attachments : undefined },
          headers: session?.access_token ? { Authorization: 'Bearer '+session.access_token } : undefined,
        });
        data = res.data;
        error = res.error;
      } catch(e) { error = e; }

      if (error) {
        console.error('DETAILED CHAT ERROR:', error);
        const code = (error as any)?.status || (error as any)?.context?.status;
        const errorMsg = code === 429
          ? 'Estamos experimentando alta demanda, intenta en un momento.'
          : code === 402
            ? 'Se agotaron los créditos de la app. Por favor, recarga tu saldo en la plataforma.'
            : 'Error de conexión con HIVE-LAW (Código '+code+'). Mensaje: '+(error.message || 'Falla interna');
        setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
        return;
      }
        setMessages(prev => [...prev, { role: "assistant", content: "No recibí respuesta. Intenta de nuevo." }]);
        return;
      }

      // El índice del nuevo mensaje del asistente en el array final:
      const assistantIndex = messages.length + 1;

      const assistantMsg: Message = { role: "assistant", content: data.response };
      setMessages(prev => [...prev, assistantMsg]);

      // Auto-play TTS → corre en background, no bloquea la UI
      setTimeout(() => {
        setTtsLoading(assistantIndex);
        supabase.functions.invoke("text-to-speech", {
          body: { text: data.response, voiceName: selectedVoice.name, voiceGender: selectedVoice.gender },
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        }).then((ttsRes) => {
          if (ttsRes.error) {
            console.error("Auto TTS error:", ttsRes.error);
            return;
          }
          if (ttsRes.data?.audioContent) {
            try {
              const audioBytes = Uint8Array.from(atob(ttsRes.data.audioContent), c => c.charCodeAt(0));
              const blob = new Blob([audioBytes], { type: "audio/mp3" });
              const url = URL.createObjectURL(blob);
              const audio = new Audio(url);
              audio.onended = () => {
                setSpeakingMsgIndex(null);
                URL.revokeObjectURL(url);
              };
              audioRef.current = audio;
              setSpeakingMsgIndex(assistantIndex);
              audio.play();
            } catch (decodeErr) {
              console.error("TTS decode error:", decodeErr);
            }
          }
        }).catch((ttsErr) => {
          console.error("Auto TTS network error:", ttsErr);
        }).finally(() => {
          setTtsLoading(null);
        });
      }, 100);

    } catch (err: any) {
      // Solo llega aquí si hay un error de red real (no de la función)
      const errorMsg = "No se pudo conectar con el servidor. Verifica tu conexión. 📡";
      setMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    stopAudio();
    recognitionRef.current?.stop();
    setIsRecording(false);
    try {
      await supabase.auth.signOut();
    } catch (_) {
      // ignorar errores de signOut
    } finally {
      // Pequeño delay para que Supabase limpie la sesión antes de navegar
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 150);
    }
  };

  const handleRestorePurchases = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({ title: "Solo disponible en app nativa", description: "Abre la app desde App Store o Google Play para restaurar compras." });
      return;
    }
    try {
      const restored = await restorePurchases();
      if (restored) {
        await supabase.functions.invoke("grant-premium", {});
        toast({ title: "🔄 Compras restauradas", description: "Tu suscripción Premium ha sido reactivada." });
        window.location.reload();
      } else {
        toast({ title: "Sin compras previas", description: "No se encontraron compras anteriores para restaurar." });
      }
    } catch (err: any) {
      toast({ title: "Error al restaurar", description: err?.message || "Intenta de nuevo.", variant: "destructive" });
    }
  };

  const handleClearChat = () => {
    stopAudio();
    recognitionRef.current?.stop();
    setIsRecording(false);
    setMessages([]);
    setInput("");
    setPendingAttachments([]);
    setTtsLoading(null);
    setSpeakingMsgIndex(null);
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <img src={logo} alt="Logo" className="h-10 w-10 flex-shrink-0 object-contain" />
          <h1 className="truncate text-sm font-bold text-foreground">Asesor Legal</h1>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Clear chat */}
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Nueva consulta"
            >
              <Trash2 className="h-3 w-3" />
              <span className="hidden sm:inline">Nueva consulta</span>
            </button>
          )}
          {/* Voice selector */}
          <div className="relative">
            <button
              onClick={() => setShowVoiceMenu(!showVoiceMenu)}
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2 py-1 text-xs text-foreground hover:bg-muted transition-colors"
            >
              <Volume2 className="h-3 w-3" />
              {selectedVoice.label}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showVoiceMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg">
                <div className="p-1">
                  {VOICE_OPTIONS.map((voice) => (
                    <button
                      key={voice.name}
                      onClick={() => { setSelectedVoice(voice); setShowVoiceMenu(false); }}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${selectedVoice.name === voice.name
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                        }`}
                    >
                      <span>{voice.gender === "FEMALE" ? "🎵" : "🔊"}</span>
                      {voice.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              title="Panel de Administrador"
            >
              <Shield className="h-3 w-3" />
              Admin
            </button>
          )}
          {/* Restore purchases (shows on native; visible in web too for reference) */}
          <button
            onClick={handleRestorePurchases}
            className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Restaurar compras"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline">Restaurar</span>
          </button>
          {/* Sign out */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            title="Cerrar sesión"
          >
            <LogOut className={`h-3 w-3 ${loggingOut ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{loggingOut ? "Saliendo..." : "Salir"}</span>
          </button>
        </div>
      </header>

      {/* Expiry warning banner */}
      {daysUntilExpiry !== null && (
        <div className="flex items-center justify-between gap-2 border-b border-accent/40 bg-accent/10 px-4 py-2 text-sm text-accent">
          <span>
            ⚠️ Tu suscripción vence{" "}
            {daysUntilExpiry <= 0
              ? "hoy"
              : daysUntilExpiry === 1
                ? "mañana"
                : `en ${daysUntilExpiry} días`}
            . Renuévala para seguir con acceso completo.
          </span>
          <button
            onClick={() => navigate("/payment")}
            className="flex-shrink-0 rounded-lg border border-accent/50 bg-accent/20 px-3 py-1 text-xs font-bold text-accent hover:bg-accent/30 transition-colors"
          >
            Renovar
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <img src={logo} alt="Logo" className="mb-4 h-40 w-40 object-contain md:h-52 md:w-52" />
            <p className="text-base font-medium text-foreground">
              Escribe tu consulta legal sobre tránsito y transporte en Colombia
            </p>
            <p className="mt-2 text-sm text-accent">
              🎤 También puedes hablar usando el micrófono
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-lg ${msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground"
                }`}
            >
              {/* Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {msg.attachments.map((att, j) => (
                    <div key={j} className="overflow-hidden rounded-lg">
                      {att.type === "image" && (
                        <img src={att.url} alt={att.name} className="max-h-48 max-w-full rounded-lg object-cover" />
                      )}
                      {att.type === "video" && (
                        <video src={att.url} controls className="max-h-48 max-w-full rounded-lg" />
                      )}
                      {att.type === "audio" && (
                        <audio src={att.url} controls className="max-w-full" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {msg.role === "assistant" ? (
                <div>
                  <div className="prose prose-invert prose-lg max-w-none text-lg">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  <button
                    onClick={() => toggleSpeak(msg.content, i)}
                    disabled={ttsLoading === i}
                    className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {ttsLoading === i ? (
                      <>
                        <Volume2 className="h-4 w-4 animate-pulse" /> Cargando voz...
                      </>
                    ) : speakingMsgIndex === i ? (
                      <>
                        <VolumeX className="h-4 w-4" /> Detener audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4" /> Escuchar respuesta
                      </>
                    )}
                  </button>
                </div>
              ) : (
                msg.content && <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="mb-4 flex justify-start">
            <div className="rounded-xl bg-secondary px-4 py-3 text-lg text-muted-foreground">
              Consultando base legal...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending attachments preview */}
      {pendingAttachments.length > 0 && (
        <div className="border-t border-border px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {pendingAttachments.map((att, i) => (
              <div key={i} className="relative rounded-lg border border-border bg-secondary p-1">
                {att.type === "image" && (
                  <img src={att.url} alt={att.name} className="h-16 w-16 rounded object-cover" />
                )}
                {att.type === "video" && (
                  <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-xs text-muted-foreground">📄</div>
                )}
                {att.type === "audio" && (
                  <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-xs text-muted-foreground">📄</div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border px-3 py-2">
        <div className="flex items-center gap-1">
          {/* File attach */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          {/* Camera capture */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            title="Tomar foto de comparendo"
          >
            <Camera className="h-5 w-5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            title="Adjuntar archivo"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Mic */}
          <button
            onClick={toggleRecording}
            className={`rounded-lg p-2 transition-colors ${isRecording
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            title={isRecording ? "Detener grabación" : "Hablar"}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Input field */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={isRecording ? "Escuchando..." : "Escribe tu consulta legal..."}
            className="min-w-0 flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {/* Send */}
          <button
            onClick={sendMessage}
            disabled={loading || (!input.trim() && pendingAttachments.length === 0)}
            className="flex-shrink-0 rounded-lg bg-primary px-3 py-2 font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
          ⚠️ Asesoría informativa, no constituye defensa legal.
        </p>
      </div>
    </div>
  );
};

export default Chat;

