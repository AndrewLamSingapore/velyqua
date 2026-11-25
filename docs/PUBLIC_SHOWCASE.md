# Public showcase

The bilingual, standalone evidence-first VELYQUA showcase lives at [`public/showcase.html`](../public/showcase.html).

## Audience routes
- **Employers:** inspect the Expo/TypeScript application, SQLite/outbox architecture, GitHub Actions and engineering audit.
- **Researchers:** review the observational protocol and its unvalidated hypotheses.
- **Classmates and collaborators:** try the clearly fictional four-stage scenario, then follow the working application and GitHub discussion links.

## Publication
The existing `npm run build` uses Expo web export. Confirm that the generated `dist/showcase.html` is present before deploying; the intended production route is `https://velyqua.vercel.app/showcase.html`. This route is **not claimed live** until deployment is independently checked. The new showcase is separate from the existing aquarium application and does not change authentication, storage or production configuration.

## QA checklist
- [ ] `npm ci && npm run verify && npm run build` passes
- [ ] `dist/showcase.html` exists after export
- [ ] Test EN ↔ 中文 switching, four scenario steps and keyboard focus
- [ ] Check mobile at 375 px and desktop at 1440 px
- [ ] Check public app, GitHub, protocol and contact links
- [ ] Confirm no telemetry or welfare claims are presented as real observations
- [ ] Confirm deployment URL and deployed commit before public announcement
- [ ] Obtain human review before merging into `main`

## Claims
The scenario is entirely synthetic and uses no sensor feed. The showcased application implements manual aquarium records and a local-first source architecture. Camera-derived individual-animal inference and autonomous intervention are not shipped or validated. The engineering audit is a review document, not a production certification.
