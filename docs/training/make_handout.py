from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (BaseDocTemplate, Flowable, Frame, KeepTogether, PageBreak,
                                PageTemplate, Paragraph, Spacer, Table, TableStyle)

OUT = "/out/drmis-cyclone-exercises.pdf"
NAVY = colors.HexColor("#0F1E3D")
BLUE = colors.HexColor("#2563EB")
SOFT = colors.HexColor("#475569")
PALE = colors.HexColor("#E3EAF8")
LINE = colors.HexColor("#9AA7BD")
W, H = A4
LM = RM = 18 * mm
CW = W - LM - RM

base = ParagraphStyle("base", fontName="Helvetica", fontSize=10.5, leading=14.5, textColor=colors.black)
small = ParagraphStyle("small", parent=base, fontSize=9, leading=12, textColor=SOFT)
h1 = ParagraphStyle("h1", parent=base, fontName="Helvetica-Bold", fontSize=22, leading=26, textColor=NAVY)
h2 = ParagraphStyle("h2", parent=base, fontName="Helvetica-Bold", fontSize=14, leading=18, textColor=NAVY,
                    spaceBefore=10, spaceAfter=4)
h3 = ParagraphStyle("h3", parent=base, fontName="Helvetica-Bold", fontSize=11, leading=15, textColor=BLUE,
                    spaceBefore=8, spaceAfter=3)
code = ParagraphStyle("code", parent=base, fontName="Courier-Bold", fontSize=9.5, leading=13)
cell = ParagraphStyle("cell", parent=base, fontSize=10, leading=13)
cellb = ParagraphStyle("cellb", parent=cell, fontName="Helvetica-Bold")


class Box(Flowable):
    """Empty tick box."""
    def __init__(self, size=4.2 * mm):
        super().__init__()
        self.size = size
        self.width = size
        self.height = size

    def draw(self):
        self.canv.setLineWidth(1)
        self.canv.setStrokeColor(colors.black)
        self.canv.rect(0, 0, self.size, self.size)


def P(t, s=base):
    return Paragraph(t, s)


def check(text, s=base):
    t = Table([[Box(), P(text, s)]], colWidths=[7 * mm, CW - 7 * mm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 1.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
                           ("TOPPADDING", (0, 0), (0, 0), 3)]))
    return t


def field(label, label_w=60 * mm, line_w=None):
    line_w = line_w or (CW - label_w)
    t = Table([[P(label, cell), ""]], colWidths=[label_w, line_w], rowHeights=[8 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([("LINEBELOW", (1, 0), (1, 0), 0.8, LINE), ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
    return t


def lines(n, h=8 * mm):
    t = Table([[""]] * n, colWidths=[CW], rowHeights=[h] * n)
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.8, LINE)]))
    return t


def codebox(rows):
    t = Table([[P(r, code)] for r in rows], colWidths=[CW])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), PALE), ("LEFTPADDING", (0, 0), (-1, -1), 8),
                           ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    return t


def note(text):
    t = Table([[P(text, base)]], colWidths=[CW])
    t.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 1, NAVY), ("LEFTPADDING", (0, 0), (-1, -1), 8),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 6),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    return t


def grid(data, widths, header=True, row_h=None):
    rows = []
    for i, r in enumerate(data):
        st = cellb if (header and i == 0) else cell
        rows.append([P(c, st) for c in r])
    t = Table(rows, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT",
              rowHeights=([None] + [row_h] * (len(rows) - 1)) if row_h else None)
    style = [("GRID", (0, 0), (-1, -1), 0.6, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
             ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]
    if header:
        style.append(("BACKGROUND", (0, 0), (-1, 0), PALE))
    t.setStyle(TableStyle(style))
    return t


def banner(label, title):
    t = Table([[P(f"<font color='white'><b>{label}</b></font>", base), P(f"<font color='white'><b>{title}</b></font>", base)]],
              colWidths=[34 * mm, CW - 34 * mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NAVY), ("TOPPADDING", (0, 0), (-1, -1), 5),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 5), ("LEFTPADDING", (0, 0), (-1, -1), 8)]))
    return t


def on_page(canv, doc):
    canv.saveState()
    canv.setFont("Helvetica", 8.5)
    canv.setFillColor(SOFT)
    canv.drawString(LM, 10 * mm, "DRMIS Backend Training  |  When a Cyclone Strikes  |  Exercise handout")
    canv.drawRightString(W - RM, 10 * mm, f"Page {doc.page}")
    canv.restoreState()


doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=LM, rightMargin=RM, topMargin=16 * mm, bottomMargin=18 * mm,
                      title="DRMIS Backend Training: When a Cyclone Strikes - Exercise handout",
                      author="DRMIS training")
doc.addPageTemplates([PageTemplate(id="p", frames=[Frame(LM, 18 * mm, CW, H - 34 * mm, id="f", leftPadding=0,
                                                         rightPadding=0, topPadding=0, bottomPadding=0)],
                                   onPage=on_page)])
S = []

# ---------------------------------------------------------------- page 1
S += [P("When a Cyclone Strikes", h1),
      P("DRMIS backend training: exercise handout", ParagraphStyle("sub", parent=base, fontSize=13, leading=17, textColor=BLUE)),
      Spacer(1, 6),
      field("Name", 25 * mm, 70 * mm), field("Date", 25 * mm, 70 * mm), field("Role today (circle)", 40 * mm),
      P("Analyst  /  Data admin  /  Server admin  /  all three", small),
      Spacer(1, 4),
      note("Practise on a <b>copy or test server</b> first. If you must use drmis.info, use the name "
           "<b>Cyclone Zara (practice)</b> and ask the trainer to delete it afterwards."),
      P("The scenario (fictional, for practice)", h2),
      P("Cyclone Zara makes landfall on <b>12 November 2026</b>. VMGD's track map shows <b>Category 4</b> over Central "
        "Malekula and North Ambrym, <b>Category 3</b> over the Ambrym and Malekula councils next to them, and "
        "<b>Category 2</b> further out. Ministers want damage, response needs and cost estimates in DRMIS within hours."),
      P("Roles", h2),
      grid([["Role", "Does", "Where"],
            ["Analyst", "Sets intensity, runs RAP, exports CSVs and map files", "Own computer (R, Quarto)"],
            ["Data admin", "Logs in to the backend, creates the event, uploads CSVs and the map layer", "https://drmis.info/admin/"],
            ["Server admin", "Restarts the web container, keeps the rollback copies", "The DRMIS server"]],
           [28 * mm, CW - 28 * mm - 48 * mm, 48 * mm]),
      Spacer(1, 3),
      P("One person can play all three roles. The seven steps are the same either way.", small),
      P("Before you start: tick each one", h2),
      check("<b>R 4.0 or later and Quarto.</b> Check with <font face='Courier-Bold'>Rscript --version</font> and "
            "<font face='Courier-Bold'>quarto --version</font>."),
      check("<b>The RAP repository.</b> <font face='Courier-Bold'>git clone https://github.com/DRMIS-VBoS/disaster-project-rap.git</font>, "
            "then open a terminal in that folder. All commands run from there."),
      check("<b>tippecanoe</b> turns GeoJSON into the map tile file. Check with <font face='Courier-Bold'>tippecanoe --version</font>."),
      check("<b>A DRMIS backend login</b> at https://drmis.info/admin/ for a staff account in the Data Admin group."),
      P("How the data moves", h2),
      P("NDMO intensity per council &gt; RAP report &gt; CSV tables and a map file &gt; one Disaster event in DRMIS &gt; "
        "public dashboard. Both tables and map layer are tied to one event, so visitors see them only when that event is picked."),
      PageBreak()]

# ---------------------------------------------------------------- exercise 1, analyst
S += [banner("EXERCISE 1", "Cyclone Zara, as written: Steps 0 to 3 (Analyst)"), Spacer(1, 4)]
S += [P("Step 0 and 1: set the intensity per Area Council", h3),
      check("I have NDMO's bulletin and saved a copy next to the inputs as evidence."),
      check("<font face='Courier-Bold'>cp data/Ex_hazard_areas_template.csv data/Ex_hazard_areas.csv</font> "
            "(the template is never edited)."),
      check("I edited <b>only</b> <font face='Courier-Bold'>Ex_hazard_areas.csv</font>, before running RAP."),
      P("Set these rows. Every other council stays at 0. Save as CSV UTF-8 with the five column headings unchanged.", base),
      Spacer(1, 3),
      grid([["Area Council", "Province", "Hazard", "Intensity"],
            ["Central Malekula", "Malampa", "Cyclone", "4"],
            ["North Ambrym", "Malampa", "Cyclone", "4"],
            ["North West Malekula", "Malampa", "Cyclone", "3"],
            ["North East Malekula", "Malampa", "Cyclone", "3"],
            ["South West Malekula", "Malampa", "Cyclone", "2"]],
           [58 * mm, 36 * mm, 36 * mm, CW - 130 * mm]),
      Spacer(1, 3),
      check("Each council name is spelled exactly as in <font face='Courier-Bold'>data/council_province_lookup.csv</font>. "
            "A misspelling is silently treated as unaffected."),
      P("Step 2: run RAP", h3),
      codebox(["quarto render index.qmd --to html"]),
      Spacer(1, 3),
      check("Only the councils I set show damage; the rest show zeros."),
      check("Category 4 councils show more damage than Category 2 councils in the same sector."),
      check("<font face='Courier-Bold'>QC_baseline_coverage.csv</font> has no gaps for my councils."),
      check("The report finished without an error. I did <b>not</b> edit any output CSV by hand."),
      Spacer(1, 3),
      field("National total of damaged schools (from index.html)", 100 * mm),
      P("Step 3: export the files DRMIS needs", h3),
      codebox(["Rscript scripts/export_hazard_for_mis.R --year 2026",
               "Rscript scripts/export_intensity_geojson.R",
               "./scripts/export_intensity_pmtiles.sh"]),
      Spacer(1, 3),
      check("<font face='Courier-Bold'>output/area_councils_intensity.pmtiles</font> exists and is dated today."),
      check("<font face='Courier-Bold'>jq '[.features[] | select(.properties.Intensity &gt; 0) | .properties.acname]' "
            "output/area_councils_intensity.geojson</font> lists exactly the five councils above."),
      PageBreak()]

# ---------------------------------------------------------------- exercise 1, data admin
S += [banner("EXERCISE 1", "Cyclone Zara, continued: Steps 4 to 7 (Data admin)"), Spacer(1, 4)]
S += [P("Step 4: log in", h3),
      check("Signed in at https://drmis.info/admin/ with my own staff account (not a superuser)."),
      check("I can see the <b>Datasets</b> menu: Clusters, Disaster events, PMTiles Datasets, Raster datasets, Raster files, "
            "Tabular datasets, Tabular items, Vector datasets, Vector items."),
      P("Step 5: import the event", h3),
      P("Datasets, Tabular items, <b>Import</b>.", base),
      check("Step 1 of the page: selected every CSV in the RAP <font face='Courier-Bold'>output/</font> folder."),
      check("Step 2: each file matches the <b>original</b> dataset, never one ending \"- event name\". "
            "I removed files with no dataset, such as the QC_ files."),
      check("Step 3: CSV format <b>Wide format</b>, Year <b>2026</b>."),
      check("New event block filled in as below, with the .pmtiles and .geojson files chosen."),
      Spacer(1, 3),
      grid([["Event name", "Hazard", "Start date"], ["Cyclone Zara", "Cyclone", "12 Nov 2026"]],
           [70 * mm, 50 * mm, CW - 120 * mm]),
      Spacer(1, 3),
      check("Clicked <b>Import Files</b>. Green message, no red message."),
      field("Tables created, as the green message says (expect 28)", 100 * mm),
      P("If you got red text instead, copy it here:", small),
      lines(2),
      P("Step 6: check the event in the admin", h3),
      check("Datasets, Disaster events: Cyclone Zara is listed. Linked layers / tables reads "
            "<font face='Courier-Bold'>____ / ____</font> (expected 1 / 28)."),
      check("Datasets, Tabular datasets, filtered by event Cyclone Zara: 28 datasets named \"... - Cyclone Zara\"."),
      check("Datasets, PMTiles Datasets: Cyclone Intensity - Cyclone Zara. URL "
            "<font face='Courier-Bold'>media/cyclone_zara_intensity.pmtiles</font>, source layer "
            "<font face='Courier-Bold'>councils</font>, cyclone name Cyclone Zara."),
      check("Opened a few Tabular items; the values match the RAP CSVs."),
      P("Step 7: verify on the public site (private browser window)", h3),
      check("Opened https://drmis.info, picked year 2026 and event Cyclone Zara."),
      check("The Cyclone Intensity layer appears, coloured by category."),
      check("Impact summary national totals match <font face='Courier-Bold'>index.html</font> from Step 2."),
      check("Malampa, then Central Malekula: the right-hand panel shows <b>Category 4</b> and that council's damage."),
      check("Switched to another event or year: Zara's figures disappeared."),
      Spacer(1, 3),
      field("What I checked, and the time", 56 * mm),
      PageBreak()]

# ---------------------------------------------------------------- exercises 2-4
S += [banner("EXERCISE 2", "A mistake"), Spacer(1, 4),
      P("NDMO corrects its bulletin: <b>North Ambrym is Category 2</b>, not 4. Change it in the CSV, then redo Steps 2, 3, 5 and 6. "
        "Remember a new event name is needed (reusing a name and year is refused), and the old practice event must be deleted by the server admin first.", base),
      Spacer(1, 3),
      field("North Ambrym panel before (category and damage figure)", 98 * mm),
      field("North Ambrym panel after", 98 * mm),
      field("Which step did you repeat first, and why?", 80 * mm),
      Spacer(1, 8),
      banner("EXERCISE 3", "A bad name"), Spacer(1, 4),
      P("Misspell one council on purpose (for example <b>North West malekula</b> in lower case), run RAP and the import, and find the error "
        "message. DRMIS matches names exactly, and an import with one unknown name saves <b>nothing</b>.", base),
      Spacer(1, 3),
      field("The message the import showed", 56 * mm),
      lines(1),
      field("Where did you correct the name?", 56 * mm),
      check("After the fix, the import succeeded and nothing was left half-imported."),
      Spacer(1, 8),
      banner("EXERCISE 4", "A second cyclone"), Spacer(1, 4),
      P("Create a second event, <b>Cyclone Yasi</b>, with different councils, using a new start date and a new event name. "
        "Then switch between the two events on the public site.", base),
      Spacer(1, 3),
      grid([["Area Council (exact spelling)", "Province", "Intensity (2 to 5)"],
            ["", "", ""], ["", "", ""], ["", "", ""], ["", "", ""]],
           [78 * mm, 50 * mm, CW - 128 * mm], row_h=9 * mm),
      Spacer(1, 3),
      check("Both events appear in the header picker, each with its own layer and figures."),
      field("What happened to Zara's figures when you picked Yasi?", 90 * mm),
      lines(1),
      PageBreak()]

# ---------------------------------------------------------------- troubleshooting + sign-off
S += [P("When things go wrong", h2),
      grid([["Symptom", "Likely cause and fix"],
            ["Import says <b>Unknown region</b>", "A council name in the CSV differs from DRMIS (for example Tanvasoko against Tanavuso, "
             "or North West malekula in lower case). Correct the name in RAP's inputs and rerun."],
            ["RAP: <b>Join columns must be present</b>", "Ex_hazard_areas.csv lost its Area Council heading. Restore the five headings from the template."],
            ["RAP: <b>object 'ecce_schools' not found</b>", "The baseline file is missing Education rows. Check data/1c_input_baseline.csv has ecce, primary and secondary."],
            ["RAP: <b>Missing required files</b>", "One of the seven input files was renamed, moved or deleted. Restore it under its exact original name."],
            ["Layer shows old colours or old data", "Cached tiles or API answers. Ask the server admin to restart the web container, then hard refresh (Ctrl+Shift+R)."],
            ["Layer missing for the event", "The PMTiles dataset has no Event. Set it on the PMTiles dataset page."],
            ["Delete or import is refused", "Your account lacks permission, or a very large selection hit the form limit. Check the Data Admin group; delete in smaller batches."],
            ["Map layer will not load", "The .pmtiles file is not in media/, or the URL or source layer is wrong. Check the path and that the source layer is <b>councils</b>."]],
           [56 * mm, CW - 56 * mm]),
      Spacer(1, 4),
      note("<b>Wrong intensity found after upload?</b> Fix Ex_hazard_areas.csv, rerun Steps 2 and 3, have the server admin delete the wrong "
           "event and its datasets, then repeat Step 5 with a new event name and Step 6. Never edit rows by hand in the admin. "
           "<b>Rollback:</b> the server admin restores the database dump taken before the change and puts the previous .pmtiles file back."),
      P("Sign-off checklist", h2),
      check("Event created with the correct start date."),
      check("Ex_hazard_areas.csv edited from NDMO's intensity per council <b>before</b> the run, and reviewed by a second person against the bulletin."),
      check("RAP rendered with no errors and totals sanity-checked."),
      check("28 new Cyclone Zara datasets created, linked to the event and filled."),
      check("Map layer created and linked to the event; cache cleared if needed."),
      check("Public site verified in a private window and the check written down."),
      check("Old tile file and a database dump kept for rollback."),
      Spacer(1, 10),
      field("Participant (name and signature)", 62 * mm), field("Reviewer (name and signature)", 62 * mm),
      field("Date and time", 62 * mm)]

doc.build(S)
print("built", OUT)
