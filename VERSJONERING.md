# Versjonering

Funksjoner og releaser. Endringer i deploy, drift og hemmeligheter ligger i
[CHANGELOG.md](CHANGELOG.md).

Versjonsnumrene her er rene dokumentasjonsmerker, satt i etterkant ut fra git-loggen.
`package.json` står på `1.0.0` og bumpes ikke, og det finnes ingen git-tags — én
versjon her tilsvarer en sammenhengende arbeidsperiode, ikke en utgivelseshandling.
Datoene er første og siste commit i perioden.

## v0.9 – Stage-miljø
*2026-07-30*

### Nytt
- Eget stage-miljø ved siden av produksjon på samme VPS, med egen database, egen
  uploads-katalog og eget subdomene. Push til `stage`-grenen deployer det
- Miljøbanner i UI-et og `noindex`-header når appen ikke kjører som produksjon
- `/health` rapporterer miljø og deployet commit, slik at en deploy kan verifisere
  at riktig bygg faktisk er live
- Stage-data lages av `scripts/refresh-stage-db.sh`: øyeblikksbilde av
  produksjonsdatabasen der e-poster, navn, kommentarer og e-postlogg byttes ut.
  Resultatet er pseudonymisert, ikke anonymt — reservasjons- og lånehistorikk og
  organisasjonsnavn overlever, så stage-tilgang bør holdes intern

### Endret
- Uploads-katalogen kommer fra `UPLOADS_DIR` i stedet for å utledes av `NODE_ENV`
  alene. Stage må kjøre med `NODE_ENV=production` for å servere bygget klient, og
  ville ellers skrevet opplastinger inn i produksjonskatalogen. Ny `APP_ENV` bærer
  miljøidentitet uavhengig av `NODE_ENV`
- Mer luft og bedre linjefall på hjemmesiden

### Sikkerhet
- `/api/debug/uploads` er stengt i produksjon. Det listet innholdet i
  uploads-katalogen til uinnloggede kallere (H1 i sikkerhetsgjennomgangen)

Drift, prosesser og hemmeligheter for denne perioden: se [CHANGELOG.md](CHANGELOG.md).

---

## v0.8 – Landingsside og ny visuell profil
*2026-06-07 – 2026-06-08*

### Nytt
- Landingsside på `/` med HPV-innhold, i stedet for at katalogen møter deg først
- Varm oransje profil erstatter indigo i hele UI-et
- Tre nye språk: spansk, polsk og urdu — til sammen seks (no, en, da, es, pl, ur)
- `text-balance` på overskrifter og brødtekst

### Fikset
- Katalogen vises for uinnloggede besøkende

---

## v0.7 – Medlemsflyt, e-post og passordhåndtering
*2026-04-25 – 2026-04-27*

Den største enkeltperioden i prosjektet. Fase 2 og 3 av MVP-planen.

### Nytt
- E-postutsending virker i drift, og all sendt e-post logges
- Reservasjonssystem, item-håndtering, kalender og tilgjengelighetsvisning (2.1–2.3)
- Utlånslengde som organisasjonspolicy; utsjekk blokkeres ved reservasjonskonflikt
- Brukerdashboard (2.5) og utvidet admin-dashboard (3.1)
- Passordhåndtering for både bruker og admin, og glemt passord-flyt med e-postlenke
- Organisasjonsinnstillinger og medlemsgrupper
- E-postbaserte organisasjonsinvitasjoner, invitasjons-UI i profilen, og invitasjon
  som leder til registrering med forhåndsutfylt e-post
- Registrerings- og medlemskapsflyt (3.4)
- Organisasjonsvelger for plattformadmin; organisasjonsnavn i navbar i stedet for
  apptittel
- Standardkategori opprettes automatisk sammen med ny organisasjon
- Byggetidsstempel i HTML, formatert i Oslo-tid
- Redigeringsdialog for brukere i admin, med tilbakestill passord og slett

### Datamodell
- Nye tabeller: `EmailLog`, `MemberGroup`, `MemberGroupMembership`,
  `OrganizationInvitation`
- `Organization` utvidet: `loanDurationDays`
- `User` utvidet: `resetPasswordToken`, `resetPasswordExpiresAt`

### Fikset
- Sletting av organisasjon kaskaderer nå til all tilhørende data
- Plattformadmin kan sende invitasjoner uten selv å være medlem
- `MEMBER` standardisert som plattformrolle i brukerredigering
- Kategorihenting bruker organisasjonsheaderen, med fallback til standardorganisasjon
  for det offentlige endepunktet
- Admin-data lastes på nytt når man bytter organisasjon
- Invitasjons-e-post henter avsendernavn fra databasen
- Katalogsøket, og søkeknappen flyttet under feltet
- Passordtilbakestillingsmeldinger pakkes i `data`-feltet som resten av API-et

---

## v0.6 – Plattformadmin og organisasjonsprofiler
*2026-04-18 – 2026-04-20*

### Nytt
- Plattformadmin-oversikt på tvers av alle organisasjoner og brukere
- Redigering av brukere (navn, e-post, rolle, organisasjonstilknytning)
- Redigering av organisasjoner, og organisasjonstype med navneforslag
  (forslagene ble fjernet igjen samme uke)
- Org-admins vises øverst i organisasjonsdetaljer
- Ny rolle `ORG_ADMIN` for administratorer avgrenset til én organisasjon
- Språkvelger med SVG-flagg fra Wikimedia Commons og språknavn
- Egen 404-side
- Oversettelser (no/da/en) for admin-UI, plattformoversikt og 404

### API
- Plattformadmin-endepunkter for organisasjons- og brukeroversikt
- Kommentar- og anmeldelsesendepunkter godtar både slug og id, og krever ikke lenger
  organisasjonskontekst

### Datamodell
- `Organization` utvidet: `type`
- Backfill av `slug` på eksisterende items

---

## v0.5 – Slug-URLer og testoppsett
*2026-03-28 – 2026-03-29*

### Nytt
- Items får lesbare URLer: navn i kebab-case pluss seks tegn av id-en
- Testoppsett i tre lag: Vitest unit (node), Vitest browser via Playwright med MSW,
  og Playwright E2E. De gamle jsdom-testene er fjernet

### Datamodell
- `Item` utvidet: `slug` (unik)

### Fikset
- Redirect til slug-URL etter redigering av item
- `/api/locations`-ruten, som ble borte ved en opprydding i byggerekkefølgen
- Servertester: schema pushes til testdatabasene, og auth-testen får egen database
- E2E-tester: fjernet `import.meta.url`, mer spesifikke selektorer

Overgangen fra Fly.io til VPS med PM2 skjedde i samme periode — se
[CHANGELOG.md](CHANGELOG.md).

---

## v0.4 – Mobil, tilgjengelighet og tilstandssporing
*2026-03-22 – 2026-03-23*

Roadmap-oppgavene T01–T17 og T47–T49.

### Nytt
- Mobilvennlig navbar med hamburgermeny (T48)
- Mobilresponsivt admin-dashboard og item-detaljer (T02)
- To-kolonners desktop-layout for item-detaljer og dashboard (T47)
- Katalog på mobil: kategorier som chips og eget søkefelt; anmeldelser og
  kommentarer i høyre kolonne på item-detaljer
- Toast og bekreftelsesmodal erstatter `alert` og `confirm` (T03)
- Lastespinner og bedre tomme tilstander (T04)
- Brukerprofil: endre navn og passord, og se egen aktivitet (T05)
- Rediger-knapp vises bare for eier og admin; statusfelt skjules for vanlige
  brukere (T06)
- E-post ved bekreftet og avbrutt reservasjon (T07)
- Velkomstbanner for nye brukere, vises én gang og kan lukkes (T09)
- Skip-link, synlig fokusring og aria-labels for tastaturnavigasjon (T08, T10)
- Tagger på items og bedre fritekstsøk (T11)
- Tilstandssporing på items, skadenotat ved innlevering og lånehistorikk (T13–T15)
- Flere bilder per item, med rekkefølge (T17)
- Bruksanvisning eller PDF kan lastes opp allerede når verktøyet opprettes (T49)
- «Under utvikling»-merking i UI-et

### Datamodell
- Nye tabeller: `ItemTag`, `ItemImage`
- `Item` utvidet: `condition` (`GOOD` | `FAIR` | `NEEDS_REPAIR`)
- `Loan` utvidet: `damageNote`

### Fikset
- Manglende i18n-nøkkel `admin.loading` (no/da/en)
- Reservasjonsvarsel brukte et felt som ikke fantes på forespørselen
- TS-feil i `ItemImageManager`, `Catalog` og `EditItem`

---

## v0.3 – Lokasjoner, manualer og brukereierskap
*2026-03-21*

### Nytt
- Lokasjoner per organisasjon (navn, adresse, beskrivelse)
- Items kan knyttes til en lokasjon
- Bruksanvisninger på items: opplastet PDF, ekstern lenke eller tekst
- Brukere (MEMBER) kan registrere egne ting som sendes til godkjenning
- MANAGER+ godkjenner eller avviser innsendte ting med valgfri begrunnelse
- E-postvarsler: admins varsles ved innsending, eier varsles ved godkjenning/avvisning

### API
- `GET/POST/PATCH/DELETE /api/locations`
- `POST /api/items/:id/approve`
- `POST /api/items/:id/reject`
- `GET/POST/DELETE /api/items/:id/manuals`
- `POST /api/uploads/manual` (PDF, maks 20 MB)

### Datamodell
- Ny tabell: `Location`
- Ny tabell: `ItemManual`
- `Item` utvidet: `locationId`, `ownerId`, `ownerType`, `approvalStatus`, `rejectionNote`

---

## v0.2 – Bilder og norske tekster
*2026-03-21*

### Nytt
- Alle verktøy og kategorier oversatt til norsk
- Bilder lagt til på alle verktøy (Wikimedia Commons)
- Evobike-bilde for lastesykkel

---

## v0.1 – MVP-grunnlag
*2026-03-15*

### Nytt
- Multi-tenant arkitektur (organisasjoner, medlemskap, roller)
- Brukerpålogging med JWT og bcrypt
- Varekatalog med kategorier og søk
- Reservasjonssystem med konflikthåndtering og kalendervisning
- Inn-/utsjekk av verktøy
- E-postpåminnelser for forfall og forsinkede lån
- Bildeopplasting med automatisk resizing og WebP-konvertering
- Admin-dashboard
- Flerspråklig støtte (norsk, engelsk, dansk)
- Kommentarer og vurderinger på items
- Revisionslogg (audit log)
- Deploy til VPS
