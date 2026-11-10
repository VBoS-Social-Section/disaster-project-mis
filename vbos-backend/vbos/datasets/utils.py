import calendar
from datetime import date
from typing import Dict, List

from .models import (
    TYPE_CHOICES,
    AreaCouncil,
    Cluster,
    Province,
    TabularDataset,
    TabularItem,
)


def _norm(name) -> str:
    """Lower-case and drop spaces/punctuation: 'Canal - Fanafo' == 'Canal Fanafo',
    'Bigbay Coast' == 'Big Bay Coast', 'East Vanua Lava' == 'East Vanualava'."""
    return "".join(ch for ch in str(name or "").lower() if ch.isalnum())


_AREA_CACHE = {"at": 0.0, "provinces": {}, "councils": {}}


def _area_lookup():
    """Name lookups for provinces and area councils, without loading their geometries.
    Rebuilt at most once a minute so imports of thousands of rows stay fast."""
    import time

    if time.monotonic() - _AREA_CACHE["at"] > 60 or not _AREA_CACHE["councils"]:
        provinces = {p.pk: p for p in Province.objects.defer("geometry")}
        councils = {}
        for ac in AreaCouncil.objects.defer("geometry"):
            ac.province = provinces[ac.province_id]
            councils[_norm(ac.name)] = ac
        _AREA_CACHE.update(
            at=time.monotonic(),
            provinces={_norm(p.name): p for p in provinces.values()},
            councils=councils,
        )
    return _AREA_CACHE


def resolve_province(name):
    """Province by name, ignoring case, spacing and punctuation. None if not found."""
    return _area_lookup()["provinces"].get(_norm(name)) if _norm(name) else None


def resolve_area_council(name):
    """Area council by name, ignoring case, spacing and punctuation. None if not found."""
    return _area_lookup()["councils"].get(_norm(name)) if _norm(name) else None


class GeoJSONProperties:
    def __init__(self, properties: Dict):
        self.properties = properties
        self.area_council = self.get_property(
            [
                "Area Council",
                "area_council",
                "area council",
                "Area council",
                "acname",
                "AC_NAME",
                "area_council_name",
                "ACNAME22",
                "ACNAME22_2",
            ]
        )
        self.province = self.get_property(
            ["Province", "province", "Pname", "province_name", "Pname_2"]
        )
        self.name = self.get_property(["Name", "name"])
        self.ref = self.get_property(["ref", "Ref", "REF", "id"])
        self.attribute = self.get_property(
            ["Attribute", "attribute", "Type", "type", "TYPE"]
        )

        self.clean_properties()
        self.remove_keys()

    def get_property(self, keys: List[str]) -> str:
        value = ""
        for key in keys:
            try:
                value = self.properties.pop(key)
                break
            except KeyError:
                pass
        return value if value is not None else ""

    def clean_properties(self):
        empty_keys = [
            i[0] for i in self.properties.items() if not i[1] or i[1] == "null"
        ]
        for key in empty_keys:
            self.properties.pop(key)

    def remove_keys(self):
        keys = [
            "PID",
            "PID_2",
            "Pname_2",
            "AC2022",
            "AC2022_2",
            "ACNAME22_2",
        ]
        for key in keys:
            try:
                self.properties.pop(key)
            except KeyError:
                pass


class CSVRow:
    def __init__(self, row: Dict):
        self.metadata = row
        self.area_council = self.get_property(
            ["Area Council", "area_council", "area council", "Area council"]
        )
        self.province = self.get_property(["Province", "province"])
        self.value = self.get_property(["Value", "value", "VALUE"])
        self.attribute = self.get_property(
            ["Attribute", "attribute", "Indicator", "indicator", "Variable", "variable"]
        )
        self.year = self.get_property(["Year", "year", "YEAR"])
        self.month = self.get_property(["Month", "month", "MONTH"])
        self.cluster = self.get_property(["Cluster", "cluster"])
        self.type = self.get_property(["Type", "type"])
        try:
            self.date = date(int(self.year), self.month_name_to_number(), 1)
        except ValueError:
            self.date = None
        self.remove_keys()
        self.clean_metadata()

    def get_property(self, keys: List[str]) -> str:
        value = ""
        for key in keys:
            try:
                value = self.metadata.pop(key)
                break
            except KeyError:
                pass
        return value

    def remove_keys(self):
        keys = [
            "Unit",
            "National",
            "Source",
            "Year Collected",
            "Frequency Collection",
            "Day",
            "Indicator",
        ]
        for key in keys:
            try:
                self.metadata.pop(key)
            except KeyError:
                pass

    def clean_metadata(self):
        empty_keys = [i[0] for i in self.metadata.items() if i[1] == ""]
        for key in empty_keys:
            self.metadata.pop(key)

    def month_name_to_number(self) -> int:
        month_dict = {
            month.lower(): index
            for index, month in enumerate(calendar.month_name)
            if month
        }
        return month_dict.get(self.month.lower()) or 1


def group_by_dataset(data):
    result = {}

    for item in data:
        # Create a unique key based on Type, Cluster, and Indicator
        key = (item["Type"], item["Cluster"], item["Indicator"])

        # If this key doesn't exist in result, create a new entry
        if key not in result:
            result[key] = {
                "Type": item["Type"],
                "Cluster": item["Cluster"],
                "Indicator": item["Indicator"],
                "items": [],
            }

        result[key]["items"].append(item)

    # Convert the dictionary values to a list
    return list(result.values())


REVERSE_TYPE_MAPPING = {str(label): value for (value, label) in TYPE_CHOICES.items()}


def get_dataset(row):
    return TabularDataset.objects.get(
        name=row["Indicator"].strip(),
        cluster=Cluster.objects.get_or_create(name=row["Cluster"].strip())[0],
        type=REVERSE_TYPE_MAPPING[row["Type"]] if row["Type"] else "baseline",
    )


def parse_value(raw: str):
    """Parse value to float, handling commas, spaces, and common non-numeric placeholders."""
    if not raw or not str(raw).strip():
        raise ValueError("Value is empty")
    cleaned = str(raw).strip().replace(",", "").replace(" ", "")
    if cleaned.lower() in ("n/a", "na", "-", "--", "null", "none", ""):
        raise ValueError(f"Cannot parse value: {raw!r}")
    try:
        return float(cleaned)
    except ValueError:
        raise ValueError(f"Cannot convert to number: {raw!r}")


def _resolve_region_to_province_and_ac(region_name: str):
    """Map region name to Province and/or AreaCouncil. Returns (province, area_council)."""
    if not region_name or not str(region_name).strip():
        return None, None
    name = str(region_name).strip()
    if name.lower() == "national":
        return None, None
    # Try province first
    province = resolve_province(name)
    if province:
        return province, None
    # Try area council
    ac = resolve_area_council(name)
    if ac:
        return ac.province, ac
    return None, None


def import_wide_format_csv(reader, dataset: TabularDataset, year: int):
    """
    Import CSV in wide format: one "Region" column (first column if none is named Region),
    other columns = attributes with values. Returns (created_count, error_count, first_error).

    "National" rows are skipped and, once area-council rows are loaded, province rows are
    removed: the app sums the rows it is given, so keeping totals would double count.
    Rows whose region is not a known province or area council are counted as errors.
    """
    rows = list(reader)
    if not rows:
        return 0, 0, None

    headers = list(rows[0].keys())
    region_col = next((h for h in headers if (h or "").strip().lower() == "region"), headers[0])
    value_cols = [h for h in headers if h != region_col and h and h.strip()]

    created_count = 0
    error_count = 0
    first_error = None

    for row in rows:
        region = (row.get(region_col) or "").strip()
        if region.lower() == "national":
            continue
        province, area_council = _resolve_region_to_province_and_ac(region)
        if province is None and area_council is None:
            error_count += 1
            if first_error is None:
                first_error = f"Unknown region: {region!r}"
            continue

        for col in value_cols:
            raw_value = row.get(col, "")
            if not str(raw_value).strip():
                continue  # Skip empty cells in wide format
            try:
                value = parse_value(raw_value)
            except ValueError as e:
                error_count += 1
                if first_error is None:
                    first_error = str(e)
                continue

            attribute = (col or "").strip() or None
            try:
                from datetime import date

                TabularItem.objects.create(
                    dataset=dataset,
                    metadata={"region": region},
                    attribute=attribute,
                    value=value,
                    date=date(year, 1, 1),
                    province=province,
                    area_council=area_council,
                )
                created_count += 1
            except Exception as e:
                error_count += 1
                if first_error is None:
                    first_error = str(e)

    clean_redundant_tabular_items(dataset)
    return created_count, error_count, first_error


def create_tabular_item(csv_row: CSVRow, dataset: TabularDataset):
    attribute = (csv_row.attribute or "").strip() or None
    value = parse_value(csv_row.value)
    province = resolve_province(csv_row.province) if csv_row.province else None
    area_council = (
        resolve_area_council(csv_row.area_council) if csv_row.area_council else None
    )
    return TabularItem.objects.create(
        dataset=dataset,
        metadata=csv_row.metadata,
        attribute=attribute,
        value=value,
        date=csv_row.date,
        province=province,
        area_council=area_council,
    )


def clean_redundant_tabular_items(dataset: TabularDataset):
    items = TabularItem.objects.filter(dataset=dataset)
    # If a dataset has items with an Area Council value,
    # remove all items that don't have the Area Council set
    if items.filter(area_council__isnull=False).count() > 0:
        items.filter(area_council__isnull=True).delete()

    # If a dataset has items with a Province value,
    # remove all items that don't have the Province set
    if items.filter(province__isnull=False).count() > 0:
        items.filter(province__isnull=True).delete()


# Name columns used by source files that have no "Name" property
VECTOR_NAME_KEYS = ["School name", "Road_Name", "NAME", "Facility", "facility_name"]


def vector_item_fields(properties: Dict, geometry: Dict):
    """Turn one GeoJSON feature into VectorItem field values.

    Shared by the admin GeoJSON import and the load_drmis_data command so both treat
    names, area matching and geometry the same way.
    """
    import json

    from django.contrib.gis.geos import GEOSGeometry, WKBWriter

    props = dict(properties or {})
    display = next((props[k] for k in VECTOR_NAME_KEYS if props.get(k)), None)
    meta = GeoJSONProperties(props)

    if not geometry:
        raise ValueError("Feature has no geometry")
    geom = GEOSGeometry(json.dumps(geometry))
    if geom.hasz:  # the geometry column is 2D; drop elevation
        writer = WKBWriter()
        writer.outdim = 2
        geom = GEOSGeometry(writer.write_hex(geom))
    if geom.srid is None:
        geom.srid = 4326
    # Simplify heavy polygons to keep the browser responsive
    if geom.geom_type in ("Polygon", "MultiPolygon") and geom.num_coords > 500:
        geom = geom.simplify(tolerance=0.01, preserve_topology=True)

    area_council = resolve_area_council(meta.area_council)
    province = resolve_province(meta.province)
    # Files without area names: locate the feature by boundary
    if area_council is None and geom.geom_type == "Point":
        area_council = AreaCouncil.objects.defer("geometry").filter(geometry__contains=geom).first()
    if province is None:
        province = (
            area_council.province
            if area_council
            else Province.objects.defer("geometry").filter(geometry__intersects=geom).first()
        )

    name = str(meta.name or "").strip() or (str(display).strip() if display else "")
    ref = str(meta.ref or "").strip()
    return {
        "metadata": meta.properties,
        "name": name[:155] or None,
        "ref": ref[:50] or None,
        "attribute": (str(meta.attribute or "").strip()[:155] or None),
        "province": province,
        "area_council": area_council,
        "geometry": geom,
    }
