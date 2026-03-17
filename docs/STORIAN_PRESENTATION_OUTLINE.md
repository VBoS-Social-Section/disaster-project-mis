# VBoS Disaster Project – Presentation Outline for ADB/UNDP Storian

**Event:** ADB/UNDP Storian on Climate and Disaster Risk Information  
**Date:** Wednesday 18 March 2026, 9:00–10:30  
**Venue:** Department of Local Authorities (DLA)  
**Presenters:** [Your name] and Susie  

---

## 1. Suggested Presentation Structure (15–20 minutes)

### Slide 1: Title
- **VBoS Disaster Risk Management Information System (DRMIS)**
- Subtitle: Geospatial platform for climate and disaster risk information in Vanuatu
- VBoS logo / project branding

---

### Slide 2: Context & Purpose
- **Why DRMIS?** Vanuatu’s exposure to cyclones, floods, volcanic hazards, and climate change
- **VBoS mandate:** Support provincial and area council planning, budgeting, and disaster preparedness
- **DRMIS role:** Central geospatial platform to integrate baseline data, damage estimates, response resources, and climate information for decision-making

---

### Slide 3: System Overview
- **What it is:** Web-based geospatial MIS (Management Information System)
- **Users:** Provincial administrators, area councils, NDMO, sector ministries, partners
- **Core capabilities:**
  - Interactive maps with multiple layers (raster, vector, PMTiles)
  - Cluster-based views (transportation, administrative, environment, etc.)
  - Filtering by province, area council, disaster type
  - Export of filtered data (XLSX)
  - Cyclone intensity visualisation
  - Climate modules (land cover, coastal shorelines, etc.)

---

### Slide 4: Data Types & Sources
| Category | Examples |
|----------|----------|
| **Baseline** | Land cover, coastal shorelines, infrastructure |
| **Estimated hazard damage** | Damage polygons from past events |
| **Estimated financial damage** | Cost estimates by sector/area |
| **Immediate response resources** | Aid, shelters, health facilities |
| **Climate / environmental** | Land cover, coastal data, cyclone tracks |

- Emphasise: Integration of multiple data sources into one platform

---

### Slide 5: Geographic Coverage
- Provinces and Area Councils
- Admin boundaries, PMTiles for efficient rendering
- Support for national and subnational planning

---

### Slide 6: Current Capabilities (Demo-Ready)
- **Map interface:** Layer switching, zoom, pan, legend
- **Left sidebar:** Dataset selection, cluster views, disaster layers
- **Right sidebar:** Filters, statistics, charts, download
- **Cyclone intensity:** Visualisation of cyclone tracks and intensity
- **Download:** Export filtered data to XLSX for reporting and budgeting

---

### Slide 7: Link to Risk Information & Planning
- **Planning:** Baseline + damage estimates inform provincial and area council plans
- **Budgeting:** Financial damage estimates support resource allocation
- **Preparedness:** Response resources and hazard layers support preparedness planning
- **Recovery:** Post-event damage data informs recovery and reconstruction

---

### Slide 8: Complementarity with Other Initiatives
- **NDMO:** Alignment with national disaster management frameworks
- **Sector ministries:** Shared baseline and damage data
- **Partners (ADB, UNDP, etc.):** Common platform for risk information; potential for shared datasets and standards
- **Other tools:** DRMIS as a hub; can link to or complement other risk information systems

---

### Slide 9: Challenges
- **Data quality & timeliness:** Need for regular updates and validation
- **Field verification:** Gap between modelled estimates and ground truth (Field Check concept under consideration)
- **Capacity:** Training and support for provincial and area council users
- **Integration:** Aligning with other government and partner systems

---

### Slide 10: Opportunities for Collaboration
- **Shared datasets:** Standardised baselines (e.g. land cover, coastal) for joint use
- **Common standards:** Align data formats, taxonomies, and metadata
- **Capacity building:** Joint training on risk information and DRMIS
- **Field verification:** Collaborate on field check / damage verification workflows
- **Reporting:** Link DRMIS exports to national and donor reporting requirements

---

### Slide 11: Next Steps / Roadmap
- User training and rollout
- Field Check feature (mobile app for verification) – under research
- Further integration with climate and disaster datasets
- Feedback loop from users to improve the system

---

### Slide 12: Thank You / Contact
- VBoS contact details
- Invitation for questions and collaboration

---

## 2. Key Messages to Emphasise

1. **DRMIS is operational** – A working platform, not just a concept.
2. **Geographic focus** – Supports provincial and area council level planning.
3. **Integration** – Brings together baseline, damage, response, and climate data in one place.
4. **Open to collaboration** – Aligned with NDMO and partners; seeks shared datasets and standards.
5. **User-centred** – Designed for planners and decision-makers; export and reporting built in.

---

## 3. Preparation Checklist

- [ ] Prepare 10–12 slides (PowerPoint or similar)
- [ ] Include 2–3 live demo screenshots or a short demo video (map, filters, download)
- [ ] Rehearse timing (aim for 15–20 minutes including Q&A)
- [ ] Prepare 1–2 concrete collaboration asks (e.g. shared datasets, joint training)
- [ ] Bring laptop for live demo if venue allows
- [ ] Have user manual or quick reference available for interested participants

---

## 4. Suggested Demo Flow (If Time Permits)

1. Open DRMIS dashboard
2. Show layer selection (e.g. baseline + damage estimate)
3. Filter by province or area council
4. Show right sidebar stats and charts
5. Demonstrate XLSX download
6. Briefly show cyclone intensity layer (if relevant)

---

## 5. Quarto Reveal.js Slides

Slides are available as a Quarto Reveal.js presentation:

- **Source:** `docs/storian-presentation.qmd`
- **Output:** `docs/storian-presentation.html` (self-contained HTML)

**Render command:**
```bash
quarto render docs/storian-presentation.qmd
```

Open `storian-presentation.html` in a browser to present. Use arrow keys or space to advance slides.

---

## 6. References

- `docs/README-user-manual.md` – User manual
- `docs/FIELD_CHECK_FEATURE_SUGGESTION.md` – Field verification concept
- `docs/DEPLOYMENT_VM.md` – Technical deployment (if asked)
- Project repository and documentation in `docs/`

---

*Document prepared for the VBoS disaster project team. Adapt slides and messaging as needed for the actual audience and time allocation.*
