import { createClient } from "npm:@supabase/supabase-js@2.109.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return json({ error: "Méthode refusée" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !publicKey || !serviceKey) return json({ error: "Service indisponible" }, 503);

  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Connexion requise" }, 401);

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Session invalide" }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Données invalides" }, 400);
  }

  if (payload.action === "createMerchant") {
    const { data: founder } = await admin
      .from("ec_founder_memberships")
      .select("user_id,must_set_password")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!founder || founder.must_set_password) return json({ error: "Accès fondateur requis" }, 403);

    const email = String(payload.email ?? "").trim().toLowerCase();
    const password = String(payload.password ?? "");
    const shopId = String(payload.shopId ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 128) {
      return json({ error: "E-mail ou mot de passe provisoire invalide" }, 400);
    }
    const { data: shop } = await admin.from("ec_shops").select("id").eq("id", shopId).maybeSingle();
    if (!shop) return json({ error: "Commerce introuvable" }, 404);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError || !created.user) return json({ error: "Impossible de créer ce compte. Vérifiez si l’adresse existe déjà." }, 409);

    const { error: linkError } = await admin.from("ec_shop_memberships").insert({
      shop_id: shopId,
      user_id: created.user.id,
      must_change_password: true,
    });
    if (linkError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: "Le compte n’a pas pu être lié au commerce" }, 500);
    }
    return json({ ok: true, email, shopId });
  }

  if (payload.action === "setFounderPassword") {
    const newPassword = String(payload.newPassword ?? "");
    if (newPassword.length < 12 || newPassword.length > 128) {
      return json({ error: "Le mot de passe doit contenir au moins 12 caractères" }, 400);
    }
    const { data: founder } = await admin
      .from("ec_founder_memberships")
      .select("user_id,must_set_password")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!founder || !founder.must_set_password) return json({ error: "Action non autorisée" }, 403);
    const { error: updateError } = await admin.auth.admin.updateUserById(userData.user.id, { password: newPassword });
    if (updateError) return json({ error: "Mot de passe impossible à enregistrer" }, 500);
    const { error: flagError } = await admin.from("ec_founder_memberships")
      .update({ must_set_password: false })
      .eq("user_id", userData.user.id);
    if (flagError) return json({ error: "Mot de passe enregistré. Reconnectez-vous avec ce mot de passe." }, 500);
    return json({ ok: true });
  }

  if (["getFounderDashboard", "updateFounderShop", "updateFounderMessage"].includes(String(payload.action))) {
    const { data: founder } = await admin.from("ec_founder_memberships")
      .select("user_id,must_set_password")
      .eq("user_id", userData.user.id).maybeSingle();
    if (!founder || founder.must_set_password) return json({ error: "Accès fondateur requis" }, 403);

    if (payload.action === "getFounderDashboard") {
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const [shops, offers, reservations, presence, messages] = await Promise.all([
        admin.from("ec_shops").select("id,name,address,city,active,subscription_active,tablet_request_status,tablet_requested_at,trial_ends_at,created_at").order("name"),
        admin.from("ec_offers").select("id,shop_id", { count: "exact" }).eq("status", "PUBLIEE"),
        admin.from("ec_reservations").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()),
        admin.from("ec_presence").select("client_id", { count: "exact", head: true }).gte("last_seen", new Date(Date.now() - 5 * 60_000).toISOString()),
        admin.from("ec_founder_messages").select("id,shop_id,body,audio_url,status,created_at").order("created_at", { ascending: false }).limit(50),
      ]);
      if (shops.error || offers.error || reservations.error || presence.error || messages.error) {
        return json({ error: "Données de pilotage indisponibles" }, 500);
      }
      return json({
        shops: shops.data ?? [], offers: offers.data ?? [],
        activeOffers: offers.count ?? 0, reservationsToday: reservations.count ?? 0,
        liveClients: presence.count ?? 0, messages: messages.data ?? [],
      });
    }

    if (payload.action === "updateFounderShop") {
      const shopId = String(payload.shopId ?? "");
      const patch: Record<string, unknown> = {};
      if (typeof payload.subscriptionActive === "boolean") patch.subscription_active = payload.subscriptionActive;
      if (["none", "pending", "approved", "installed"].includes(String(payload.tabletRequestStatus))) {
        patch.tablet_request_status = payload.tabletRequestStatus;
      }
      if (!shopId || !Object.keys(patch).length) return json({ error: "Modification invalide" }, 400);
      const { data, error } = await admin.from("ec_shops").update(patch).eq("id", shopId).select("id").maybeSingle();
      return error || !data ? json({ error: "Commerce introuvable" }, 404) : json({ ok: true });
    }

    const messageId = String(payload.messageId ?? "");
    const status = String(payload.status ?? "");
    if (!messageId || !["lu", "traite"].includes(status)) return json({ error: "Statut invalide" }, 400);
    const { data, error } = await admin.from("ec_founder_messages")
      .update({ status }).eq("id", messageId).select("id").maybeSingle();
    return error || !data ? json({ error: "Message introuvable" }, 404) : json({ ok: true });
  }

  if (payload.action === "changePassword") {
    const oldPassword = String(payload.oldPassword ?? "");
    const newPassword = String(payload.newPassword ?? "");
    if (newPassword.length < 12 || newPassword.length > 128 || newPassword === oldPassword) {
      return json({ error: "Choisissez un nouveau mot de passe d’au moins 12 caractères" }, 400);
    }
    const { data: membership } = await admin
      .from("ec_shop_memberships")
      .select("shop_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!membership || !userData.user.email) return json({ error: "Accès commerçant requis" }, 403);

    const verifier = createClient(url, publicKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: verified, error: verifyError } = await verifier.auth.signInWithPassword({
      email: userData.user.email,
      password: oldPassword,
    });
    if (verifyError || verified.user?.id !== userData.user.id) {
      return json({ error: "Ancien mot de passe incorrect" }, 400);
    }
    const { error: updateError } = await admin.auth.admin.updateUserById(userData.user.id, {
      password: newPassword,
    });
    if (updateError) return json({ error: "Changement de mot de passe impossible" }, 500);
    const { error: flagError } = await admin.from("ec_shop_memberships")
      .update({ must_change_password: false })
      .eq("user_id", userData.user.id);
    if (flagError) return json({ error: "Mot de passe changé. Reconnectez-vous avec le nouveau mot de passe." }, 500);
    return json({ ok: true });
  }

  return json({ error: "Action inconnue" }, 400);
});
