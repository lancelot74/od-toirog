# Curated artwork and launch art brief

## Integrated

- Supplied hero, compatibility and loading PNGs optimized to WebP.
- Supplied eight-second Canvas animation, with its original masks/layers externalized. Only selected printed wheel strokes move. Desktop pointer devices can pause/play; mobile uses its dedicated static portrait, and reduced-motion users start with a still image.
- Original approved emblem retained; simple geometric navbar mark and favicon added.
- A social/Open Graph composition assembled from the supplied artwork.
- Product chart previews use real Swiss Ephemeris reference data and the actual SVG component.
- All twelve supplied 2560×1600 zodiac scenes are imported as optimized 1600px WebP paintings and 640px thumbnails. `scripts/prepare_zodiac_assets.py` reproduces the import.
- The supplied planet SVGs appear in the natal wheel, reading headers, Big Three and placement/aspect tables. Zodiac signs use written Mongolian names in ivory to distinguish them from the gold planet icons. The supplied zodiac sprite remains in the asset library.
- Desktop zodiac guides display the full 8:5 painting without cropping or a dark overlay, with text over its empty left side. Mobile guides use the separate portrait composition described below.
- `/zodiac` and `/zodiac/[slug]` provide illustrated Mongolian guides, linked from the landing page, education index and personal chart.

## Mobile portrait art direction

Imported `mobile-zodiacs-all-12.zip` and `mobile-hero.png` from the supplied Downloads assets. Reproduce with `python3 scripts/prepare_mobile_art.py` (Pillow required). Source hashes, dimensions, and output sizes are recorded in `public/assets/mobile/manifest.json`.

- The twelve zodiac portraits are **1024×1536 (2:3)**. Optimized variants are 384, 768, and 1024 pixels wide.
- The homepage portrait is **1440×2560 (9:16)**. Optimized variants are 450, 900, and 1440 pixels wide.
- A native `<picture>` selects portrait sources at widths up to **900px**, using the image's real proportions. Desktop scenes remain the wider sources. Only the selected source downloads on initial mobile load.
- Zodiac headings stay within the **upper 32%**. Full subjects and their 8–10% side margins remain visible. Gallery names and chart-preview labels use the same quiet upper zone.
- Homepage logo, headline, short introduction, and primary CTA stay within the **upper 35%**. The moon/wheel, mountains, traveler, and winding path retain their original lower placement. Secondary text follows the image instead of covering its scene.
- No portrait is cropped, stretched to a viewport height, shaded with an overlay, or centered like a poster. Natural dark lower transitions meet the page background.
- Mobile top navigation keeps the brand, education, and library links; the existing bottom bar provides Today, Chart, Compatibility, and Profile without repeating those links above the artwork.

`scripts/prepare_assets.py` reproduces the conversion from the named Windows Downloads files. Do not regenerate those approved scenes independently.

## Still needing supplied artwork and human approval

The twelve zodiac illustrations and both symbol sets have now been supplied and integrated. Full planetary illustrations, a light-use brand variant and a report-cover illustration remain optional follow-on art deliveries. The product uses the supplied planet SVGs for functional reading symbols. The original zodiac art brief below is retained as reference, not a request to regenerate the accepted collection.

### Shared art direction (prepend to every request)

> Match the supplied Od Toirog hero and ouroboros/traveler emblem as the art reference. Matte night-black #0B0D10 and deep-indigo #0F1B2D paper; fine, controlled gold #D4AF37 copperplate engraving and restrained ivory #F6F3E6 highlights. Museum astronomical atlas, tactile linework, disciplined geometry, generous negative space. Consistent fine stroke weight, shallow engraving, subdued contrast, no glossy metallic 3D surfaces. No text, numbers, fake chart labels, neon purple, crystals, cartoon faces, horror, scattered particles, or extra symbols. Keep the same border, lighting and gold treatment across the series.

### Zodiac set — original brief (supplied collection integrated)

> Center a single [SUBJECT] as a delicate engraved vignette inside one thin incomplete circular frame. Maintain equal visual scale and margins across the set. The subject occupies the central 55%; the remaining area stays quiet. No text.

Subjects/output names:

1. Aries / `aries.webp`: a poised ram, profile, natural anatomy.
2. Taurus / `taurus.webp`: a calm bull, profile, grounded silhouette.
3. Gemini / `gemini.webp`: two understated classical traveler silhouettes facing outward, no faces.
4. Cancer / `cancer.webp`: a small anatomically coherent crab viewed from above.
5. Leo / `leo.webp`: a resting lion in profile, fine mane engraving.
6. Virgo / `virgo.webp`: a standing robed figure holding a single stem of wheat, face in shadow.
7. Libra / `libra.webp`: a balanced antique beam scale.
8. Scorpio / `scorpio.webp`: a precise scorpion silhouette, arched tail.
9. Sagittarius / `sagittarius.webp`: an antique bow and one arrow, no warrior.
10. Capricorn / `capricorn.webp`: a restrained traditional sea-goat engraving.
11. Aquarius / `aquarius.webp`: a classical vessel pouring a single ribbon of water.
12. Pisces / `pisces.webp`: two fish gently following opposing arcs.

### Planet set — 1024 × 1024

> Center a single [BODY] as an antique astronomical observation plate, 55% of the image width. Scientific-looking engraving, one delicate orbital arc, shared scale/margins. No zodiac motifs, no modern spacecraft, no invented labels.

Bodies: Sun (fine radiating lines), Moon (crater etching), Mercury (small cratered disk), Venus (soft dense cloud bands), Mars (subtle etched terrain), Jupiter (bands and Great Red Spot represented in gold), Saturn (thin correctly aligned rings), Uranus (quiet pale disk and faint tilted ring), Neptune (subtle cloud bands), Pluto (small mottled disk). Output names: `sun.webp` through `pluto.webp`.

### Report cover — 1600 × 2400

> A dark cloth-bound astronomical book cover, straight-on and flat, a restrained gold orbital medallion in the upper third, mountain-path engraving in the lower fifth. Reserve the central third completely empty for real Mongolian typography to be added in code. No generated letters or fake report content.

### Light-use mark

> Adapt the supplied approved ouroboros/traveler emblem for a warm ivory background. Preserve its exact composition and proportions. Use dark indigo engraved lines and selective muted gold. No new ornaments or wording; provide a transparent PNG with clean edges.

No additional hero video is needed: the supplied HTML animation already provides the requested motion. Art approval, resizing and compression remain part of the curated production pipeline.
