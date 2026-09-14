import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center bg-ec-paper px-4 text-center">
      <h1 className="font-display text-3xl text-ec-ink">Page introuvable</h1>
      <p className="mt-2 text-sm font-semibold text-ec-muted">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-[12px] bg-ec-ink px-4 py-2.5 text-sm font-extrabold text-white"
      >
        Retour aux offres
      </Link>
    </div>
  );
}
