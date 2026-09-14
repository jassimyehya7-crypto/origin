/** Brand photography for seed / demo offers (by title). */
export const OFFER_PHOTOS: Record<string, string> = {
  "Croissants du soir": "/offers/croissants-phone.png",
  "Snacks + boisson": "/offers/combo-phone.png",
};

/**
 * Resolve display photo: prefer uploaded `imageUrl`, then hardcoded demo map.
 */
export function offerPhoto(
  titleOrOffer: string | { title: string; imageUrl?: string },
  imageUrl?: string
): string | undefined {
  if (typeof titleOrOffer === "object") {
    return titleOrOffer.imageUrl || OFFER_PHOTOS[titleOrOffer.title];
  }
  return imageUrl || OFFER_PHOTOS[titleOrOffer];
}

/** Detect URL encoded into image_emoji when image_url column is missing. */
export const IMAGE_EMOJI_URL_PREFIX = "url:";

export function encodeImageUrlInEmoji(url: string): string {
  return `${IMAGE_EMOJI_URL_PREFIX}${url}`;
}

export function parseImageUrlFromEmoji(
  emoji: string | null | undefined
): string | undefined {
  if (!emoji || !emoji.startsWith(IMAGE_EMOJI_URL_PREFIX)) return undefined;
  const url = emoji.slice(IMAGE_EMOJI_URL_PREFIX.length).trim();
  return url || undefined;
}
