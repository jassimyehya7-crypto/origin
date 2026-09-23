alter table public.offers drop constraint if exists offers_offer_type_check;
alter table public.offers add constraint offers_offer_type_check
  check (offer_type in ('FLASH','PROMO','ARRIVAGE','EXCLUSIVITE','DERNIERE_MINUTE'));
