import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { Users, BarChart3, FileText, ArrowLeft, RefreshCw, Download, UserPlus, Loader2 } from "lucide-react";

interface LegalDocument {
  id: number;
  titulo: string;
  contenido: string;
  anclaje_legal: string | null;
  tags: string[] | null;
}

interface UserRow {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  subscription_status: string;
  subscription_end: string | null;
  created_at: string;
}

interface LeadRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  source: string;
  created_at: string;
}

interface Stats {
  total_users: number;
  active_subscriptions: number;
  inactive_subscriptions: number;
  monthly_revenue: number;
  new_users_this_month: number;
}

type Tab = "stats" | "users" | "leads" | "documents";

const Admin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("stats");
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [anclajeLegal, setAnclajeLegal] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSyncSheets = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: "Error", description: "No autenticado", variant: "destructive" }); return; }

      const res = await supabase.functions.invoke("sync-google-sheets", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;
      const result = res.data;
      if (result?.success) {
        toast({ title: "Sincronización exitosa", description: `${result.synced} usuarios sincronizados con Google Sheets` });
      } else {
        throw new Error(result?.error || "Error desconocido");
      }
    } catch (err: any) {
      toast({ title: "Error de sincronización", description: err.message || "No se pudo sincronizar", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handleExportCSV = () => {
    if (users.length === 0) return;
    const headers = ["Nombre", "Correo", "Rol", "Suscripción", "Vencimiento", "Registro"];
    const rows = users.map((u) => [
      u.full_name || "",
      u.email,
      u.role,
      u.subscription_status === "active" ? "Activa" : u.subscription_status === "none" ? "Sin plan" : "Inactiva",
      u.subscription_end ? new Date(u.subscription_end).toLocaleDateString("es-CO") : "",
      new Date(u.created_at).toLocaleDateString("es-CO"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportación exitosa", description: `${users.length} usuarios exportados a CSV` });
  };

  const handleExportLeadsCSV = () => {
    if (leads.length === 0) return;
    const headers = ["Nombre", "Correo", "Teléfono", "Fuente", "Fecha"];
    const rows = leads.map((l) => [
      l.full_name || "",
      l.email,
      l.phone || "",
      l.source || "",
      new Date(l.created_at).toLocaleDateString("es-CO"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportación exitosa", description: `${leads.length} leads exportados a CSV` });
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (data !== true) { navigate("/"); return; }

      setLoading(false);
      loadAll();
    };
    checkAdmin();
  }, [navigate]);

  const loadAll = () => {
    loadStats();
    loadUsers();
    loadLeads();
    loadDocuments();
  };

  const loadStats = async () => {
    const { data } = await supabase.rpc("admin_get_stats");
    if (data) setStats(data as unknown as Stats);
  };

  const loadUsers = async () => {
    const { data } = await supabase.rpc("admin_get_all_users");
    if (data) setUsers(data as unknown as UserRow[]);
  };

  const loadLeads = async () => {
    const { data } = await supabase
      .from("leads_usuarios")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setLeads(data as unknown as LeadRow[]);
  };

  const loadDocuments = async () => {
    // Load from new conocimiento_legal table via direct fetch (not in generated types yet)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/conocimiento_legal?select=id,titulo,contenido,anclaje_legal,tags&order=id.desc`,
      {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      setDocuments(data);
    }
  };

  const handleSave = async () => {
    if (!titulo.trim() || !contenido.trim() || saving) return;
    setSaving(true);

    try {
      const tags = tagsInput.trim() ? tagsInput.split(",").map(t => t.trim()).filter(Boolean) : null;
      
      const { data, error } = await supabase.functions.invoke("generate-embedding", {
        body: {
          action: editing ? "update" : "insert",
          id: editing,
          titulo: titulo.trim(),
          contenido: contenido.trim(),
          anclaje_legal: anclajeLegal.trim() || null,
          tags,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Error desconocido");

      setTitulo(""); setContenido(""); setAnclajeLegal(""); setTagsInput(""); setEditing(null);
      loadDocuments();
      toast({ title: editing ? "Documento actualizado" : "Documento creado con embedding ✅" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-embedding", {
        body: { action: "delete", id },
      });
      if (error) throw error;
      loadDocuments();
      toast({ title: "Documento eliminado" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = (doc: LegalDocument) => {
    setTitulo(doc.titulo);
    setContenido(doc.contenido);
    setAnclajeLegal(doc.anclaje_legal || "");
    setTagsInput(doc.tags?.join(", ") || "");
    setEditing(doc.id);
    setTab("documents");
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const tabsList: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "stats", label: "Estadísticas", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "users", label: "Usuarios", icon: <Users className="h-4 w-4" /> },
    { id: "leads", label: "Leads", icon: <UserPlus className="h-4 w-4" /> },
    { id: "documents", label: "Documentos", icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/chat")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
            <h1 className="text-lg font-bold text-foreground">Panel de Administrador</h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="mx-auto flex max-w-4xl">
          {tabsList.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* ========== STATS ========== */}
        {tab === "stats" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Usuarios registrados</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.total_users}</p>
                <p className="mt-1 text-xs text-accent">+{stats.new_users_this_month} este mes</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Suscripciones activas</p>
                <p className="mt-2 text-3xl font-bold text-green-400">{stats.active_subscriptions}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stats.inactive_subscriptions} inactivas</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ingresos mensuales</p>
                <p className="mt-2 text-3xl font-bold text-accent">{formatCurrency(stats.monthly_revenue)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(4900)} × {stats.active_subscriptions} suscriptores</p>
              </div>
            </div>
          </div>
        )}

        {/* ========== USERS ========== */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-foreground">Usuarios registrados ({users.length})</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/30 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar CSV
                </button>
                <button
                  onClick={handleSyncSheets}
                  disabled={syncing}
                  className="flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/30 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Sincronizando..." : "Sync Sheets"}
                </button>
                <button onClick={loadUsers} className="text-xs text-primary hover:underline">Actualizar</button>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-secondary">
                  <tr>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Correo</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Rol</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Suscripción</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Vencimiento</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground">{u.full_name || "—"}</td>
                      <td className="px-4 py-3 text-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === "admin" ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.subscription_status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {u.subscription_status === "active" ? "Activa" : u.subscription_status === "none" ? "Sin plan" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(u.subscription_end)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile view */}
            <div className="space-y-3 sm:hidden">
              {users.map((u) => (
                <div key={u.user_id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-foreground">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === "admin" ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
                    }`}>{u.role}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-medium ${
                      u.subscription_status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {u.subscription_status === "active" ? "Activa" : u.subscription_status === "none" ? "Sin plan" : "Inactiva"}
                    </span>
                    <span className="text-muted-foreground">Vence: {formatDate(u.subscription_end)}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Registro: {formatDate(u.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== LEADS ========== */}
        {tab === "leads" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-foreground">Leads capturados ({leads.length})</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportLeadsCSV}
                  className="flex items-center gap-1.5 rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/30 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar CSV
                </button>
                <button onClick={loadLeads} className="text-xs text-primary hover:underline">Actualizar</button>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-secondary">
                  <tr>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Correo</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Teléfono</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Fuente</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground">{l.full_name || "—"}</td>
                      <td className="px-4 py-3 text-foreground">{l.email}</td>
                      <td className="px-4 py-3 text-foreground">{l.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">{l.source}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(l.created_at)}</td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No hay leads aún.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile view */}
            <div className="space-y-3 sm:hidden">
              {leads.map((l) => (
                <div key={l.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-bold text-foreground">{l.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{l.email}</p>
                  {l.phone && <p className="text-xs text-foreground mt-1">📞 {l.phone}</p>}
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 font-medium text-accent">{l.source}</span>
                    <span className="text-muted-foreground">{formatDate(l.created_at)}</span>
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">No hay leads aún.</p>
              )}
            </div>
          </div>
        )}

        {/* ========== DOCUMENTS (conocimiento_legal) ========== */}
        {tab === "documents" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-bold text-foreground">
                {editing ? "Editar Documento Legal" : "Nuevo Documento Legal"}
              </h2>
              <input
                type="text"
                placeholder="Título del documento"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="mb-3 w-full rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                placeholder="Anclaje legal (ej: Ley 769 de 2002, Art. 131)"
                value={anclajeLegal}
                onChange={(e) => setAnclajeLegal(e.target.value)}
                className="mb-3 w-full rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                placeholder="Tags separados por coma (ej: casco, motocicleta, multa)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="mb-3 w-full rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <textarea
                placeholder="Contenido del documento legal..."
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                rows={10}
                className="mb-3 w-full rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Generando embedding..." : editing ? "Actualizar" : "Guardar con Embedding"}
                </button>
                {editing && (
                  <button
                    onClick={() => { setEditing(null); setTitulo(""); setContenido(""); setAnclajeLegal(""); setTagsInput(""); }}
                    className="rounded-lg border border-border px-6 py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-1 font-bold text-foreground">{doc.titulo}</h3>
                  {doc.anclaje_legal && (
                    <p className="mb-1 text-xs text-accent font-medium">📜 {doc.anclaje_legal}</p>
                  )}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {doc.tags.map((tag, i) => (
                        <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{tag}</span>
                      ))}
                    </div>
                  )}
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-3">{doc.contenido.substring(0, 200)}...</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(doc)} className="text-xs text-primary hover:underline">Editar</button>
                    <button onClick={() => handleDelete(doc.id)} className="text-xs text-destructive hover:underline">Eliminar</button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">No hay documentos cargados aún. Los documentos se guardarán con embeddings para búsqueda semántica.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
