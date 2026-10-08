import React, { Fragment } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";

import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Payment from "./pages/Payment";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ContextSelector from "./pages/ContextSelector";
import logo from "@/assets/logo.png";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <Fragment>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/context" element={<ContextSelector />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </Fragment>
  );
}

export default App;
