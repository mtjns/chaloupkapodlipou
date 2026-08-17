# Chaloupka pod lípou

Jekyll + Tailwind CSS site for [chaloupkapodlipou.cz](https://chaloupkapodlipou.cz), a holiday cottage in Malé
Svatoňovice (Podkrkonoší). Ported from a Google Sites site. Bilingual: Czech at `/`, English at `/en/`.

## Structure

- `pages/` — page content (`index.html`, `rezervace.html`, `okoli.html`, `404.html`, and their `en/` counterparts).
  Files use `permalink` front matter so their URL doesn't depend on their location in `pages/`.
- `_layouts/` — `default.html` (full nav + footer) and `minimal.html` (bare header, used by the 404 page).
- `_includes/` — shared partials: `head.html`, `nav.html`, `footer.html`, `reservation-form.html`,
  `echalupy-calendar.html`, `area-map.html`, `placeholder-img.html`.
- `_data/cs.yml` / `_data/en.yml` — translated UI strings (nav, footer, form labels) consumed via
  `site.data[page.lang]`. Page body copy itself lives directly in each language's page file.
- `assets/css/main.css` — theme tokens (warm cottage palette) + small custom CSS. Utility classes come from
  the Tailwind CDN build configured in `_includes/head.html`.
- `assets/js/main.js` — mobile nav, scroll-reveal, image carousels, scroll-to-top.

## Reservation form & calendar

- The availability calendar on `/rezervace/` and `/en/reservation/` embeds the existing **e-chalupy.cz** widget
  (`_includes/echalupy-calendar.html`, id in `_config.yml` as `echalupy_id`).
- The contact form (`_includes/reservation-form.html`) posts to a **Google Apps Script Web App** — the endpoint
  is `reservation_script_url` in `_config.yml`. Field names must stay as-is (`email`, `name`, `telefon`,
  `rezervace_od`, `rezervace_do`, `dospeli`, `deti`, `message`, `gdpr`, `botcheck`) since the deployed script
  expects them.

## Assets still needed

Real photos/video are pending — every image on the site currently renders as a labelled placeholder box
(`_includes/placeholder-img.html`) so it's obvious what to drop in and where. Also missing:

- `assets/images/logo/favicon.svg` is a temporary placeholder mark — replace with real branding once available.
- `assets/images/og-image.jpg` (1200×630) for social link previews — referenced in `_config.yml` but not yet present.

## Local development

```
bundle install
bundle exec jekyll serve --livereload --host 0.0.0.0 --force_polling
```

Then visit `http://localhost:4000/` in a browser. The `--force_polling` flag is needed on Windows to get
