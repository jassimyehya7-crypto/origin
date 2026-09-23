import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Store, Tag, Ticket, Users } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { MERCHANTS, getActiveMerchants, mergeOffers } from "@/lib/data/catalog";
import { CATEGORY_LABELS } from "@/lib/labels";
import { useAppStore, useCatalogRevision } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/fondateur")({
  component: FounderAccess,
});

type FounderAccessState = "checking" | "signed-out" | "setup" | "allowed" | "denied" | "error";

function FounderAccess() {
  const configured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  const [access, setAccess] = useState<FounderAccessState>(configured ? "checking" : "allowed");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    async function check() {
      const { data: sessionData, error: sessionError } = await supabase!.auth.getSession();
      if (!active) return;
      if (sessionError) { setAccess("error"); return; }
      if (!sessionData.session) { setAccess("signed-out"); return; }
      const { data, error } = await supabase!.rpc("founder_access_for_user");
      if (!active) return;
      if (error) { setAccess("error"); return; }
      if (data !== true) { setAccess("denied"); return; }
      const setup = await supabase!.rpc("founder_setup_required");
      if (active) setAccess(setup.error ? "error" : setup.data === true ? "setup" : "allowed");
    }
    void check();
    const { data: listener } = supabase.auth.onAuthStateChange(() => window.setTimeout(() => void check(), 0));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  if (access === "allowed") return <Fondateur />;
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center bg-paper px-6 py-12 text-ink">
      <div className="mb-8 inline-flex size-12 items-center justify-center rounded-xl bg-lime font-display text-3xl font-black">O</div>
      <h1 className="font-display text-3xl font-bold">Espace fondateur</h1>
      {access === "checking" ? <p className="mt-4 text-mute">Vérification de votre accès…</p> : null}
      {access === "error" ? <p role="alert" className="mt-4">Connexion indisponible. Rechargez la page.</p> : null}
      {access === "denied" ? <div className="mt-4"><p role="alert">Ce compte n’a pas accès à l’interface fondateur.</p><button className="mt-4 underline" onClick={() => void supabase?.auth.signOut()}>Se déconnecter</button></div> : null}
      {access === "setup" ? (
        <form className="mt-7 space-y-4" onSubmit={async (event) => {
          event.preventDefault();
          if (!supabase) return;
          if (newPassword !== confirmedPassword) { setErrorMessage("Les deux mots de passe ne correspondent pas."); return; }
          setErrorMessage("");
          const { data, error } = await supabase.functions.invoke("merchant-accounts", { body: { action: "setFounderPassword", newPassword } });
          if (error || !data?.ok) { setErrorMessage("Impossible d’enregistrer le mot de passe."); return; }
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user?.email) await supabase.auth.signInWithPassword({ email: userData.user.email, password: newPassword });
          setNewPassword(""); setConfirmedPassword(""); setAccess("allowed");
        }}>
          <p className="text-sm text-mute">Bienvenue. Choisissez votre mot de passe fondateur pour activer cet espace.</p>
          <label className="block text-sm font-semibold">Nouveau mot de passe<input className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4" type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label>
          <label className="block text-sm font-semibold">Confirmer le mot de passe<input className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4" type="password" autoComplete="new-password" minLength={12} value={confirmedPassword} onChange={(event) => setConfirmedPassword(event.target.value)} required /></label>
          {errorMessage ? <p role="alert" className="text-sm">{errorMessage}</p> : null}
          <button className="h-12 w-full rounded-full bg-lime font-bold">Enregistrer</button>
        </form>
      ) : null}
      {access === "signed-out" ? (
        <form className="mt-7 space-y-4" onSubmit={async (event) => {
          event.preventDefault();
          if (!supabase) return;
          setErrorMessage("");
          const result = await supabase.auth.signInWithPassword({ email, password });
          setPassword("");
          if (result.error) setErrorMessage("Identifiants incorrects ou connexion indisponible.");
        }}>
          <p className="text-sm text-mute">Connectez-vous avec votre compte fondateur.</p>
          <label className="block text-sm font-semibold">Adresse e-mail<input className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label className="block text-sm font-semibold">Mot de passe<input className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-4" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {errorMessage ? <p role="alert" className="text-sm">{errorMessage}</p> : null}
          <button className="h-12 w-full rounded-full bg-lime font-bold">Se connecter</button>
        </form>
      ) : null}
    </main>
  );
}

function Fondateur() {
  useCatalogRevision();
  const extraOffers = useAppStore((s) => s.extraOffers);
  const hiddenOfferIds = useAppStore((s) => s.hiddenOfferIds);
  const reservations = useAppStore((s) => s.reservations);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const offers = mergeOffers(extraOffers, hiddenOfferIds);
  const merchants = supabase ? getActiveMerchants() : MERCHANTS;
  const live = offers.filter((o) => (useAppStore.getState().stockByOffer[o.id] ?? o.stock) > 0);
  const pending = reservations.filter((r) => r.status === "pending").length;
  const mine = reservations.filter((r) => r.mine !== false).length;

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto min-h-dvh w-full max-w-lg bg-paper pb-10">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/95 px-5 pb-3 pt-4 backdrop-blur-md safe-top">
          <div className="flex items-center justify-between gap-3">
            <Logo to="/profile" size="sm" />
            {supabase ? <button className="text-xs font-semibold text-mute hover:text-ink" onClick={() => void supabase?.auth.signOut()}>Se déconnecter</button> : <Link to="/profile" className="text-xs font-semibold text-mute hover:text-ink">Quitter</Link>}
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">Pilotage</h1>
          <p className="text-sm font-medium text-mute">OffresLocal · Villeneuve</p>
        </header>

        <div className="px-5 py-5">
          {supabase ? <MerchantAccountForm merchants={merchants} /> : null}
          <div className="grid grid-cols-2 gap-3">
            <Kpi icon={Users} value={mine} label="Clients démo" />
            <Kpi icon={Store} value={merchants.length} label="Commerces" />
            <Kpi icon={Tag} value={live.length} label="Offres live" />
            <Kpi icon={Ticket} value={pending} label="Demandes" />
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Commerces A1</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                resetDemo();
                toast("Démo réinitialisée");
              }}
            >
              Réinitialiser
            </Button>
          </div>

          <ul className="mt-3 space-y-2">
            {merchants.map((m) => {
              const count = offers.filter((o) => o.merchantId === m.id).length;
              const cat = m.category === "all" ? "autre" : m.category;
              return (
                <li key={m.id}>
                  <Link
                    to="/merchants/$merchantId"
                    params={{ merchantId: m.id }}
                    className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-card p-2.5 shadow-[var(--shadow-card)] press"
                  >
                    <Photo src={m.cover} alt="" className="size-12 rounded-[var(--radius-sm)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold">{m.name}</p>
                      <p className="text-[11px] text-mute">
                        {CATEGORY_LABELS[cat]} · {count} offre{count > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-mute">{m.openUntil}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MerchantAccountForm({ merchants }: { merchants: ReturnType<typeof getActiveMerchants> }) {
  const [shopId, setShopId] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const chosenShopId = shopId || merchants[0]?.id || "";

  function generatePassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    setTemporaryPassword(Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join(""));
    setShowPassword(true);
  }

  async function createMerchant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !chosenShopId || busy) return;
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.functions.invoke("merchant-accounts", {
      body: { action: "createMerchant", shopId: chosenShopId, email, password: temporaryPassword },
    });
    if (error || !data?.ok) {
      let detail = data?.error as string | undefined;
      if (!detail && error && "context" in error) {
        try { detail = (await (error.context as Response).json()).error; } catch { /* réponse absente */ }
      }
      setMessage(detail || "Création impossible. Vérifiez votre accès fondateur.");
    } else {
      setMessage(`Compte créé pour ${email}. Remettez le mot de passe provisoire au commerçant, puis demandez-lui de le changer à sa première connexion.`);
      toast("Compte commerçant créé");
    }
    setBusy(false);
  }

  return (
    <section className="mb-6 rounded-[var(--radius-lg)] border border-line bg-card p-4 shadow-[var(--shadow-card)]">
      <h2 className="font-display text-lg font-bold">Créer un accès commerçant</h2>
      <p className="mt-1 text-xs text-mute">Vous seul créez le compte et le liez à son commerce.</p>
      <form className="mt-4 space-y-3" onSubmit={(event) => void createMerchant(event)}>
        <label className="block text-sm font-semibold">Commerce
          <select className="mt-2 h-12 w-full rounded-xl border border-line bg-paper px-4" value={chosenShopId} onChange={(event) => setShopId(event.target.value)} required>
            {merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">Adresse e-mail du commerçant
          <input className="mt-2 h-12 w-full rounded-xl border border-line bg-paper px-4" type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="block text-sm font-semibold">Mot de passe provisoire
          <input className="mt-2 h-12 w-full rounded-xl border border-line bg-paper px-4" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} required />
        </label>
        <div className="flex gap-2">
          <button type="button" className="rounded-full border border-line px-4 py-2 text-xs font-semibold" onClick={generatePassword}>Générer</button>
          <button type="button" className="rounded-full border border-line px-4 py-2 text-xs font-semibold" onClick={() => setShowPassword((current) => !current)}>{showPassword ? "Masquer" : "Afficher"}</button>
          <button type="button" className="rounded-full border border-line px-4 py-2 text-xs font-semibold" onClick={() => void navigator.clipboard.writeText(temporaryPassword)} disabled={!temporaryPassword}>Copier</button>
        </div>
        {message ? <p role="status" className="text-xs leading-relaxed">{message}</p> : null}
        <button type="submit" disabled={busy || merchants.length === 0} className="h-12 w-full rounded-full bg-lime font-bold disabled:opacity-50">{busy ? "Création…" : "Créer le compte"}</button>
      </form>
    </section>
  );
}

function Kpi({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Store;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center gap-2 text-mute">
        <Icon className="size-4" />
        <span className="text-[10px] font-extrabold uppercase">{label}</span>
      </div>
      <p className="font-display text-2xl font-bold tabular">{value}</p>
    </div>
  );
}
