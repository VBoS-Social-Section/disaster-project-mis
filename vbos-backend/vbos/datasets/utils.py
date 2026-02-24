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


class GeoJSONProperties:
    def __init__(self, properties: Dict):
        self.properties = properties
        self.area_council = self.get_property(
            [
                "Area Council",
                "area_council",
                "area council",
                "Area council",
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
        return value

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
    province = Province.objects.filter(name__iexact=name).first()
    if province:
        return province, None
    # Try area council
    ac = AreaCouncil.objects.filter(name__iexact=name).first()
    if ac:
        return ac.province, ac
    return None, None


def import_wide_format_csv(reader, dataset: TabularDataset, year: int):
    """
    Import CSV in wide format: first column = Region, other columns = attributes with values.
    Yields (created_count, error_count, first_error).
    """
    rows = list(reader)
    if not rows:
        return 0, 0, None

    headers = list(rows[0].keys())
    region_col = headers[0]
    value_cols = [h for h in headers[1:] if h and h.strip()]

    created_count = 0
    error_count = 0
    first_error = None

    for row in rows[1:]:
        region = row.get(region_col, "").strip()
        province, area_council = _resolve_region_to_province_and_ac(region)

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

    return created_count, error_count, first_error


def create_tabular_item(csv_row: CSVRow, dataset: TabularDataset):
    attribute = (csv_row.attribute or "").strip() or None
    value = parse_value(csv_row.value)
    province = (
        Province.objects.filter(name__iexact=csv_row.province).first()
        if csv_row.province
        else None
    )
    area_council = (
        AreaCouncil.objects.filter(name__iexact=csv_row.area_council).first()
        if csv_row.area_council
        else None
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
