import { PickupScanResult } from "./PickupScanResult";

export const dynamic = "force-dynamic";

export default function PickupScanPage({ params }: { params: { token: string } }) {
  return <PickupScanResult token={params.token} />;
}
