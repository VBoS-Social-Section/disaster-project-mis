import { useEffect } from "react";
import {
  Heading,
  Portal,
  Select,
  createListCollection,
  useFilter,
  useListCollection,
} from "@chakra-ui/react";
import useAreaCouncils from "@/hooks/useAreaCouncils";
import { useAreaStore } from "@/store/area-store";
import { featureCollection } from "@turf/helpers";

const PROVINCES = createListCollection({
  items: [
    { label: "Malampa", value: "Malampa" },
    { label: "Penama", value: "Penama" },
    { label: "Sanma", value: "Sanma" },
    { label: "Shefa", value: "Shefa" },
    { label: "Tafea", value: "Tafea" },
    { label: "Torba", value: "Torba" },
  ],
});

const AreaSelect = () => {
  const { ac, province, setAc, setAcGeoJSON, setProvince } = useAreaStore();
  const { data: areaCouncils, isPending: areaCouncilsIsLoading } =
    useAreaCouncils(province);

  const { contains } = useFilter({ sensitivity: "base" });
  const { collection, set } = useListCollection<{
    label: string;
    value: string;
  }>({
    initialItems: [],
    filter: contains,
  });

  // update Select options
  useEffect(() => {
    set(
      areaCouncils?.features.map((i) => ({
        label: i.properties.name,
        value: i.properties.name,
      })) || [],
    );
  }, [areaCouncils]); // set from useListCollection omitted - may cause render loop if included

  // update AreaStore with the area councils geojson data
  useEffect(() => {
    setAcGeoJSON(areaCouncils || featureCollection([]));
  }, [areaCouncils, setAcGeoJSON]);

  return (
    <>
      <Heading
        flex="1"
        as="h3"
        fontWeight={600}
        fontSize="1rem"
        color="blue.800"
      >
        Administrative Area
      </Heading>
      <Select.Root
        size="md"
        collection={PROVINCES}
        value={[province]}
        onValueChange={(e) => setProvince(e.value[0] || "")}
      >
        <Select.HiddenSelect />
        <Select.Label>Province</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Select a province" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.ClearTrigger />
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content cursor="pointer">
              {PROVINCES.items.map((i) => (
                <Select.Item cursor="pointer" item={i} key={i.label}>
                  {i.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      {province && (
        <Select.Root
          collection={collection}
          paddingTop={2}
          value={[ac]}
          onValueChange={(e) => setAc(e.value[0] || "")}
          disabled={areaCouncilsIsLoading}
        >
          <Select.HiddenSelect />
          <Select.Label>Area Council</Select.Label>
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText
                placeholder={
                  areaCouncilsIsLoading
                    ? "Loading..."
                    : "Select an area council"
                }
              />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.ClearTrigger />
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {collection.items.map((i) => (
                  <Select.Item cursor="pointer" item={i} key={i.label}>
                    {i.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      )}
    </>
  );
};

export { AreaSelect };
