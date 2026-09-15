import type { Offer } from "./types";

export const PROTOTYPE_NOTICE =
  "Offre fictive de démonstration — non publiée par le commerce.";

export function isPrototypeOffer(offer: Pick<Offer, "id">): boolean {
  return offer.id.startsWith("a1_");
}
