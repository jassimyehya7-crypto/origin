import { FounderChrome } from "@/components/fondateur/FounderChrome";
import { getLiveClients } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let live = 0;
  try {
    live = await getLiveClients();
  } catch {
    live = 0;
  }
  return <FounderChrome liveClients={live}>{children}</FounderChrome>;
}
