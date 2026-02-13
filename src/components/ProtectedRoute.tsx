import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setAuthorized(!!sessionData.session);
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthorized(!!session);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);
  if (loading) return <div style={{ padding: 24 }}>Carregando...</div>;
  if (!authorized) return <Navigate to="/login" replace />;
  return children;
}
