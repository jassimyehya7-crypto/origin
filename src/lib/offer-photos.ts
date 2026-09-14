/** Brand photography for seed / demo offers (by title). */
export const OFFER_PHOTOS: Record<string, string> = {
  "Croissants du soir": "/offers/croissants-phone.png",
  "Snacks + boisson": "/offers/combo-phone.png",
};

export function offerPhoto(title: string): string | undefined {
  return OFFER_PHOTOS[title];
}
