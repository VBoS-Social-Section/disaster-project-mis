import { Popup } from "react-map-gl/maplibre";
import "@/Theme/popup.css";
import { DataList, Heading } from "@chakra-ui/react";
import { toSentenceCase } from "@/utils/format";
import { PopupInfo } from "./index";

export function MapPopup(popupInfo: PopupInfo) {
  const { latitude, longitude, datasetName, properties } = popupInfo;
  return (
    <Popup
      latitude={latitude}
      longitude={longitude}
      key={latitude + longitude}
      offset={[0, -10]}
      closeButton={false}
      style={{ fontFamily: "var(--chakra-fonts-body)" }}
      closeOnClick={false}
    >
      {datasetName && (
        <Heading size="xs" mb={2}>
          {datasetName}
        </Heading>
      )}
      <DataList.Root
        orientation="horizontal"
        divideY="1px"
        size="sm"
        maxW="sm"
        gap={1}
      >
        {Object.entries(properties).map(([key, value]) => (
          <DataList.Item
            alignItems="baseline"
            key={key}
            _notFirst={{ pt: "1" }}
          >
            <DataList.ItemLabel minW="5rem">
              {toSentenceCase(key)}
            </DataList.ItemLabel>
            <DataList.ItemValue maxW="100%" display="inline-block">
              {value !== null && value !== undefined ? String(value) : "N/A"}
            </DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList.Root>
    </Popup>
  );
}
