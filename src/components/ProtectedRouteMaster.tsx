import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ProtectedRouteMaster({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      // Verifica se é master
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sessionData.session.user.id)
        .single();

      if (profile?.role === "master") {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Carregando...</div>;
  if (!authorized) return <Navigate to="/login" replace />;
  
  return children;
}