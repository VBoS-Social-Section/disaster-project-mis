/**
 * OpacityControl component provides a popover slider for adjusting layer opacity.
 *
 * Uses Chakra UI's Popover and Slider components to allow users to interactively
 * adjust the opacity of map layers from 0% (fully transparent) to 100% (fully opaque).
 */

import { useEffect, useState } from "react";
import { Popover, Slider } from "@chakra-ui/react";

/**
 * Props for the OpacityControl component.
 */
interface OpacityControlProps {
  /** Current opacity value (0-100) */
  value: number;
  /** Callback when opacity is changed */
  onValueChange: (value: number) => void;
  /** Trigger element (usually an icon button) */
  children: React.ReactNode;
}

/**
 * Control for adjusting layer opacity via a popover slider.
 *
 * The slider shows marks at 0%, 50%, and 100% and displays the current
 * value while dragging. Changes are committed when the user releases the slider.
 *
 * @example
 * ```tsx
 * <OpacityControl value={75} onValueChange={(v) => setOpacity(v)}>
 *   <IconButton icon={<LuDroplet />} aria-label="Adjust opacity" />
 * </OpacityControl>
 * ```
 */
export function OpacityControl(props: OpacityControlProps) {
  const { value, onValueChange, children } = props;
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  return (
    <Popover.Root
      positioning={{ placement: "top", strategy: "fixed", hideWhenDetached: true }}
      size="xs"
    >
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content maxW="15rem">
          <Popover.Arrow>
            <Popover.ArrowTip />
          </Popover.Arrow>
          <Popover.Body>
            <Slider.Root
              value={[draftValue]}
              onValueChange={(v) => setDraftValue(v.value[0])}
              onValueChangeEnd={() => onValueChange(draftValue)}
              size="sm"
              min={0}
              max={100}
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumb index={0}>
                  <Slider.DraggingIndicator
                    layerStyle="fill.solid"
                    top="6"
                    rounded="sm"
                    px="1.5"
                  >
                    <Slider.ValueText />
                  </Slider.DraggingIndicator>
                </Slider.Thumb>
                <Slider.Marks
                  marks={[
                    { value: 0, label: "0%" },
                    { value: 50, label: "50%" },
                    { value: 100, label: "100%" },
                  ]}
                />
              </Slider.Control>
            </Slider.Root>
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}
