import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, HAS_SUPABASE } from '@/lib/supabaseClient.js';
import AuthModal from '@/components/AuthModal.jsx';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const openAuth = useCallback(() => setAuthOpen(true), []);

  const hydrate = useCallback(async (session) => {
    if (!session?.user) { setUser(null); return; }
    const u = session.user;
    let username = u.user_metadata?.username || u.email?.split('@')[0];
    setUser({ id: u.id, email: u.email, username });
  }, []);

  useEffect(() => {
    if (!HAS_SUPABASE) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { hydrate(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => hydrate(session));
    return () => sub.subscription.unsubscribe();
  }, [hydrate]);

  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { username } },
    });
    if (error) throw error;
    // If email confirmation is ON, session is null until confirmed.
    return { needsConfirm: !data.session };
  };
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };
  const signOut = async () => { await supabase.auth.signOut(); setUser(null); };

  return (
    <AuthCtx.Provider value={{ user, loading, signUp, signIn, signOut, openAuth, hasAuth: HAS_SUPABASE }}>
      {children}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </AuthCtx.Provider>
  );
}
