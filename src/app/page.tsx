import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Smartphone, Store, Settings, ArrowRight, QrCode, ShoppingBag, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-ec-paper">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="font-display text-3xl text-ec-ink">
            Plateforme OffresLocal
          </h1>
          <p className="mt-2 text-sm font-semibold text-ec-muted">
            Villeneuve · Système complet de gestion des offres locales
          </p>
        </div>

        {/* 3 sections */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Côté Client */}
          <div className="rounded-2xl border border-ec-rule bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ec-blue/10">
                <Smartphone className="h-6 w-6 text-ec-blue" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-ec-ink">Client</h2>
                <p className="text-xs font-semibold text-ec-muted">Consommateur</p>
              </div>
            </div>
            
            <div className="mb-4 space-y-2">
              <div className="flex items-start gap-2">
                <QrCode className="mt-0.5 h-4 w-4 text-ec-muted" />
                <p className="text-sm font-semibold text-ec-ink">
                  Scanne un QR code en vitrine
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ShoppingBag className="mt-0.5 h-4 w-4 text-ec-muted" />
                <p className="text-sm font-semibold text-ec-ink">
                  Parcourt les offres du commerce
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 text-ec-muted" />
                <p className="text-sm font-semibold text-ec-ink">
                  Réserve et récupère en magasin
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase text-ec-muted">Pages</p>
              <Link
                href="/commerce/shop-epicerie-dasilva"
                className="flex items-center justify-between rounded-xl border border-ec-rule bg-ec-soft px-3 py-2 text-sm font-bold text-ec-ink transition hover:border-ec-blue hover:bg-white"
              >
                <span>Vitrine commerce</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/offre/a1_dasilva_panier"
                className="flex items-center justify-between rounded-xl border border-ec-rule bg-ec-soft px-3 py-2 text-sm font-bold text-ec-ink transition hover:border-ec-blue hover:bg-white"
              >
                <span>Détail offre</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Côté Pro */}
          <div className="rounded-2xl border border-ec-rule bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ec-green/10">
                <Store className="h-6 w-6 text-ec-green" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-ec-ink">Pro</h2>
                <p className="text-xs font-semibold text-ec-muted">Commerçant</p>
              </div>
            </div>
            
            <div className="mb-4 space-y-2">
              <div className="flex items-start gap-2">
                <ShoppingBag className="mt-0.5 h-4 w-4 text-ec-muted" />
                <p className="text-sm font-semibold text-ec-ink">
                  Crée et publie des offres
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 text-ec-muted" />
                <p className="text-sm font-semibold text-ec-ink">
                  Gère les réservations clients
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Settings className="mt-0.5 h-4 w-4 text-ec-muted" />
                <p className="text-sm font-semibold text-ec-ink">
                  Configure son commerce
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase text-ec-muted">Pages</p>
              <Link
                href="/pro"
                className="flex items-center justify-between rounded-xl border border-ec-rule bg-ec-soft px-3 py-2 text-sm font-bold text-ec-ink transition hover:border-ec-green hover:bg-white"
              >
                <span>Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pro/offres"
                className="flex items-center justify-between rounded-xl border border-ec-rule bg-ec-soft px-3 py-2 text-sm font-bold text-ec-ink transition hover:border-ec-green hover:bg-white"
              >
                <span>Gestion offres</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pro/parametres"
                className="flex items-center justify-between rounded-xl border border-ec-rule bg-ec-soft px-3 py-2 text-sm font-bold text-ec-ink transition hover:border-ec-green hover:bg-white"
              >
                <span>Magasin</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 rounded-xl border border-ec-blue/30 bg-blue-50 p-3">
              <p className="text-xs font-extrabold text-ec-blue">Code PIN : 1234</p>
            </div>
          </div>

          {/* Côté Fondateur */}
          <div className="rounded-2xl border border-ec-rule bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ec-yellow/10">
                <Settings className="h-6 w-6 text-ec-yellow" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-ec-ink">Fondateur</h2>
                <p className="text-xs font-semibold text-ec-muted">Admin OffresLocal</p>
              </div>
            </div>
            
            <div className="mb-4 space-y-2">
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 text-ec-muted" />
                <p className="text-sm font-semibold text-ec-ink">
                  Supervise tous les commerces
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ShoppingBag className="mt-0.5 h-4 w-4 text-ec-muted" />
                <p className="text-sm font-semibold text-ec-ink">
                  Voit les offres et réservations
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Settings className="mt-0.5 h-4 w-4 text-ec-muted" />
                <p className="text-sm font-semibold text-ec-ink">
                  Gère abonnements et tablettes
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase text-ec-muted">Pages</p>
              <Link
                href="/fondateur"
                className="flex items-center justify-between rounded-xl border border-ec-rule bg-ec-soft px-3 py-2 text-sm font-bold text-ec-ink transition hover:border-ec-yellow hover:bg-white"
              >
                <span>Tableau de bord</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 rounded-xl border border-ec-yellow/30 bg-yellow-50 p-3">
              <p className="text-xs font-extrabold text-ec-ink">Code PIN : 5678</p>
            </div>
          </div>
        </div>

        {/* Flux de données */}
        <div className="mt-12 rounded-2xl border border-ec-rule bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-extrabold text-ec-ink">
            Flux de données
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl bg-ec-soft p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ec-blue text-xs font-black text-white">
                1
              </div>
              <div>
                <p className="text-sm font-extrabold text-ec-ink">
                  Pro crée une offre
                </p>
                <p className="text-xs font-semibold text-ec-muted">
                  Le commerçant publie une offre (FLASH, ARRIVAGE, PROMO, etc.)
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 rounded-xl bg-ec-soft p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ec-green text-xs font-black text-white">
                2
              </div>
              <div>
                <p className="text-sm font-extrabold text-ec-ink">
                  Client réserve
                </p>
                <p className="text-xs font-semibold text-ec-muted">
                  Le client scanne le QR, voit l'offre et réserve
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 rounded-xl bg-ec-soft p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ec-yellow text-xs font-black text-white">
                3
              </div>
              <div>
                <p className="text-sm font-extrabold text-ec-ink">
                  Pro confirme et remet
                </p>
                <p className="text-xs font-semibold text-ec-muted">
                  Le commerçant voit la réservation, confirme et remet le produit
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 rounded-xl bg-ec-soft p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ec-ink text-xs font-black text-white">
                4
              </div>
              <div>
                <p className="text-sm font-extrabold text-ec-ink">
                  Fondateur supervise
                </p>
                <p className="text-xs font-semibold text-ec-muted">
                  Le fondateur voit les stats, gère les abonnements et le support
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs font-semibold text-ec-muted">
            OffresLocal · Villeneuve, Suisse · 2026
          </p>
        </div>
      </div>
    </div>
  );
}
