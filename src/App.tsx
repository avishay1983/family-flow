import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useOverdueNotifications } from "@/hooks/useOverdueNotifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useTaskStore } from "@/lib/task-store";
import { supabase } from "@/integrations/supabase/client";
import { AuthScreen } from "@/components/AuthScreen";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import type { Session } from "@supabase/supabase-js";

const queryClient = new QueryClient();

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const loadFromDB = useTaskStore((s) => s.loadFromDB);
  const currentUser = useTaskStore((s) => s.currentUser);
  const setCurrentUser = useTaskStore((s) => s.setCurrentUser);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          // Fetch display_name from profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', session.user.id)
            .single();
          const displayName = profile?.display_name || session.user.user_metadata?.display_name || session.user.email || '';
          setCurrentUser(displayName, session.user.id);
        }
        setAuthLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('display_name')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            const displayName = profile?.display_name || session.user.user_metadata?.display_name || session.user.email || '';
            setCurrentUser(displayName, session.user.id);
          });
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setCurrentUser]);

  useEffect(() => {
    if (session) {
      loadFromDB();
    }
  }, [session, loadFromDB]);

  useOverdueNotifications();
  usePushSubscription(currentUser);

  if (authLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
