import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Smartphone, Store, Settings, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HubPage() {
  return (
    <div className="min-h-dvh bg-ec-paper">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="font-display text-3xl text-ec-ink">Plateforme OffresLocal</h1>
          <p className="mt-2 text-sm font-semibold text-ec-muted">Villeneuve · Hub technique</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
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
            <div className="space-y-2">
              <Link href="/" className="flex items-center justify-between rounded-xl border border-ec-rule bg-ec-soft px-3 py-2 text-sm font-bold text-ec-ink hover:border-ec-blue hover:bg-white">
                <span>Accueil offres</span><ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/q/epicerie-da-silva" className="flex items-center justify-between rounded-xl border border-ec-rule bg-ec-soft px-3 py-2 text-sm font-bold text-ec-ink hover:border-ec-blue hover:bg-white">
                <span>Vitrine commerce</span><ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
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
            <div className="space-y-2">
              <Link href="/pro" className="flex items-center justify-between rounded-xl border border-ec-rule bg-ec-soft px-3 py-2 text-sm font-bold text-ec-ink hover:border-ec-green hover:bg-white">
                <span>Dashboard</span><ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pro/offres" className="flex items-center justify-between rounded-xl border border-ec-rule bg-ec-soft px-3 py-2 text-sm font-bold text-ec-ink hover:border-ec-green hover:bg-white">
                <span>Gestion offres</span><ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pro/parametres" className="flex items-center justify-between rounded-xl border border-ec-rule bg-ec-soft px-3 py-2 text-sm font-bold text-ec-ink hover:border-ec-green hover:bg-white">
                <span>Magasin</span><ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 rounded-xl border border-ec-blue/30 bg-blue-50 p-3">
              <p className="text-xs font-extrabold text-ec-blue">Code PIN : 1234</p>
            </div>
          </div>
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
            <div className="space-y-2">
              <Link href="/fondateur" className="flex items-center justify-between rounded-xl border border-ec-rule bg-ec-soft px-3 py-2 text-sm font-bold text-ec-ink hover:border-ec-yellow hover:bg-white">
                <span>Tableau de bord</span><ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 rounded-xl border border-ec-yellow/30 bg-yellow-50 p-3">
              <p className="text-xs font-extrabold text-ec-ink">Code PIN : 5678</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
