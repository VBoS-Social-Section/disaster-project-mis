/**
 * Province, island and town names for the national and regional views.
 *
 * The keyless light/dark basemaps only carry their own labels from zoom 11, so at the
 * zooms people actually start from the map was an unlabelled grey shape. These labels fill
 * that gap and step aside once the basemap's own labels appear.
 */
import { useMemo, useState } from "react";
import { Marker, Pane, useMapEvents } from "react-leaflet";
import L from "leaflet";

type Place = { name: string; lat: number; lng: number };

/** Placed in open water beside each province so they don't sit on top of island names. */
const PROVINCE_LABELS: Place[] = [
  { name: "Torba", lat: -13.55, lng: 168.0 },
  { name: "Sanma", lat: -15.45, lng: 166.2 },
  { name: "Penama", lat: -15.45, lng: 168.65 },
  { name: "Malampa", lat: -16.65, lng: 166.9 },
  { name: "Shefa", lat: -17.3, lng: 167.75 },
  { name: "Tafea", lat: -19.1, lng: 169.85 },
];

const MAJOR_ISLANDS: Place[] = [
  { name: "Espiritu Santo", lat: -15.3, lng: 166.9 },
  { name: "Malekula", lat: -16.25, lng: 167.5 },
  { name: "Efate", lat: -17.67, lng: 168.4 },
  { name: "Erromango", lat: -18.82, lng: 169.15 },
  { name: "Tanna", lat: -19.5, lng: 169.33 },
];

const OTHER_ISLANDS: Place[] = [
  { name: "Torres Is.", lat: -13.25, lng: 166.62 },
  { name: "Vanua Lava", lat: -13.8, lng: 167.47 },
  { name: "Gaua", lat: -14.27, lng: 167.52 },
  { name: "Maewo", lat: -15.15, lng: 168.12 },
  { name: "Ambae", lat: -15.39, lng: 167.84 },
  { name: "Pentecost", lat: -15.75, lng: 168.18 },
  { name: "Malo", lat: -15.68, lng: 167.17 },
  { name: "Ambrym", lat: -16.25, lng: 168.12 },
  { name: "Paama", lat: -16.47, lng: 168.22 },
  { name: "Epi", lat: -16.72, lng: 168.25 },
  { name: "Tongoa", lat: -16.9, lng: 168.55 },
  { name: "Aneityum", lat: -20.2, lng: 169.82 },
];

// Port Vila is not listed: the basemap's reference layer already labels it at every zoom
const TOWNS: Place[] = [
  { name: "Luganville", lat: -15.5126, lng: 167.1766 },
];

/** From this zoom the basemap's own reference labels are available. */
const BASEMAP_LABELS_FROM_ZOOM = 11;

function labelIcon(name: string, kind: "province" | "island" | "town") {
  const span = document.createElement("span");
  span.textContent = name;
  return L.divIcon({
    className: `map-place-label map-place-label--${kind}`,
    html: `${kind === "town" ? "<i></i>" : ""}${span.outerHTML}`,
    iconSize: [0, 0],
  });
}

export function PlaceLabels() {
  const map = useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const [zoom, setZoom] = useState(() => map.getZoom());

  const groups = useMemo(
    () => ({
      provinces: PROVINCE_LABELS.map((p) => ({ ...p, icon: labelIcon(p.name, "province") })),
      major: MAJOR_ISLANDS.map((p) => ({ ...p, icon: labelIcon(p.name, "island") })),
      other: OTHER_ISLANDS.map((p) => ({ ...p, icon: labelIcon(p.name, "island") })),
      towns: TOWNS.map((p) => ({ ...p, icon: labelIcon(p.name, "town") })),
    }),
    [],
  );

  if (zoom >= BASEMAP_LABELS_FROM_ZOOM) return null;

  const visible = [
    ...(zoom <= 8 ? groups.provinces : []),
    ...(zoom >= 7 ? groups.major : []),
    ...(zoom >= 8 ? groups.other : []),
    ...(zoom >= 8 ? groups.towns : []),
  ];

  return (
    // Above data polygons and the vector-tile pane (450), below point markers (600) and
    // popups; never intercepts the mouse
    <Pane name="place-labels" style={{ zIndex: 460, pointerEvents: "none" }}>
      {visible.map((p) => (
        <Marker
          key={`${p.name}-${p.icon.options.className}`}
          position={[p.lat, p.lng]}
          icon={p.icon}
          interactive={false}
          keyboard={false}
        />
      ))}
    </Pane>
  );
}
