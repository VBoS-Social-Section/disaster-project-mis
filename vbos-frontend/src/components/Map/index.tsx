import {
  forwardRef,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import ReactMapGl, {
  type MapRef,
  type MapProps,
  ViewStateChangeEvent,
  MapLayerMouseEvent,
  NavigationControl,
  LngLatLike,
  PopupProps,
} from "react-map-gl/maplibre";
import * as maplibregl from "maplibre-gl";
import * as pmtiles from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import { bbox } from "@turf/bbox";
import { featureCollection } from "@turf/helpers";
import { useMapStore } from "@/store/map-store";
import { useAreaStore } from "@/store/area-store";
import { useLayerStore } from "@/store/layer-store";
import { AdminAreaMapLayers } from "./AdminAreaLayers";
import { VectorLayers } from "./VectorLayers";
import { TabularLayers } from "./TabularLayer";
import { Legend } from "./Legend";
import { MapPopup } from "./MapPopup";
import { RasterLayers } from "./RasterLayer";
import { PMTilesLayers } from "./PMTilesLayers";

export interface PopupInfo extends PopupProps {
  properties: Record<string, unknown>;
  datasetName?: string;
  datasetId: string;
}

function Map(props: MapProps, ref: Ref<MapRef | undefined>) {
  const [map, setMap] = useState<MapRef>();
  const setMapRef = (m: MapRef) => setMap(m);
  const { viewState, setViewState } = useMapStore();
  const { ac, acGeoJSON } = useAreaStore();
  const { layers, getLayerMetadata } = useLayerStore();
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

  useEffect(() => {
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    return () => {
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);

  useEffect(() => {
    if (popupInfo && !layers.includes(popupInfo.datasetId)) setPopupInfo(null);
  }, [popupInfo, layers]);

  useImperativeHandle(ref, () => {
    if (map) {
      return map;
    }
  }, [map]);

  const onMove = useCallback(
    (evt: ViewStateChangeEvent) => {
      setViewState(evt.viewState);
    },
    [setViewState],
  );
  const onClick = useCallback(
    (evt: MapLayerMouseEvent) => {
      if (!map) return;
      try {
        const features = map.queryRenderedFeatures(evt.point);

        // Set stats popup
        const statsFeatures = features.filter((i) => i.source === "stats");
        if (statsFeatures.length > 0) {
          // Get the active tabular layer
          const tabularLayers = layers
            .split(",")
            .filter((i) => i.startsWith("t"));
          const metadata = tabularLayers.length
            ? getLayerMetadata(tabularLayers[0])
            : undefined;

          setPopupInfo({
            ...statsFeatures[0],
            longitude: evt.lngLat.lng,
            latitude: evt.lngLat.lat,
            datasetName: metadata?.name,
            datasetId: tabularLayers[0],
          });
          return;
        }

        // Set vector popup
        const vectorFeatures = features.filter(
          (i) => typeof i.source === "string" && i.source.startsWith("v"),
        );
        if (vectorFeatures.length > 0) {
          const source = vectorFeatures[0].source as string;
          const metadata = getLayerMetadata(source);

          setPopupInfo({
            ...vectorFeatures[0],
            longitude: evt.lngLat.lng,
            latitude: evt.lngLat.lat,
            datasetName: metadata?.name,
            datasetId: source,
          });
          return;
        }
        setPopupInfo(null);
      } catch (error) {
        setPopupInfo(null);
        console.error(error);
      }
    },
    [map, layers, getLayerMetadata],
  );

  useEffect(() => {
    if (acGeoJSON?.features?.length && map) {
      const acBbox = ac
        ? bbox(
          featureCollection(
            acGeoJSON.features.filter(
              (i) => i.properties.name.toLowerCase() === ac.toLowerCase(),
            ),
          ),
        )
        : bbox(acGeoJSON);
      map.fitBounds(
        [acBbox.slice(0, 2) as LngLatLike, acBbox.slice(2, 4) as LngLatLike],
        {
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      );
    }
  }, [ac, acGeoJSON, map]);

  return (
    <ReactMapGl
      initialViewState={viewState}
      ref={setMapRef}
      onMove={onMove}
      mapStyle="https://tiles.openfreemap.org/styles/positron"
      touchPitch={false}
      dragRotate={false}
      onClick={onClick}
      {...props}
    >
      <NavigationControl position="bottom-left" showZoom />
      <AdminAreaMapLayers fitBounds={map?.fitBounds} />
      <VectorLayers />
      <TabularLayers />
      <RasterLayers />
      <PMTilesLayers />
      <Legend />
      {popupInfo && <MapPopup {...popupInfo} />}
      {props.children}
    </ReactMapGl>
  );
}

export default forwardRef(Map);
