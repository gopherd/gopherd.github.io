# Gopherd

English-language website for independent utility app developers, built with Hugo using the existing `content/`, `layouts/`, `static/`, and `themes/` structure.

## Pages

- `/`: developer introduction
- `/privacy-policy/`: privacy policy
- `/terms-of-service/`: terms of service

Content lives in `content/`; shared templates live in `layouts/`; styling lives in `assets/css/style.css`. The vendored Researcher theme is retained, with site-specific template overrides. No JavaScript or external frontend dependencies are required. Manrope and Instrument Serif are served locally from `static/fonts/`, with their SIL Open Font Licenses included.

## Development

Use Hugo 0.92.1 (the version pinned in CI). Run `hugo server -D` for a local preview. Run `hugo --minify --cleanDestinationDir` for a production build into `public/`.

GitHub Actions builds pull requests and deploys pushes to `main` to GitHub Pages. `static/CNAME` preserves the `gopherd.com` domain. Publishing replaces the previous generated site so removed blog routes and assets are not retained.

The contact address is configured in `config.toml` and also appears in the legal Markdown pages. Keep these values in sync when changing it. Before applying the general policies to a particular app, align its data disclosures, permissions, third-party services, and purchase terms with that app’s actual behavior.
