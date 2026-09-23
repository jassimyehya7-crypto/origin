"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ShoppingBag, Store, TrendingUp, Users, Tablet, MessageCircle, LogOut } from "lucide-react";
import { ShopsDropdown, type ShopListItem } from "@/components/fondateur/ShopsDropdown";

type Shop = { id: string; name: string; address: string | null; city: string | null; active: boolean; subscription_active: boolean; tablet_request_status: string; trial_ends_at: string | null };
type Message = { id: string; shop_id: string; body: string | null; audio_url: string | null; status: string; created_at: string };
type Dashboard = { shops: Shop[]; offers: { id: string; shop_id: string }[]; activeOffers: number; reservationsToday: number; liveClients: number; messages: Message[] };
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;

async function invoke(action: string, fields: Record<string, unknown> = {}) {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  const { data, error } = await supabase.functions.invoke("merchant-accounts", { body: { action, ...fields } });
  if (error || data?.error) throw new Error(data?.error || "Connexion au serveur indisponible.");
  return data;
}

export default function FondateurPage() {
  const [state, setState] = useState<"loading" | "login" | "setup" | "ready">("loading");
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [shopId, setShopId] = useState("");
  const [merchantEmail, setMerchantEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    if (!supabase) { setState("login"); setError("Supabase n’est pas configuré."); return; }
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { setState("login"); setData(null); return; }
    const { data: allowed } = await supabase.rpc("founder_access_for_user");
    if (allowed !== true) { setError("Ce compte n’a pas accès à l’espace fondateur."); setState("login"); return; }
    const { data: setup } = await supabase.rpc("founder_setup_required");
    if (setup === true) { setState("setup"); return; }
    try { setData(await invoke("getFounderDashboard") as Dashboard); setError(""); setState("ready"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Données indisponibles."); setState("ready"); }
  }, []);

  useEffect(() => {
    void refresh();
    if (!supabase) return;
    const auth = supabase.auth.onAuthStateChange(() => { window.setTimeout(() => void refresh(), 0); });
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30_000);
    const channel = supabase.channel("founder-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "ec_offers" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "ec_reservations" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "ec_shops" }, () => void refresh()).subscribe();
    return () => { auth.data.subscription.unsubscribe(); window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, [refresh]);

  async function action(name: string, fields: Record<string, unknown>) {
    setBusy(true); setError(""); setNotice("");
    try { await invoke(name, fields); await refresh(); setNotice(name === "createMerchant" ? "Accès commerçant créé. Remettez-lui le mot de passe provisoire." : "Modification enregistrée."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Action impossible."); }
    finally { setBusy(false); }
  }

  if (state === "loading") return <p className="p-8">Chargement de l’espace fondateur…</p>;
  if (state === "login" || state === "setup") return <main className="mx-auto max-w-md px-5 py-12">
    <h1 className="text-3xl font-black">Espace fondateur</h1>
    <p className="mt-2 text-ec-muted">{state === "setup" ? "Choisissez votre mot de passe fondateur." : "Connectez-vous pour piloter OffresLocal."}</p>
    <form className="mt-7 space-y-4" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError("");
      try {
        if (state === "setup") {
          if (password !== confirmation || password.length < 12) throw new Error("Utilisez au moins 12 caractères identiques.");
          await invoke("setFounderPassword", { newPassword: password });
        } else {
          if (!supabase) throw new Error("Supabase indisponible.");
          const result = await supabase.auth.signInWithPassword({ email, password });
          if (result.error) throw result.error;
        }
        setPassword(""); await refresh();
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Connexion impossible."); }
      finally { setBusy(false); }
    }}>
      {state === "login" && <label className="block text-sm font-bold">Adresse e-mail<input className="mt-2 w-full rounded-xl border p-3" type="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>}
      <label className="block text-sm font-bold">{state === "setup" ? "Nouveau mot de passe" : "Mot de passe"}<input className="mt-2 w-full rounded-xl border p-3" type="password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
      {state === "setup" && <label className="block text-sm font-bold">Confirmer le mot de passe<input className="mt-2 w-full rounded-xl border p-3" type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} required /></label>}
      {error && <p role="alert" className="text-sm text-ec-red">{error}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-ec-yellow p-3 font-bold">{busy ? "Patientez…" : state === "setup" ? "Enregistrer" : "Se connecter"}</button>
    </form>
  </main>;

  const shops = data?.shops ?? [];
  const messages = data?.messages ?? [];
  const shopList: ShopListItem[] = shops.map(shop => ({
    id: shop.id, name: shop.name,
    status: shop.subscription_active ? "active" : shop.trial_ends_at && new Date(shop.trial_ends_at) > new Date() ? "trial" : "unpaid",
  }));
  const tabletRequests = shops.filter(shop => ["pending", "approved"].includes(shop.tablet_request_status));
  return <div className="mx-auto max-w-lg px-4 py-5 lg:max-w-5xl">
    <div className="mb-6 flex items-start justify-between gap-3"><div><h1 className="font-display text-[1.75rem] text-ec-ink">Tableau de bord</h1><p className="text-sm font-semibold text-ec-muted">OffresLocal · Villeneuve</p></div><button className="flex items-center gap-1 text-xs font-bold text-ec-muted" onClick={() => void supabase?.auth.signOut()}><LogOut size={15} /> Se déconnecter</button></div>
    {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-ec-red">{error}</p>}
    {notice && <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-ec-green">{notice}</p>}
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi icon={<Users size={16} />} label="Clients connectés" value={data?.liveClients ?? 0} />
      <ShopsDropdown shops={shopList} published={shops.filter(s => s.active).length} total={shops.length} />
      <Kpi icon={<ShoppingBag size={16} />} label="Offres actives" value={data?.activeOffers ?? 0} />
      <Kpi icon={<TrendingUp size={16} />} label="Réservations J" value={data?.reservationsToday ?? 0} />
    </div>
    <section className="mb-6 rounded-2xl border-2 border-dashed border-ec-blue bg-blue-50 p-5"><h2 className="flex items-center gap-2 text-sm font-extrabold"><Store size={17} /> Créer un accès commerçant</h2><p className="mt-1 text-xs text-ec-muted">Créez son compte et liez-le à un commerce existant.</p>
      <form className="mt-3 grid gap-2 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); void action("createMerchant", { shopId: shopId || shops[0]?.id, email: merchantEmail, password: temporaryPassword }); }}>
        <select className="rounded-xl border bg-white p-2" value={shopId || shops[0]?.id || ""} onChange={event => setShopId(event.target.value)} required>{shops.map(shop => <option key={shop.id} value={shop.id}>{shop.name}</option>)}</select>
        <input className="rounded-xl border bg-white p-2" type="email" placeholder="E-mail commerçant" value={merchantEmail} onChange={event => setMerchantEmail(event.target.value)} required />
        <input className="rounded-xl border bg-white p-2 sm:col-span-2" type="text" minLength={12} placeholder="Mot de passe provisoire (12 caractères minimum)" value={temporaryPassword} onChange={event => setTemporaryPassword(event.target.value)} required />
        <button disabled={busy || !shops.length} className="rounded-xl bg-ec-blue px-4 py-2 font-bold text-white sm:col-span-2">Créer l’accès commerçant</button>
      </form>
    </section>
    <section className="mb-6"><h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold"><MessageCircle size={16} /> Messages des commerçants</h2>
      {messages.length ? <div className="space-y-3">{messages.map(message => <article key={message.id} className="rounded-2xl border bg-white p-4 shadow-sm"><div className="flex justify-between gap-2"><strong>{shops.find(s => s.id === message.shop_id)?.name || message.shop_id}</strong><span className="text-xs text-ec-muted">{message.status}</span></div><p className="mt-1 text-xs text-ec-muted">{new Date(message.created_at).toLocaleString("fr-CH")}</p>{message.body && <p className="mt-3 whitespace-pre-wrap text-sm">{message.body}</p>}{message.audio_url && <audio controls className="mt-3 w-full" src={message.audio_url} />}{message.status !== "traite" && <div className="mt-3 flex gap-2">{message.status === "nouveau" && <button disabled={busy} className="rounded-lg border px-3 py-2 text-sm" onClick={() => void action("updateFounderMessage", { messageId: message.id, status: "lu" })}>Marquer lu</button>}<button disabled={busy} className="rounded-lg bg-ec-yellow px-3 py-2 text-sm font-bold" onClick={() => void action("updateFounderMessage", { messageId: message.id, status: "traite" })}>Traité</button></div>}</article>)}</div> : <div className="rounded-2xl border bg-white p-4 text-sm text-ec-muted">Aucun message</div>}
    </section>
    <section className="mb-6"><h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold"><Tablet size={16} /> Demandes de tablette</h2>
      {tabletRequests.length ? <div className="space-y-3">{tabletRequests.map(shop => <article key={shop.id} className="rounded-2xl border bg-white p-4 shadow-sm"><strong>{shop.name}</strong><p className="text-xs text-ec-muted">{shop.address} · {shop.city}</p><p className="mt-2 text-xs font-bold">{shop.tablet_request_status === "pending" ? "En attente" : "Validée"}</p><div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} className="rounded-lg border px-3 py-2 text-sm" onClick={() => void action("updateFounderShop", { shopId: shop.id, subscriptionActive: !shop.subscription_active })}>{shop.subscription_active ? "Désactiver abonnement" : "Activer abonnement"}</button>{shop.tablet_request_status === "pending" && <button disabled={busy} className="rounded-lg bg-ec-yellow px-3 py-2 text-sm font-bold" onClick={() => void action("updateFounderShop", { shopId: shop.id, tabletRequestStatus: "approved" })}>Valider</button>}<button disabled={busy} className="rounded-lg bg-ec-blue px-3 py-2 text-sm font-bold text-white" onClick={() => void action("updateFounderShop", { shopId: shop.id, tabletRequestStatus: "installed" })}>Installée</button></div></article>)}</div> : <div className="rounded-2xl border bg-white p-4 text-sm text-ec-muted">Aucune demande en cours</div>}
    </section>
  </div>;
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="rounded-2xl border border-ec-rule bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-ec-muted">{icon}<span className="text-[10px] font-extrabold uppercase">{label}</span></div><div className="mt-2 text-3xl font-black">{value}</div></div>;
}
