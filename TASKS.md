# DRMIS Enterprise Roadmap

---

## Phase A — Foundation *(3–6 months, low cost, do now)*

### Security & Access Control
- [ x] **MFA everywhere** — TOTP already exists; make it mandatory for all staff logins
- [ ] **RBAC per dataset/module** — e.g. MoCCA edits climate only, NDMO views all, field officers edit field-check only (Django Guardian or custom permissions)
- [ ] **Audit logging** — field-level diff log (who changed what, from → to); exportable as CSV/PDF for compliance; separate from Django's `LogEntry`
- [ ] **Security headers** — CSP, HSTS, Permissions-Policy (currently missing)

### Background Tasks
- [ ] **Celery + Redis** — async/background processing for:
  - Large raster ingestion and tile generation
  - Scheduled daily backups with email notification
  - XLSX/PDF exports with many layers
  - Departmental data sync
- [ ] **Job status in UI** — progress bar + toast notification when backup/export completes

### Backup *(extend what's built)*
- [ ] **Scheduled backups** (Celery beat) — daily/weekly with configurable retention
- [ ] **Off-site backup** — S3-compatible (DigitalOcean Spaces already supported); add lifecycle rule to archive/Glacier
- [ ] **Encrypted backups** — AES-256 (add `pyzipper`)
- [ ] **Restore drills** — documented quarterly procedure

### Performance
- [ ] **Redis caching** — replace `LocMemCache` for API responses (area stats, layer metadata, cluster list); cache invalidation on upload
- [ ] **PgBouncer** — connection pooling in Docker Compose

### CI/CD
- [ ] **GitHub Actions** — lint (ruff, black, eslint), pytest + Jest, security scan (bandit, Trivy on Docker image), auto-deploy to staging on merge to `main`

---

## Phase B — Hardening *(6–12 months)*

### Authentication
- [ ] **OAuth2 / OpenID Connect** — `django-oauth-toolkit` + Keycloak or Auth0 as identity provider; SSO for multi-ministry use (MoCCA, MOET, Health, MIPU)
- [ ] **Auto-provision roles** from AD/LDAP groups

### Storage
- [ ] **Full S3 migration** for rasters, PMTiles, media — never stored on container filesystem in production (already partial; complete it)
- [ ] **CDN for PMTiles and TiTiler output** — Cloudflare free tier covers Vanuatu traffic well

### Observability
- [ ] **Prometheus + Grafana** (dockerized) — API latency, DB query times, tile request rates, CPU/memory
- [ ] **Sentry** (or self-hosted Glitchtip) — frontend + backend error tracking with stack traces
- [ ] **Structured JSON logs** → Loki + Grafana (lightweight) or ELK if scale demands it
- [ ] **`/health/` endpoint** — detailed: DB, storage, TiTiler, Redis connectivity
- [ ] **Log rotation + retention policy** in Docker

### API & Integrations
- [ ] **Rate limiting + API keys per department** — already have integration API keys; add throttle limits
- [ ] **Webhooks** — push events to external systems when datasets are updated (e.g. NDMO pulls new cyclone data automatically)
- [ ] **OGC WMS/WFS** — expose PostGIS layers as standard OGC services (via lightweight GeoServer or `django-geojson`) for interoperability with GIS clients (QGIS, ArcGIS)

### Data Governance
- [ ] **Dataset approval workflow** — Draft → Submitted → Under Review → Approved/Rejected; email notifications at each step; field-check confidence % feeds into approval
- [ ] **Versioned datasets** — every dataset has a version history; rollback to any snapshot; "compare versions" view

---

## Phase C — Advanced *(12+ months, seek funding/SPC/World Bank partners)*

### Multi-tenancy & Departmental Views
- [ ] Tenant-aware datasets; each ministry sees their module first by default
- [ ] Custom saveable dashboards per ministry (default layers, map position, charts)
- [ ] Read-only "viewer" tokens for external partners and donors

### Advanced Analysis
- [ ] **Risk calculator** — exposure × vulnerability scoring (basic, expandable)
- [ ] **Spatial joins/buffers** — population/infrastructure within hazard zones (Turf.js + Django GIS)
- [ ] **Scenario comparison** — side-by-side maps with difference layer overlay
- [ ] **Automated hotspot detection** — flag areas with rising damage estimates over time

### Offline & Mobile
- [ ] **Offline-first PWA** — full data entry for field teams in remote areas; GPS-tagged photo uploads attached to field-check records; sync when connectivity restored
- [ ] **Progressive sync** — partial data sync (only province the field officer is assigned to)

### Collaboration
- [ ] Comment threads on datasets and records; @mentions; task assignment in admin
- [ ] Digital signatures on approved disaster assessments (for official government use)
- [ ] **Multi-language** — Bislama + French (i18n); per-user language preference

### Compliance Pack *(NDMO/DCDT)*
- [ ] Mandatory field validation before approval
- [ ] Auto-generated compliance reports in NDMO-required format
- [ ] Data retention policies — auto-archive records older than N years
- [ ] Data lineage — where did this record come from, who touched it

---

## Consolidated Quick Wins

| Feature | Effort | Impact | Phase |
|---|---|---|---|
| Celery + Redis (background tasks) | Medium | Very High | A |
| Scheduled backups to S3 | Low | Very High | A |
| Sentry error tracking | Low | High | A |
| MFA mandatory enforcement | Low | High | A |
| RBAC per dataset/module | Medium | Very High | A |
| Audit log (field-level diff) | Medium | High | A |
| Redis caching hot paths | Low | High | A |
| Prometheus + Grafana | Medium | High | B |
| OAuth2 / SSO (Keycloak) | High | Very High | B |
| Dataset approval workflow | Medium | Very High | B |
| OGC WMS/WFS output | Medium | High | B |
| Versioned datasets | Medium | High | B |
| Offline PWA (field teams) | High | Very High | C |
| Multi-tenancy | High | High | C |
| Risk calculator | High | Very High | C |

---

## What to Tackle First

Given the NDMO handover timeline and multi-ministry adoption goals, the highest-leverage sequence is:

1. **Celery + Redis** — unlocks scheduled backups, async imports, email alerts in one go
2. **RBAC + Audit log** — needed before opening to MoCCA/MOET/MIPU users
3. **Scheduled backups to S3** — non-negotiable before NDMO takes ownership
4. **Sentry + `/health/` endpoint** — fast to add, immediately improves operational confidence
