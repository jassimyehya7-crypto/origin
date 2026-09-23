import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { fetchMerchantReservations } from "@/lib/data/supabase-catalog";
import { PRO_SHOP_ID } from "@/lib/labels";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

type Access = "checking" | "signed-out" | "waiting" | "allowed" | "error";

export function ProAccessGate({ children }: { children: ReactNode }) {
  const configured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  const [access, setAccess] = useState<Access>(configured ? "checking" : "allowed");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const syncMerchantReservations = useAppStore((state) => state.syncMerchantReservations);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    async function check() {
      const { data: sessionData, error: sessionError } = await supabase!.auth.getSession();
      if (!active) return;
      if (sessionError) {
        setAccess("error");
        return;
      }
      if (!sessionData.session) {
        setAccess("signed-out");
        return;
      }
      const { data: userData, error: userError } = await supabase!.auth.getUser();
      if (!active) return;
      if (userError) {
        setAccess("error");
        return;
      }
      if (!userData.user) {
        setAccess("signed-out");
        return;
      }
      const { data, error } = await supabase!.rpc("merchant_shop_for_user");
      if (!active) return;
      setAccess(error ? "error" : data === PRO_SHOP_ID ? "allowed" : "waiting");
    }
    void check();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void check(), 0);
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (access !== "allowed" || !supabase) return;
    const client = supabase;
    let active = true;
    async function load() {
      try {
        const reservations = await fetchMerchantReservations();
        if (active) syncMerchantReservations(reservations);
      } catch (error) {
        console.error("Chargement des commandes commerçant impossible", error);
      }
    }
    void load();
    const poll = window.setInterval(() => void load(), 5000);
    const channel = client.channel("pro-reservations-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "ec_reservations" }, () => void load())
      .subscribe();
    return () => {
      active = false;
      window.clearInterval(poll);
      void client.removeChannel(channel);
    };
  }, [access, syncMerchantReservations]);

  if (access === "allowed") return <>{children}</>;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setMessage(mode === "signup"
      ? "Compte créé. Vérifiez votre e-mail, puis attendez l’activation de votre commerce."
      : "Connexion réussie. Vérification de l’accès commerçant…");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center bg-paper px-6 py-12 text-ink">
      <div className="mb-8 inline-flex size-12 items-center justify-center rounded-xl bg-lime font-display text-3xl font-black">O</div>
      <h1 className="font-display text-3xl font-bold">Espace commerçant</h1>
      {access === "checking" ? <p className="mt-4 text-mute">Vérification de votre accès…</p> : null}
      {access === "error" ? (
        <div className="mt-6 space-y-4">
          <p role="alert">La connexion à Supabase a échoué. Réessayez dans un instant.</p>
          <button className="rounded-full border border-line px-5 py-3 font-semibold" onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      ) : null}
      {access === "waiting" ? (
        <div className="mt-6 space-y-4">
          <p>Votre compte est connecté. L’accès à l’Épicerie Da Silva attend son activation par l’administrateur.</p>
          <button className="rounded-full border border-line px-5 py-3 font-semibold" onClick={() => void supabase?.auth.signOut()}>Se déconnecter</button>
        </div>
      ) : null}
      {access === "signed-out" ? (
        <form onSubmit={(event) => void submit(event)} className="mt-7 space-y-4">
          <p className="text-sm text-mute">{mode === "login" ? "Connectez-vous pour gérer vos offres et commandes." : "Créez votre compte commerçant. L’accès au commerce sera activé après vérification."}</p>
          <label className="block text-sm font-semibold">Adresse e-mail
            <input className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">Mot de passe
            <input className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {message ? <p role="status" className="text-sm">{message}</p> : null}
          <button type="submit" disabled={busy} className="h-12 w-full rounded-full bg-lime font-bold disabled:opacity-50">{busy ? "Patientez…" : mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
          <button type="button" className="w-full py-2 text-sm font-semibold underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>
            {mode === "login" ? "Créer un compte" : "J’ai déjà un compte"}
          </button>
        </form>
      ) : null}
    </main>
  );
}
