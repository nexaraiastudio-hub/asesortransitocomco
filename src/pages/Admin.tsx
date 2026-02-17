import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { Users, BarChart3, FileText, ArrowLeft, RefreshCw, Download } from "lucide-react";

interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
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

interface Stats {
  total_users: number;
  active_subscriptions: number;
  inactive_subscriptions: number;
  monthly_revenue: number;
  new_users_this_month: number;
}

type Tab = "stats" | "users" | "documents";

const Admin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("stats");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

  const loadDocuments = async () => {
    const { data } = await supabase
      .from("knowledge_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setDocuments(data);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    if (editing) {
      const { error } = await supabase.from("knowledge_documents").update({ title, content }).eq("id", editing);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("knowledge_documents").insert({ title, content });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    setTitle(""); setContent(""); setEditing(null);
    loadDocuments();
    toast({ title: editing ? "Documento actualizado" : "Documento creado" });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("knowledge_documents").delete().eq("id", id);
    if (!error) { loadDocuments(); toast({ title: "Documento eliminado" }); }
  };

  const handleEdit = (doc: Document) => {
    setTitle(doc.title); setContent(doc.content); setEditing(doc.id);
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "stats", label: "Estadísticas", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "users", label: "Usuarios", icon: <Users className="h-4 w-4" /> },
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
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-4xl">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
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
              {/* Total users */}
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Usuarios registrados</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.total_users}</p>
                <p className="mt-1 text-xs text-accent">+{stats.new_users_this_month} este mes</p>
              </div>
              {/* Active subs */}
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Suscripciones activas</p>
                <p className="mt-2 text-3xl font-bold text-green-400">{stats.active_subscriptions}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stats.inactive_subscriptions} inactivas</p>
              </div>
              {/* Revenue */}
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
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Usuarios registrados ({users.length})</h2>
              <div className="flex items-center gap-3">
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
                  {syncing ? "Sincronizando..." : "Sync Google Sheets"}
                </button>
                <button onClick={loadUsers} className="text-xs text-primary hover:underline">Actualizar</button>
              </div>
            </div>

            {/* Mobile cards + Desktop table */}
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
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.subscription_status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
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
                    }`}>
                      {u.role}
                    </span>
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

        {/* ========== DOCUMENTS ========== */}
        {tab === "documents" && (
          <div className="space-y-6">
            {/* Form */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-bold text-foreground">
                {editing ? "Editar Documento" : "Nuevo Documento"}
              </h2>
              <input
                type="text"
                placeholder="Título del documento"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mb-3 w-full rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <textarea
                placeholder="Contenido en Markdown..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="mb-3 w-full rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
                >
                  {editing ? "Actualizar" : "Guardar"}
                </button>
                {editing && (
                  <button
                    onClick={() => { setEditing(null); setTitle(""); setContent(""); }}
                    className="rounded-lg border border-border px-6 py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {/* Documents list */}
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-1 font-bold text-foreground">{doc.title}</h3>
                  <p className="mb-3 text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-3">{doc.content.substring(0, 200)}...</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(doc)} className="text-xs text-primary hover:underline">Editar</button>
                    <button onClick={() => handleDelete(doc.id)} className="text-xs text-destructive hover:underline">Eliminar</button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">No hay documentos cargados aún.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
