# CLAUDE.md

Compact working notes for this repository. Keep responses and edits concise and localized.

## Project

- Jekyll site for chaloupkapodlipou.cz.
- Multilingual, currently Czech at `/`, English at `/en/`.
- Main content lives in `pages/` and uses `permalink` front matter.
- Shared UI lives in `_includes/` and `_layouts/`.
- Translations live in `_data/cs.yml` and `_data/en.yml`.
- Theme CSS is in `assets/css/main.css`.
- Site JS is in `assets/js/main.js`.

## Important integrations

- Reservation calendar embed: `_includes/echalupy-calendar.html`, configured by `echalupy_id` in `_config.yml`.
- Reservation form posts to Google Apps Script via `reservation_script_url` in `_config.yml`.
- Do not rename form fields unless the backend script is updated too.
- Placeholder images are intentional until real assets are available.
- Do not edit `_site/`; it is generated output.

## Local workflow

- Assume jekyll was run via `bundle exec jekyll serve --livereload --host 0.0.0.0 --force_polling`
- Open: `http://localhost:4000/`

## Editing rules

- Prefer small, targeted edits.
- Unless specified otherwise, only edit the czech or common files for now. English files are updated after Czech changes are finalized.
- Try to preserve existing Czech/English page structure and permalinks.
- Avoid changing the reservation form or calendar embed unless necessary; they are tightly coupled to external services.
- Try to conserve tokens, dont use js tools unless necessary
- Avoid unnecessary changes to translations or content that is not being actively worked on.
- Keep style changes aligned with the current warm, cottage-like theme.
- Avoid changing generated files or deployment artifacts unless required.
- Check `README.md` and `_config.yml` before changing site-wide behavior.
