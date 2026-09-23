import { FounderChrome } from "@/components/fondateur/FounderChrome";

export const dynamic = "force-dynamic";

export default function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FounderChrome liveClients={0}>{children}</FounderChrome>;
}
