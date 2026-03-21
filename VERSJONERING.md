# Versjonering

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
- Deploy til Fly.io
