# Resilience Explorer vs DRMIS – Feature Comparison

**DRMIS** (Disaster Risk Management Information System) is Vanuatu’s custom platform for NDMO and MoCCA. It is built with **Django** (backend) and **React** (frontend).

**Resilience Explorer** is a commercial platform (resilience-explorer.org) by Urban Intelligence for disaster and climate risk.

---

## Cost Comparison

| | **DRMIS** | **Resilience Explorer** |
|---|-----------|--------------------------|
| **Software license** | No license fee (open-source stack: Django, React, PostGIS, Leaflet, TiTiler) | Commercial license – pricing not published; contact Urban Intelligence for quote |
| **Typical cost model** | Infrastructure + development + maintenance | Per-user, annual subscription, or enterprise custom pricing (varies by scope) |
| **Infrastructure** | Self-hosted (e.g. NDMO Dell server); one-time setup | Hosted by provider (included in license) or on-premise (may incur extra) |
| **Development** | In-house or contracted - Initial phase development: Development Seed, Ongoing enhancements: VBoS | Included in license; customisation may incur extra |
| **Data updates** | Own data; RAP outputs; departmental MIS integration | Provider may offer data updates as part of service |
| **Ongoing** | Server, maintenance, support | Annual or multi-year license renewal |

**DRMIS cost drivers:** Server hardware (NDMO already has Dell server), hosting/electricity, development and maintenance effort, data acquisition. No per-user or annual software license.

**Resilience Explorer:** Pricing is tailored per organisation (see [contact form](https://resilience-explorer.org/contact-resilience-explorer/)). Commercial platforms often charge per user, per year, or custom enterprise fees – can be expensive for government budgets.

---

## Customization

### Resilience Explorer – What Can and Cannot Be Customized

| Can be customized | Cannot be customized |
|--------------------|----------------------|
| Data, scenarios, and hazard inputs (FAQ: "Can I update and add new information, data, or scenarios?") | Core platform source code (proprietary) |
| Reports, dashboards, and branding (provider may offer) | Database schema and backend logic |
| Workflow integration (via APIs if offered) | Risk models and algorithms (provider-owned) |
| Scope tailored per organisation (contact provider) | UI components and user experience (unless provider builds it) |

As a commercial product, Resilience Explorer is configured and tailored by the provider. You work within the platform; you do not modify its skeleton.

### DRMIS – Customizable to the Skeleton

**DRMIS is fully customizable to the skeleton.** Because it is open source (Django + React), every layer can be modified:

| Layer | Customizable |
|-------|--------------|
| **Database** | Add tables, fields, indexes; change schema as needed |
| **API** | Add endpoints, change logic, integrate external systems |
| **Frontend** | Modify UI, add views, change workflows, rebrand |
| **Maps** | Swap or add map libraries, layers, controls |
| **Workflows** | Adapt to NDMO/MoCCA processes, add data entry forms, field checks |
| **Risk models** | Implement or replace methodologies; calibrate to Vanuatu data |

VBoS, NDMO, or contracted developers can change any part of the system. No vendor lock-in; no need to request features from a commercial provider.

---

## Feature Comparison


| Resilience Explorer feature              | DRMIS today                      | Feasible to add?                                             |
| ---------------------------------------- | -------------------------------- | ------------------------------------------------------------ |
| **Geospatial mapping**                   | ✅ Yes                            | —                                                            |
| **Layer visualization (raster, vector)** | ✅ Yes                            | —                                                            |
| **Area-level statistics**                | ✅ Yes (province, area council)   | —                                                            |
| **Damage estimates**                     | ✅ Yes (RAP outputs)              | —                                                            |
| **PDF / XLSX export**                    | ✅ Yes                            | —                                                            |
| **Multi-hazard layers**                  | ✅ Yes (cyclone, flood, etc.)     | —                                                            |
| **Offline / field data entry**           | ✅ Yes (PWA)                      | —                                                            |
| **Scenario comparison**                  | ⚠️ Partial (Disaster vs Climate) | ✅ Yes – extend comparison mode                               |
| **Time-based scenarios**                 | ⚠️ Limited (year filter)         | ✅ Yes – add year/scenario toggles                            |
| **3D scenario viewer**                   | ❌ No                             | ✅ Implementable – React + MapLibre GL / Cesium; Django serves tiles |
| **Isolation risk (road disruption)**     | ❌ No                             | ✅ Implementable – road data + routing (pgRouting, OSRM)       |
| **Cascading outages & recovery**         | ❌ No                             | ✅ Implementable – network model + failure logic              |
| **Asset-level direct risk**              | ⚠️ Partial (vector points)       | ✅ Yes – link assets to hazard layers                         |
| **Intervention testing**                 | ❌ No                             | ⚠️ Medium – scenario comparison logic                        |
| **Custom risk registers**                | ⚠️ Partial (tabular export)      | ✅ Yes – templates and filters                                |


---

## DRMIS Tech Stack


| Layer            | Technology                                            |
| ---------------- | ----------------------------------------------------- |
| **Backend**      | Django 5.2, Django REST Framework, PostGIS            |
| **Frontend**     | React 19, Vite 7, TypeScript, Tailwind CSS, shadcn/ui |
| **Maps**         | Leaflet, react-leaflet, protomaps-leaflet             |
| **Raster tiles** | TiTiler (COG/GeoTIFF), PMTiles                        |
| **Database**     | PostgreSQL with PostGIS                               |


For 3D features, adding MapLibre GL JS or Cesium to the React frontend would be required; Django would serve tiles and data via API.

---

## What DRMIS Can Realistically Replicate

1. **Scenario comparison** – Extend existing comparison mode for different years or hazard scenarios.
2. **Time-based scenarios** – Add year/scenario selectors and filters.
3. **Asset-level risk** – Overlay infrastructure points on hazard layers and show exposure.
4. **Custom reporting** – Improve PDF/XLSX templates and filters for risk registers.
5. **Area statistics** – Strengthen aggregation and summaries by province/area council.

---

## What Would Be Difficult (But Implementable)

DRMIS is an ongoing project. All of these can be implemented with sufficient time, data, and effort:

| Feature | What's needed | Feasibility |
|---------|---------------|-------------|
| **3D scenario viewer** | Add MapLibre GL JS or Cesium to React; Django serves terrain/3D tiles via TiTiler or custom endpoints. DEM (elevation) data for Vanuatu. | Implementable |
| **Isolation risk** | Road network data (OpenStreetMap or NDMO data), routing engine (e.g. pgRouting, OSRM), connectivity analysis. | Implementable |
| **Cascading outages** | Infrastructure network model (power, water, telecom), failure propagation logic, recovery time assumptions. | Implementable |
| **Resilience Explorer’s risk models** | Equivalent risk methodology (hazard x exposure x vulnerability), research or adoption of open models (e.g. from academia, UNDRR). | Implementable |

**Summary:** None of these are impossible. They are difficult because they need additional data (roads, DEM, infrastructure networks), new frontend components (3D map) or backend logic (routing, network analysis), and risk methodology and calibration. As an ongoing project, DRMIS can phase these in as priorities and data become available.

---

## Recommendation

- **Yes** – Core features can be built or extended in DRMIS (Django + React).
- **Yes** – Advanced features (3D, isolation risk, cascading outages, risk models) are also implementable; they require more effort, data, and possibly research.
- **Cost** – DRMIS avoids ongoing license fees; Resilience Explorer requires commercial licensing (pricing on request).
- **Customization** – DRMIS is customizable to the skeleton; Resilience Explorer is configured within provider limits.
- **Pragmatic approach** – Prioritise by NDMO/MoCCA needs and data availability. Phase in advanced features as the project evolves.

