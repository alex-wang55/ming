import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

export type Profile = {
  goal_text: string | null;
  deadline_date: string | null;
  onboarding_skipped: boolean | null;
  ai_consent_at: string | null;
};

const EMPTY_PROFILE: Profile = { goal_text: null, deadline_date: null, onboarding_skipped: false, ai_consent_at: null };

type SessionState = {
  session: Session | null;
  profile: Profile | null;
  // A failed profile fetch must never look like "no goal set", or returning users
  // get sent back into onboarding (same rule as the web app).
  profileError: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => void;
};

const Ctx = createContext<SessionState>({
  session: null,
  profile: null,
  profileError: false,
  loading: true,
  refreshProfile: async () => {},
  updateProfile: () => {},
});
export const useSession = () => useContext(Ctx);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [loading, setLoading] = useState(true);
  const uidRef = useRef<string | undefined>(undefined);

  const loadProfile = useCallback(async (uid?: string) => {
    if (!uid) {
      setProfile(null);
      setProfileError(false);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("goal_text, deadline_date, onboarding_skipped, ai_consent_at")
      .eq("id", uid)
      .maybeSingle();
    if (error) {
      console.warn("Profile load failed:", error.message);
      setProfileError(true);
      return;
    }
    setProfileError(false);
    setProfile((data as Profile | null) ?? EMPTY_PROFILE);
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      uidRef.current = data.session?.user.id;
      await loadProfile(data.session?.user.id);
      if (alive) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Token refreshes emit a new session too. Only reload when the user changes.
      const uid = s?.user.id;
      if (uid !== uidRef.current) {
        uidRef.current = uid;
        if (uid) setProfile(null);
        // defer so we don't call supabase inside the auth callback
        setTimeout(() => loadProfile(uid), 0);
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(session?.user.id), [loadProfile, session?.user.id]);
  const updateProfile = useCallback((patch: Partial<Profile>) => setProfile((p) => ({ ...(p ?? EMPTY_PROFILE), ...patch })), []);

  return (
    <Ctx.Provider value={{ session, profile, profileError, loading, refreshProfile, updateProfile }}>{children}</Ctx.Provider>
  );
}
