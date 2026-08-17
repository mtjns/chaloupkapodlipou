# TODO

## Assets to drop in (see README "Assets still needed")
- [ ] Real logo + favicon (`assets/images/logo/`)
- [ ] Room & exterior/interior photos (currently placeholder boxes on Home and Okolí/Local area)
- [ ] Social share image `assets/images/og-image.jpg` (1200×630)

## Content / features
- [ ] Verify the reservation form's Apps Script endpoint still accepts submissions post-migration
- [ ] Gallery page (optional — not part of the original Google Sites site, ask before adding)

## Multilingual (PL/DE)
- [ ] Translate the main pages (Home, Reservation, Area) into Polish and German. Currently `/pl/`
      and `/de/` are minimal home stubs (`_includes/home-stub.html`), and their nav Reservation/Area
      links fall back to the English pages. Info & Privacy already exist in all 4 languages.
- [ ] Once PL/DE main pages exist, update `_data/pl.yml` and `_data/de.yml` nav `reservation_url`/`area_url`
      to point at the real translated URLs instead of the English fallback.

## Calendar styling (deploy dependency)
- [ ] The availability calendar's full theme lives in `assets/css/echalupy.css` and is loaded by the
      e-chalupy iframe via its `extCss` param, hardcoded to `https://chaloupkapodlipou.cz/assets/css/echalupy.css`
      (`_includes/echalupy-calendar.html`). e-chalupy fetches it from the public web, so the polished look
      (rounded month cards, brown headers, sage/terracotta days, diagonal arrival/departure) only activates
      once this site is deployed to chaloupkapodlipou.cz. Locally you see the aligned fallback palette
      (URL params) + auto-height + legend, which is expected.
- [ ] The old `assets.chaloupkapodlipou.cz/echalupy-style.css` is no longer referenced — safe to delete.

## Footer map
- [ ] Refine `map_query` in `_config.yml` to the exact cottage address/pin (currently searches
      "Chaloupka pod lípou, Malé Svatoňovice"). Verify the footer map centers on the right spot.
