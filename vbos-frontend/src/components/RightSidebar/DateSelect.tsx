import { useDateStore } from "@/store/date-store";
import { Flex, Slider } from "@chakra-ui/react";

export const DateSelect = () => {
  const minYear = 2004;
  const maxYear = new Date().getFullYear();
  const { year, setYear } = useDateStore();

  // Get initial year from URL params if available
  const getInitialYear = () => {
    if (year) return Number(year);
    const params = new URLSearchParams(window.location.search);
    const urlYear = params.get("year");
    return urlYear ? Number(urlYear) : maxYear - 1;
  };

  const marks = [
    { value: minYear, label: minYear.toString() },
    { value: maxYear, label: maxYear.toString() },
  ];

  return (
    <Slider.Root
      width="100%"
      min={minYear}
      max={maxYear}
      defaultValue={[getInitialYear()]}
      onValueChangeEnd={(e) => setYear(String(e.value[0]))}
      colorPalette="blue"
      variant="solid"
    >
      <Flex justify="space-between" align="center" mb="2">
        <Slider.Label>Set year data</Slider.Label>
        <Slider.ValueText fontWeight="bold" />
      </Flex>
      <Slider.Control>
        <Slider.Track />
        <Slider.Thumb
          index={0}
          width={2}
          height={6}
          bg="blue.muted"
          border="1.5px solid"
          borderColor="blue.solid"
          cursor="pointer"
          _dragging={{ cursor: "grab" }}
          _active={{ cursor: "grab" }}
        >
          <Slider.HiddenInput />
          <Slider.DraggingIndicator
            layerStyle="fill.subtle"
            bottom="6"
            rounded="sm"
            px="1.5"
          >
            <Slider.ValueText />
          </Slider.DraggingIndicator>
        </Slider.Thumb>
        <Slider.Marks marks={marks} />
      </Slider.Control>
    </Slider.Root>
  );
};
