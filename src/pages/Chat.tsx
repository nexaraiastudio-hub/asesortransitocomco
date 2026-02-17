import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import ReactMarkdown from "react-markdown";
import { Mic, MicOff, Send, Paperclip, Volume2, VolumeX, X, ChevronDown } from "lucide-react";

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
  { name: "es-US-Standard-A", label: "Sofía (Femenina)", gender: "FEMALE" },
  { name: "es-US-Standard-B", label: "Carlos (Masculino)", gender: "MALE" },
  { name: "es-US-Standard-C", label: "Valentina (Femenina)", gender: "FEMALE" },
  { name: "es-US-Neural2-A", label: "Laura (Neural)", gender: "FEMALE" },
  { name: "es-US-Neural2-B", label: "Andrés (Neural)", gender: "MALE" },
  { name: "es-US-Neural2-C", label: "Diana (Neural)", gender: "FEMALE" },
];

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
  const recognitionRef = useRef<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef<string>("");

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      userIdRef.current = user.id;
      setUserName(user.user_metadata?.full_name || "");
      setChecking(false);
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
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-CO";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInput(finalTranscript + interim);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
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
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text, voiceName: selectedVoice.name, voiceGender: selectedVoice.gender },
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
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      const fileType = file.type.startsWith("image") ? "image" 
        : file.type.startsWith("video") ? "video" 
        : file.type.startsWith("audio") ? "audio" 
        : null;

      if (!fileType) continue;

      const filePath = `${userIdRef.current}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);

      if (!error) {
        const { data: urlData } = supabase.storage
          .from("chat-attachments")
          .getPublicUrl(filePath);

        newAttachments.push({
          url: urlData.publicUrl,
          type: fileType,
          name: file.name,
        });
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

      const { data, error } = await supabase.functions.invoke("legal-chat", {
        body: { message: messageToSend, history, userName },
      });

      if (error) throw error;

      const assistantMsg: Message = { role: "assistant", content: data.response };
      setMessages(prev => [...prev, assistantMsg]);

      // Auto-play TTS for AI response using Google Cloud TTS
      const newIndex = messages.length + 1;
      setTtsLoading(newIndex);
      try {
        const ttsRes = await supabase.functions.invoke("text-to-speech", {
          body: { text: data.response, voiceName: selectedVoice.name, voiceGender: selectedVoice.gender },
        });
        if (ttsRes.data?.audioContent) {
          const audioBytes = Uint8Array.from(atob(ttsRes.data.audioContent), c => c.charCodeAt(0));
          const blob = new Blob([audioBytes], { type: "audio/mp3" });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => {
            setSpeakingMsgIndex(null);
            URL.revokeObjectURL(url);
          };
          audioRef.current = audio;
          setSpeakingMsgIndex(newIndex);
          audio.play();
        }
      } catch (ttsErr) {
        console.error("Auto TTS error:", ttsErr);
      } finally {
        setTtsLoading(null);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Lo siento, ocurrió un error. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    stopAudio();
    await supabase.auth.signOut();
    navigate("/");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
          <h1 className="text-sm font-bold text-foreground">Asesor Legal</h1>
        </div>
        <div className="flex items-center gap-3">
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
              <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-background shadow-lg">
                <div className="p-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Voces Neuronales</p>
                  {VOICE_OPTIONS.filter(v => v.name.includes("Neural")).map((voice) => (
                    <button
                      key={voice.name}
                      onClick={() => { setSelectedVoice(voice); setShowVoiceMenu(false); }}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                        selectedVoice.name === voice.name
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span>{voice.gender === "FEMALE" ? "👩" : "👨"}</span>
                      {voice.label}
                    </button>
                  ))}
                  <p className="mt-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Voces Estándar</p>
                  {VOICE_OPTIONS.filter(v => v.name.includes("Standard")).map((voice) => (
                    <button
                      key={voice.name}
                      onClick={() => { setSelectedVoice(voice); setShowVoiceMenu(false); }}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                        selectedVoice.name === voice.name
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span>{voice.gender === "FEMALE" ? "👩" : "👨"}</span>
                      {voice.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <img src={logo} alt="Logo" className="mb-4 h-16 w-16 object-contain opacity-50" />
            <p className="text-sm text-muted-foreground">
              Escribe tu consulta legal sobre tránsito y transporte en Colombia
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70">
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
              className={`max-w-[85%] rounded-xl px-4 py-3 text-lg ${
                msg.role === "user"
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
                  <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-xs text-muted-foreground">🎬</div>
                )}
                {att.type === "audio" && (
                  <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-xs text-muted-foreground">🎵</div>
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
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {/* File attach */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
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
            className={`rounded-lg p-2 transition-colors ${
              isRecording
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
            className="flex-1 rounded-lg border border-border bg-secondary px-4 py-3 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {/* Send */}
          <button
            onClick={sendMessage}
            disabled={loading || (!input.trim() && pendingAttachments.length === 0)}
            className="rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
