# RAP Cyclone Intensity Integration

This guide describes how to integrate RAP (Rapid Assessment Project) outputs—specifically cyclone intensity by province/area council—into the MIS so users can see which councils are hit by Category 3 vs Category 4.

## Overview

**RAP output**: `Ex_hazard_areas.csv` with columns: National, Province, Area Council, Hazard, Intensity (2–5)

**MIS capability**: Tabular datasets with province/area_council, displayed as choropleths on the map. The MIS already supports:
- `TabularItem` with `province`, `area_council`, `value`, `attribute`, `metadata`
- Choropleth overlay via `AdminAreaLayers` + `useAdminAreaStats`
- Filters: province, area_council, year, metadata

## Implementation Options

### Option A: Use Existing Tabular Import (Recommended)

Transform RAP output to the MIS CSV format and import via Admin → Tabular Dataset → Import CSV.

**1. Create the dataset** (Django Admin):

- **Cluster**: Create or use "Disaster" / "Hazard"
- **Name**: "Cyclone Intensity"
- **Type**: Estimated Hazard Damage
- **Unit**: "Category"

**2. Transform `Ex_hazard_areas.csv`** to MIS format:

| Province | Area Council | Attribute | Value | Year | Month | Cluster | Type |
|----------|--------------|-----------|-------|------|-------|---------|------|
| Malampa | Central Malekula | Intensity | 2 | 2025 | January | Disaster | Estimated Hazard Damage |
| Shefa | Port Vila | Intensity | 4 | 2025 | January | Disaster | Estimated Hazard Damage |

- Include only rows where `Intensity > 0` (affected councils).
- Use the event date for Year/Month.
- `Cluster` and `Type` must match the dataset you created.

**3. Import** via Admin → Tabular Datasets → select "Cyclone Intensity" → Import CSV.

**4. Display**: Enable the "Cyclone Intensity" layer in Disaster mode. The map will show a choropleth by intensity (2–5). Tooltips show area council name and value.

---

### Option B: Dedicated RAP Importer

Add a management command or admin action to import `Ex_hazard_areas.csv` directly.

**1. Extend `vbos-backend/vbos/datasets/utils.py`** — add `HazardCSVRow`:

```python
class HazardCSVRow:
    """Parse Ex_hazard_areas.csv: National, Province, Area Council, Hazard, Intensity."""
    def __init__(self, row: Dict):
        self.metadata = dict(row)
        self.province = (row.get("Province") or "").strip()
        self.area_council = (row.get("Area Council") or row.get("Area.Council") or "").strip()
        self.hazard = (row.get("Hazard") or "Cyclone").strip()
        raw = (row.get("Intensity") or "0").strip()
        self.value = int(raw) if raw.isdigit() else 0
        self.attribute = "Intensity"
```

**2. Add management command** `import_rap_hazard`:

```python
# vbos-backend/vbos/datasets/management/commands/import_rap_hazard.py
import csv
from datetime import date
from django.core.management.base import BaseCommand
from ...models import TabularDataset, TabularItem, Cluster, Province, AreaCouncil

class Command(BaseCommand):
    help = "Import Ex_hazard_areas.csv into Cyclone Intensity dataset"

    def add_arguments(self, parser):
        parser.add_argument("csv_path", type=str)
        parser.add_argument("--year", type=int, default=date.today().year)
        parser.add_argument("--dataset", type=str, default="Cyclone Intensity")
        parser.add_argument("--cluster", type=str, default="Disaster")

    def handle(self, *args, **options):
        # Get or create dataset, then for each row with Intensity > 0:
        # create TabularItem(dataset=..., province=..., area_council=..., attribute="Intensity", value=intensity, ...)
        ...
```

**3. Run**: `python manage.py import_rap_hazard /path/to/Ex_hazard_areas.csv --year 2025`

---

### Option C: Discrete Color Scale for Intensity

The default choropleth uses a continuous gradient. For cyclone categories (2, 3, 4, 5), discrete colors improve clarity.

**1. Add dataset metadata** (optional): `value_type: "ordinal"` or `colormap: "cyclone_intensity"` in TabularDataset (if you add a JSONField or use existing metadata).

**2. Add discrete colormap** in `vbos-frontend/src/components/colors.ts`:

```typescript
/** Cyclone intensity categories: 2=moderate, 3=significant, 4=severe, 5=catastrophic */
export const CYCLONE_INTENSITY_COLORS: Record<number, string> = {
  2: "#fbbf24",  // amber - Cat 2
  3: "#f97316",  // orange - Cat 3
  4: "#dc2626",  // red - Cat 4
  5: "#7f1d1d",  // dark red - Cat 5
};
```

**3. In `AdminAreaLayers.tsx`** — when the active tabular dataset is "Cyclone Intensity" (or has `value_type: "ordinal"`), use discrete coloring:

```typescript
// In getStatsStyle, check if dataset is intensity type
const isIntensityDataset = metadata?.name?.toLowerCase().includes("intensity");
const fillColor = isIntensityDataset && typeof value === "number" && value >= 2 && value <= 5
  ? (CYCLONE_INTENSITY_COLORS[value] ?? mapPalette.choroplethMax)
  : getChoroplethColor(t, mapPalette);
```

**4. Tooltip**: Show "Category X" instead of raw number:

```typescript
if (typeof value === "number" && value >= 2 && value <= 5) {
  lines.push(`Category ${value}`);
} else {
  lines.push(value.toLocaleString(...));
}
```

---

## Filtering by Intensity

Users can filter by intensity using the existing metadata filter on the tabular data API:

```
GET /api/v1/tabular/<id>/data/?metadata=Intensity=3
```

To expose this in the UI:

1. **Attribute filter**: If each row has `attribute=Intensity`, the Attribute filter could show "Intensity" and filter by value.
2. **Custom filter**: Add an "Intensity" dropdown in the Right Sidebar (Disaster mode) that sets `metadata=Intensity=3` (or 4, etc.) when fetching data.

The aggregate endpoint does not currently support metadata filters. To filter the choropleth by intensity, you would need to either:
- Add `metadata` filter to `TabularAggregateView`, or
- Filter on the frontend after fetching (only show councils matching selected intensity).

---

## RAP → MIS Workflow

1. Run RAP report in Vanuatu project → produces `Ex_hazard_areas.csv`
2. Transform to MIS format (or use `import_rap_hazard` if implemented)
3. Import into MIS via Admin
4. In MIS Disaster mode: select cluster, enable "Cyclone Intensity" layer
5. Map shows choropleth: Cat 2 (lighter) to Cat 5 (darkest)
6. Click area council for popup with name and category
7. Optional: filter by intensity in sidebar

---

## Council Name Matching

RAP uses Area Council names from `council_province_lookup.csv`. The MIS uses `AreaCouncil` with `name` from its own geometry. Ensure names match (e.g. "Tanvasoko" vs "Tanavuso" — the RAP has a known GIS mismatch). If names differ, add a mapping in the importer or use `AreaCouncil.objects.filter(name__iexact=...).first()` with fuzzy matching.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Create TabularDataset "Cyclone Intensity" (Cluster: Disaster, Type: Estimated Hazard Damage) |
| 2 | Transform Ex_hazard_areas.csv to MIS CSV format (Province, Area Council, Attribute, Value, Year, Month, Cluster, Type) |
| 3 | Import via Admin CSV import |
| 4 | (Optional) Add discrete color scale and "Category X" tooltip for intensity datasets |
| 5 | (Optional) Add metadata filter to aggregate API + Intensity filter in UI |
