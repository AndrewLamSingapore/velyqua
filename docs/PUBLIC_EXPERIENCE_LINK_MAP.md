# VELYQUA public experience — canonical link and evidence map

**Prepared:** 18 November 2026. **Status:** integration proposal for review; public Site and PDF URLs were supplied in the prior publication record but were not independently rechecked in this change.

## One authoritative visitor journey

**Primary public Site:** https://velyqua-workspace.five12345.chatgpt.site

**Presentation PDF:** https://velyqua-workspace.five12345.chatgpt.site/VELYQUA-Slides.pdf

**Working application / synthetic walkthrough:** https://velyqua.vercel.app/

**Source and technical evidence:** https://github.com/AndrewLamSingapore/velyqua

**Engineering evidence (draft PR):** https://github.com/AndrewLamSingapore/velyqua/pull/107

**Research protocol:** https://github.com/AndrewLamSingapore/velyqua/blob/main/docs/ANIMAL_ENVIRONMENT_INTELLIGENCE.md

**Contact:** https://authority-engine-app.vercel.app/contact?source=velyqua&intent=collaboration

The PowerPoint deck has speaker notes and is intended for classroom use. Its direct public URL is **not recorded here** because it has not been recovered in a complete, verifiable form. Do not invent a link.

## Public narrative, aligned across channels

1. **One fish:** a particular animal motivates the scientific question. Individual-animal identification and inference are **not** validated capabilities.
2. **Changing tank:** contextual water tests and human observations are recorded in the working manual-first prototype.
3. **Keeper intervention:** a human makes and documents the care decision; the educational walkthrough does **not** actuate hardware.
4. **Follow-up linked to action:** a desired research data model and an educational scenario, **not proof of causal improvement or animal welfare**.

### Claims matrix

| Claim | Classification | Evidence |
| --- | --- | --- |
| Manual water measurements, observations and care logs | Implemented in source | `App.tsx`, `src/product` |
| Local-first record/outbox and account-aware sync | Implemented in source; durability/security need independent tests | `src/storage/sqliteTankStore.ts`, `src/sync/tankSync.ts` |
| Observe → Compare → Respond → Learn | Interactive **synthetic** public demonstration | `src/product/PublicProofExperience.tsx` |
| Animal identity, camera-derived behaviour, biological state inference | Research proposal only | `docs/ANIMAL_ENVIRONMENT_INTELLIGENCE.md` |
| Docker, Kubernetes and new cloud topology | Planning/comparison, not confirmed deployed | Architecture roadmap |
| Quality workflow | Successful scheduled run observed 17 Nov 2026 | https://github.com/AndrewLamSingapore/velyqua/actions/runs/44016690109 |

## Audience routes

- **Classmates/public:** Site → Try interactive demo → View 12-slide deck → Download slide-only PDF.
- **Employers:** Site → Architecture → GitHub source → CI evidence → engineering discussion.
- **Researchers in Wuhan:** Site → animal–environment research question → pilot protocol → request supervised methodological feedback.
- **Potential partners:** Site → limitations and next validation gate → collaboration contact.

## What to do with draft showcase PR #108

PR #108 adds an alternate standalone `public/showcase.html` page. **Do not merge or publish it as a second public homepage by default.** It is a reusable content/interaction prototype, not the authoritative public Site. Extract any useful bilingual copy, accessible scenario interactions or source links into the existing Site only after verifying its editor/source and deployment mechanism. Retain the existing live architecture, decision tracker and deployment comparison.

## Launch checklist

- [ ] Recheck primary Site and PDF URLs from a logged-out browser and mobile.
- [ ] Confirm homepage contains visible **Try the interactive demo** and **View the slides** actions.
- [ ] Ensure the demo and deck both say **synthetic** and separate implemented from planned.
- [ ] Add **Source / Engineering evidence / Research protocol** links to the Site without disturbing the existing workspace.
- [ ] Recover exact downloadable PowerPoint URL from the Site or presentation publisher before linking it.
- [ ] Confirm public PDF is the latest 12-slide version and QR code resolves to the correct live demo.
- [ ] Verify current production revision independently; CI success is not a deployment receipt.
- [ ] Review any licensing/privacy implications before public outreach.
- [ ] Invite structured feedback from classmates, Wuhan engineering employers and aquatic researchers.

**Publication rule:** no claim of new deployment, academic endorsement, validated animal-welfare inference or production security until independently evidenced.
