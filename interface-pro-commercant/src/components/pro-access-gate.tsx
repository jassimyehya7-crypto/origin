import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { fetchMerchantReservations } from "@/lib/data/supabase-catalog";
import { PRO_SHOP_ID } from "@/lib/labels";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

type Access = "checking" | "signed-out" | "waiting" | "password-change" | "allowed" | "error";

export function ProAccessGate({ children }: { children: ReactNode }) {
  const configured = Boolean(supabase);
  const [access, setAccess] = useState<Access>(configured ? "checking" : "allowed");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      const { data, error } = await supabase!.rpc("merchant_access_for_user");
      if (!active) return;
      const merchant = data as { shop_id?: string; must_change_password?: boolean } | null;
      setAccess(error ? "error" : merchant?.shop_id !== PRO_SHOP_ID ? "waiting" : merchant.must_change_password ? "password-change" : "allowed");
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
    const result = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setPassword("");
    setMessage("Connexion réussie. Vérification de l’accès commerçant…");
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    if (newPassword !== confirmPassword) {
      setMessage("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 12 || newPassword === oldPassword) {
      setMessage("Choisissez un nouveau mot de passe différent d’au moins 12 caractères.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.functions.invoke("merchant-accounts", {
      body: { action: "changePassword", oldPassword, newPassword },
    });
    if (error || !data?.ok) {
      let detail = data?.error as string | undefined;
      if (!detail && error && "context" in error) {
        try { detail = (await (error.context as Response).json()).error; } catch { /* réponse réseau absente */ }
      }
      setMessage(detail || "Le changement de mot de passe a échoué.");
      setBusy(false);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const accountEmail = userData.user?.email;
    if (accountEmail) {
      const signedIn = await supabase.auth.signInWithPassword({ email: accountEmail, password: newPassword });
      if (signedIn.error) {
        setMessage("Mot de passe enregistré. Reconnectez-vous avec le nouveau mot de passe.");
        await supabase.auth.signOut();
      }
    }
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setBusy(false);
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
      {access === "password-change" ? (
        <form onSubmit={(event) => void changePassword(event)} className="mt-7 space-y-4">
          <div role="alert" className="rounded-2xl border border-lime bg-lime/20 p-4 text-sm font-semibold">
            Première connexion : choisissez votre mot de passe personnel pour activer votre espace commerçant.
          </div>
          <label className="block text-sm font-semibold">Ancien mot de passe
            <input className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4" type="password" autoComplete="current-password" required value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">Nouveau mot de passe
            <input className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4" type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">Confirmer le nouveau mot de passe
            <input className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4" type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </label>
          {message ? <p role="status" className="text-sm">{message}</p> : null}
          <button type="submit" disabled={busy} className="h-12 w-full rounded-full bg-lime font-bold disabled:opacity-50">{busy ? "Enregistrement…" : "Enregistrer"}</button>
          <button type="button" className="w-full py-2 text-sm font-semibold underline" onClick={() => void supabase?.auth.signOut()}>Se déconnecter</button>
        </form>
      ) : null}
      {access === "signed-out" ? (
        <form onSubmit={(event) => void submit(event)} className="mt-7 space-y-4">
          <p className="text-sm text-mute">Connectez-vous avec les identifiants remis par OffresLocal.</p>
          <label className="block text-sm font-semibold">Adresse e-mail
            <input className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">Mot de passe
            <input className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {message ? <p role="status" className="text-sm">{message}</p> : null}
          <button type="submit" disabled={busy} className="h-12 w-full rounded-full bg-lime font-bold disabled:opacity-50">{busy ? "Patientez…" : "Se connecter"}</button>
        </form>
      ) : null}
    </main>
  );
}
