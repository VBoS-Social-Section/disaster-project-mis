# DRMIS Tasks

Track progress on tasks. Check off items when complete by changing `[ ]` to `[x]` and committing.

---

## Data & Integration

- [ ] Schedule meeting with Johnie (MoCCA) to walk through Resilience Explorer
- [ ] Identify indicators to incorporate into DRMIS (flood risk, sea level rise, etc.)
- [ ] Receive and document data formats from MoCCA
- [ ] Add Flood as disaster overlay when data received
- [ ] Prepare data ingestion pipeline for MoCCA data formats

---

## Development

- [ ] Extend scenario comparison with year/scenario toggles
- [ ] Improve climate module filters (year, attribute)
- [ ] Add climate indicator placeholders for flood, sea level rise
- [ ] Document data schema template for flood, sea level rise

---

## Deployment & Migration

- [ ] Prepare migration checklist (backups, env vars, SSL, DNS)
- [ ] Migrate DRMIS to NDMO server (drmis.ndmo.gov.vu)
- [ ] Migrate database and assets (PostGIS, datasets, PMTiles)
- [ ] Cutover and go-live
- [ ] Post-migration handover documentation for NDMO

---

## Documentation

- [ ] Draft Phase III proposal for climate module enhancement
- [ ] Update RESILIENCE_EXPLORER_VS_DRMIS with flood, sea level rise
- [ ] Document data gaps (DRMIS needs vs MoCCA can provide)

---

## Maintenance

- [ ] Review and update dependencies (backend, frontend)
- [ ] Run security audit (e.g. `pip audit`, `npm audit`)

---

*Add or edit tasks as needed. To complete a task: change `- [ ]` to `- [x]` and commit.*
