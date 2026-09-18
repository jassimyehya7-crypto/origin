import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function HomePage() {
  // Temporary redirect to pro dashboard for preview
  redirect("/pro");
}
