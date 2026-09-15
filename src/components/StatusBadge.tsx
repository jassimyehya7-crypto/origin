import { Badge } from "./ui/Badge";
import {
  OFFER_STATUS_LABELS,
  OFFER_TYPE_LABELS,
  RESERVATION_STATUS_LABELS,
} from "@/lib/labels";
import type { OfferStatus, OfferType, ReservationStatus } from "@/lib/types";

export function OfferTypeBadge({ type }: { type: OfferType }) {
  const map = {
    FLASH: "flash",
    PROMO: "promo",
    ARRIVAGE: "arrivage",
    EXCLUSIVITE: "exclusive",
    DERNIERE_MINUTE: "derniere",
  } as const;
  return <Badge variant={map[type]}>{OFFER_TYPE_LABELS[type]}</Badge>;
}

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const map: Record<OfferStatus, "success" | "warning" | "danger" | "muted" | "info"> = {
    BROUILLON: "muted",
    PUBLIEE: "success",
    EPUISEE: "danger",
    EXPIREE: "warning",
    SUSPENDUE: "info",
  };
  return <Badge variant={map[status]}>{OFFER_STATUS_LABELS[status]}</Badge>;
}

export function ReservationStatusBadge({
  status,
}: {
  status: ReservationStatus;
}) {
  const map: Record<
    ReservationStatus,
    "success" | "warning" | "danger" | "muted" | "info"
  > = {
    EN_ATTENTE: "warning",
    CONFIRMEE: "success",
    RECUPEREE: "info",
    REFUSEE: "danger",
    ANNULEE: "muted",
    NON_RECUPEREE: "danger",
    EXPIREE: "warning",
  };
  return (
    <Badge variant={map[status]}>{RESERVATION_STATUS_LABELS[status]}</Badge>
  );
}
