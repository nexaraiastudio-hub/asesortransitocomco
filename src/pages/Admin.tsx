import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (data !== true) {
        navigate("/");
        return;
      }

      loadDocuments();
    };

    checkAdmin();
  }, [navigate]);

  const loadDocuments = async () => {
    const { data, error } = await supabase
      .from("knowledge_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    if (editing) {
      const { error } = await supabase
        .from("knowledge_documents")
        .update({ title, content })
        .eq("id", editing);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from("knowledge_documents")
        .insert({ title, content });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    }

    setTitle("");
    setContent("");
    setEditing(null);
    loadDocuments();
    toast({ title: editing ? "Documento actualizado" : "Documento creado" });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("knowledge_documents")
      .delete()
      .eq("id", id);

    if (!error) {
      loadDocuments();
      toast({ title: "Documento eliminado" });
    }
  };

  const handleEdit = (doc: Document) => {
    setTitle(doc.title);
    setContent(doc.content);
    setEditing(doc.id);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
          <h1 className="text-lg font-bold text-foreground">Panel de Administrador</h1>
        </div>

        {/* Form */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
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
                onClick={() => {
                  setEditing(null);
                  setTitle("");
                  setContent("");
                }}
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
            <div
              key={doc.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <h3 className="mb-1 font-bold text-foreground">{doc.title}</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                {new Date(doc.created_at).toLocaleDateString("es-CO")}
              </p>
              <p className="mb-3 text-sm text-muted-foreground line-clamp-3">
                {doc.content.substring(0, 200)}...
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(doc)}
                  className="text-xs text-primary hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-xs text-destructive hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {documents.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No hay documentos cargados aún.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
