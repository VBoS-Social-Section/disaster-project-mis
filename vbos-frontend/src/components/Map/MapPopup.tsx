import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "@/Theme/popup.css";
import { toSentenceCase } from "@/utils/format";
import type { PopupInfo } from "./index";

const transparentIcon = L.divIcon({
  className: "leaflet-transparent-marker",
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

export function MapPopup(popupInfo: PopupInfo) {
  const { latitude, longitude, datasetName, properties, featureId } = popupInfo;
  const coords = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  return (
    <Marker
      position={[latitude, longitude]}
      icon={transparentIcon}
      key={`${latitude}-${longitude}`}
    >
      <Popup closeButton={false} autoPan={true}>
        <div className="min-w-[12rem] font-sans">
          {datasetName && (
            <h4 className="mb-2 text-sm font-semibold">{datasetName}</h4>
          )}
          {(featureId != null || coords) && (
            <p className="mb-2 text-xs text-muted-foreground">
              {featureId != null && (
                <span className="font-medium">ID {featureId}</span>
              )}
              {featureId != null && coords && " · "}
              {coords && (
                <span title="Match this to Admin → Coords column">{coords}</span>
              )}
            </p>
          )}
          <dl className="space-y-1 divide-y text-sm">
            {Object.entries(properties)
              .filter(([key]) => !["id", "ref", "metadata"].includes(key))
              .map(([key, value]) => {
              const displayValue =
                value === null || value === undefined
                  ? "N/A"
                  : typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value);
              return (
                <div key={key} className="flex items-baseline gap-2 pt-1 first:pt-0">
                  <dt className="min-w-[5rem] shrink-0 text-muted-foreground">
                    {toSentenceCase(key)}
                  </dt>
                  <dd className="max-w-full min-w-0 break-words">
                    {displayValue}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </Popup>
    </Marker>
  );
}
