#!/usr/bin/env bash
set -euo pipefail

src="../generated_images"
dest="public/offers/a1"
mkdir -p "$dest"

convert "$src/exec-b1050bb1-2722-411b-b912-bb571858ae12.png" -resize '1200x1200>' -quality 82 "$dest/epicerie-da-silva.webp"
convert "$src/exec-db8b4615-2cd5-4933-b04d-ae6ae9538dbe.png" -resize '1200x1200>' -quality 82 "$dest/boulangerie-durgnat.webp"
convert "$src/exec-3b1c0ed3-e3ac-4f60-ac0a-3807b1248789.png" -resize '1200x1200>' -quality 82 "$dest/macheret-fromage.webp"
convert "$src/exec-b7e93f99-d786-48d2-969a-5df3dca435e4.png" -resize '1200x1200>' -quality 82 "$dest/boucherie-fontaine.webp"
convert "$src/exec-e90ca2c2-cceb-478f-8c75-2edc79da885a.png" -resize '1200x1200>' -quality 82 "$dest/boucherie-2-freres.webp"
convert "$src/exec-753e6bf4-93e3-42f0-9289-d89277ed336c.png" -resize '1200x1200>' -quality 82 "$dest/poulet-enfer.webp"
convert "$src/exec-4a73c900-e8dc-46f1-9239-1286836b579f.png" -resize '1200x1200>' -quality 82 "$dest/kiosque-gare.webp"
convert "$src/exec-169c1a32-1987-49a5-9cc6-44ab64c0b021.png" -resize '1200x1200>' -quality 82 "$dest/kiosque-leman.webp"
convert "$src/exec-c352f600-884e-470b-a800-a82aa63f3bcb.png" -resize '1200x1200>' -quality 82 "$dest/the-house-fortune.webp"
convert "$src/exec-29720309-e84c-4bdf-8577-a9d212562292.png" -resize '1200x1200>' -quality 82 "$dest/by-hani.webp"
convert "$src/exec-eda3c573-0b29-4629-b6b5-7ceca5000356.png" -resize '1200x1200>' -quality 82 "$dest/elegance-barber.webp"
convert "$src/exec-b3c9bba3-6405-4612-b456-294496e1feed.png" -resize '1200x1200>' -quality 82 "$dest/sos-lessive.webp"
