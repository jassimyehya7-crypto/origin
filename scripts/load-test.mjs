/**
 * Simulation de charge : 200 clients simultanés
 * Parcours : Scan QR → Voir commerce → Voir offres → Réserver
 */

const BASE_URL = "http://localhost:3000";
const TOTAL_CLIENTS = 200;
const SHOP_ID = "shop_dasilva";
const SHOP_SLUG = "epicerie-da-silva";

// Stats
const stats = {
  total: 0,
  success: 0,
  errors: 0,
  timings: {
    shopPage: [],
    offersPage: [],
    offerDetail: [],
    reservation: [],
  },
  errorTypes: {},
};

const firstNames = ["Marie", "Thomas", "Sophie", "Lucas", "Emma", "Hugo", "Léa", "Nathan", "Chloé", "Louis", "Camille", "Maxime", "Sarah", "Antoine", "Julie", "Paul", "Alice", "Alexandre", "Laura", "Pierre"];
const lastNames = ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia"];

function randomName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

function randomPhone() {
  return `078 ${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 90) + 10)} ${String(Math.floor(Math.random() * 90) + 10)}`;
}

async function measureTime(fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration, error: null };
  } catch (e) {
    const duration = Date.now() - start;
    return { result: null, duration, error: e };
  }
}

async function simulateClient(clientId) {
  const clientName = randomName();
  const clientPhone = randomPhone();
  const softUserId = `sim_user_${clientId}`;
  const trace = [];

  try {
    // Étape 1 : Voir la page commerce (scan QR)
    const shopResult = await measureTime(async () => {
      const res = await fetch(`${BASE_URL}/q/${SHOP_SLUG}`, {
        headers: { "x-ec-soft-user": softUserId },
      });
      if (!res.ok) throw new Error(`Shop page: ${res.status}`);
      return res;
    });
    stats.timings.shopPage.push(shopResult.duration);
    trace.push(`Shop: ${shopResult.duration}ms ${shopResult.error ? "❌" : "✅"}`);
    if (shopResult.error) throw shopResult.error;

    // Étape 2 : Charger les offres (API)
    const offersResult = await measureTime(async () => {
      const res = await fetch(`${BASE_URL}/api/offers?shopId=${SHOP_ID}`, {
        headers: { "x-ec-soft-user": softUserId },
      });
      if (!res.ok) throw new Error(`Offers API: ${res.status}`);
      const data = await res.json();
      return data;
    });
    stats.timings.offersPage.push(offersResult.duration);
    trace.push(`Offers: ${offersResult.duration}ms ${offersResult.error ? "❌" : "✅"}`);
    if (offersResult.error) throw offersResult.error;

    // Étape 3 : Voir une offre (si disponible)
    const offers = offersResult.result?.offers || [];
    const publishedOffers = offers.filter(o => o.status === "PUBLIEE");
    
    if (publishedOffers.length === 0) {
      trace.push("No published offers - skipping reservation");
      return { clientId, clientName, trace, reserved: false };
    }

    const offer = publishedOffers[Math.floor(Math.random() * publishedOffers.length)];

    const detailResult = await measureTime(async () => {
      const res = await fetch(`${BASE_URL}/offre/${offer.id}`, {
        headers: { "x-ec-soft-user": softUserId },
      });
      if (!res.ok) throw new Error(`Offer detail: ${res.status}`);
      return res;
    });
    stats.timings.offerDetail.push(detailResult.duration);
    trace.push(`Detail: ${detailResult.duration}ms ${detailResult.error ? "❌" : "✅"}`);

    // Étape 4 : Réserver (seulement 30% des clients réservent)
    if (Math.random() < 0.3 && offer.quantityLeft > 0) {
      const resResult = await measureTime(async () => {
        const res = await fetch(`${BASE_URL}/api/reservations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-ec-soft-user": softUserId,
          },
          body: JSON.stringify({
            offerId: offer.id,
            quantity: 1,
            clientName,
            clientPhone,
            softUserId,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Reservation: ${res.status}`);
        }
        return await res.json();
      });
      stats.timings.reservation.push(resResult.duration);
      trace.push(`Reserve: ${resResult.duration}ms ${resResult.error ? "❌ " + resResult.error.message : "✅"}`);
      
      if (resResult.error) {
        const errMsg = resResult.error.message;
        stats.errorTypes[errMsg] = (stats.errorTypes[errMsg] || 0) + 1;
      }

      return { clientId, clientName, trace, reserved: !resResult.error };
    }

    return { clientId, clientName, trace, reserved: false };
  } catch (e) {
    const errMsg = e.message || "Unknown error";
    stats.errorTypes[errMsg] = (stats.errorTypes[errMsg] || 0) + 1;
    return { clientId, clientName, trace, error: errMsg, reserved: false };
  }
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function runSimulation() {
  console.log("🚀 Simulation de charge : 200 clients simultanés");
  console.log("=".repeat(60));
  console.log(`Shop: ${SHOP_ID}`);
  console.log(`URL: ${BASE_URL}`);
  console.log("");

  // Vérifier les offres disponibles
  const checkRes = await fetch(`${BASE_URL}/api/offers?shopId=${SHOP_ID}`);
  const checkData = await checkRes.json();
  const availableOffers = (checkData.offers || []).filter(o => o.status === "PUBLIEE");
  console.log(`📦 Offres disponibles : ${availableOffers.length}`);
  availableOffers.forEach(o => console.log(`  - ${o.title} (${o.quantityLeft || "?"} en stock)`));
  console.log("");

  // Lancer 200 clients en batch de 20 (pour ne pas surcharger)
  const BATCH_SIZE = 20;
  const results = [];
  const startTime = Date.now();

  for (let batch = 0; batch < TOTAL_CLIENTS; batch += BATCH_SIZE) {
    const promises = [];
    for (let i = batch; i < Math.min(batch + BATCH_SIZE, TOTAL_CLIENTS); i++) {
      promises.push(simulateClient(i));
    }
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    
    const elapsed = Date.now() - startTime;
    const successBatch = batchResults.filter(r => !r.error).length;
    const reservedBatch = batchResults.filter(r => r.reserved).length;
    console.log(`Batch ${Math.floor(batch / BATCH_SIZE) + 1}/${Math.ceil(TOTAL_CLIENTS / BATCH_SIZE)}: ${successBatch}/${batchResults.length} OK, ${reservedBatch} réservations (${elapsed}ms total)`);
    
    // Petit délai entre les batchs
    await new Promise(r => setTimeout(r, 200));
  }

  const totalTime = Date.now() - startTime;

  // Calculer les stats
  const successCount = results.filter(r => !r.error).length;
  const reservedCount = results.filter(r => r.reserved).length;
  const errorCount = results.filter(r => r.error).length;

  console.log("");
  console.log("=".repeat(60));
  console.log("📊 RÉSULTATS DE LA SIMULATION");
  console.log("=".repeat(60));
  console.log(`Durée totale : ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`Clients simulés : ${TOTAL_CLIENTS}`);
  console.log(`Succès : ${successCount}/${TOTAL_CLIENTS} (${((successCount / TOTAL_CLIENTS) * 100).toFixed(1)}%)`);
  console.log(`Erreurs : ${errorCount}/${TOTAL_CLIENTS} (${((errorCount / TOTAL_CLIENTS) * 100).toFixed(1)}%)`);
  console.log(`Réservations : ${reservedCount}`);
  console.log(`Débit : ${(TOTAL_CLIENTS / (totalTime / 1000)).toFixed(1)} req/s`);
  console.log("");

  // Timings
  console.log("⏱️  TEMPS DE RÉPONSE (ms)");
  console.log("-".repeat(60));
  const timingLabels = [
    ["Page commerce", stats.timings.shopPage],
    ["API offres", stats.timings.offersPage],
    ["Détail offre", stats.timings.offerDetail],
    ["Réservation", stats.timings.reservation],
  ];
  for (const [label, arr] of timingLabels) {
    if (arr.length === 0) continue;
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    const p50 = percentile(arr, 50);
    const p95 = percentile(arr, 95);
    const p99 = percentile(arr, 99);
    const max = Math.max(...arr);
    console.log(`  ${label.padEnd(20)} avg=${avg.toFixed(0).padStart(5)}ms  p50=${p50}ms  p95=${p95}ms  p99=${p99}ms  max=${max}ms`);
  }
  console.log("");

  // Erreurs
  if (Object.keys(stats.errorTypes).length > 0) {
    console.log("❌ ERREURS RENCONTRÉES");
    console.log("-".repeat(60));
    for (const [err, count] of Object.entries(stats.errorTypes).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${count}x  ${err}`);
    }
    console.log("");
  }

  // Recommandations
  console.log("🔍 ANALYSE & RECOMMANDATIONS");
  console.log("-".repeat(60));
  
  const avgShop = stats.timings.shopPage.length > 0 ? stats.timings.shopPage.reduce((a, b) => a + b, 0) / stats.timings.shopPage.length : 0;
  const avgOffers = stats.timings.offersPage.length > 0 ? stats.timings.offersPage.reduce((a, b) => a + b, 0) / stats.timings.offersPage.length : 0;
  const avgRes = stats.timings.reservation.length > 0 ? stats.timings.reservation.reduce((a, b) => a + b, 0) / stats.timings.reservation.length : 0;
  const p95Shop = percentile(stats.timings.shopPage, 95);
  const p95Res = percentile(stats.timings.reservation, 95);

  if (avgShop > 2000) console.log("  ⚠️  Page commerce trop lente (>2s) — optimiser le rendu serveur");
  else if (avgShop > 1000) console.log("  ⚡ Page commerce correcte mais peut être optimisée");
  else console.log("  ✅ Page commerce rapide");

  if (avgOffers > 500) console.log("  ⚠️  API offres trop lente (>500ms) — ajouter cache ou pagination");
  else console.log("  ✅ API offres rapide");

  if (avgRes > 1000) console.log("  ⚠️  Réservation trop lente (>1s) — optimiser le traitement");
  else if (avgRes > 500) console.log("  ⚡ Réservation correcte mais peut être optimisée");
  else if (stats.timings.reservation.length > 0) console.log("  ✅ Réservation rapide");

  if (p95Shop > 5000) console.log("  🔴 P95 page commerce >5s — risque d'abandon client");
  if (p95Res > 3000) console.log("  🔴 P95 réservation >3s — risque d'abandon client");
  
  if (errorCount > TOTAL_CLIENTS * 0.1) console.log("  🔴 Taux d'erreur >10% — investiguer les erreurs");
  else if (errorCount > 0) console.log("  ⚡ Quelques erreurs détectées");
  else console.log("  ✅ Aucune erreur");

  if (reservedCount === 0) console.log("  ⚠️  Aucune réservation effectuée — vérifier les offres disponibles");
  else console.log(`  ✅ ${reservedCount} réservations effectuées`);

  console.log("");
  console.log("=".repeat(60));
  console.log("Simulation terminée.");
}

runSimulation().catch(console.error);
