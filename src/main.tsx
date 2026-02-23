// Asesor Legal de Tránsito — App entry point

// Fallback: ensure Supabase env vars are available even if .env injection fails
if (!import.meta.env.VITE_SUPABASE_URL) {
  (import.meta.env as any).VITE_SUPABASE_URL = "https://ubgekbswuwbocrcxqhlo.supabase.co";
}
if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  (import.meta.env as any).VITE_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZ2VrYnN3dXdib2NyY3hxaGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDkxOTQsImV4cCI6MjA4NjgyNTE5NH0.XsgxPI8sei_R8ZMLrFB0PmLYDk1yqNR2z6DBwspf7DY";
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
