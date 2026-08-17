# TODO

## Assets to drop in (see README "Assets still needed")

- [ ] Real logo + favicon (`assets/images/logo/`)
- [ ] Room & exterior/interior photos (currently placeholder boxes on Home and Okolí/Local area)
- [ ] Social share image `assets/images/og-image.jpg` (1200×630)

## Content / features

- [ ] Verify the reservation form's Apps Script endpoint still accepts submissions post-migration
- [ ] Gallery page (optional — not part of the original Google Sites site, ask before adding)

## Calendar styling (deploy dependency)

- [ ] The availability calendar's full theme lives in `assets/css/echalupy.css` and is loaded by the
      e-chalupy iframe via its `extCss` param, hardcoded to `https://chaloupkapodlipou.cz/assets/css/echalupy.css`
      (`_includes/echalupy-calendar.html`). e-chalupy fetches it from the public web, so the polished look
      (rounded month cards, brown headers, sage/terracotta days, diagonal arrival/departure) only activates
      once this site is deployed to chaloupkapodlipou.cz. Locally you see the aligned fallback palette
      (URL params) + auto-height + legend, which is expected.
- [ ] The old `assets.chaloupkapodlipou.cz/echalupy-style.css` is no longer referenced — safe to delete.
