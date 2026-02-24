import { Box, Flex, Heading, IconButton } from "@chakra-ui/react";
import { ReactNode, useState } from "react";
import { LuPanelLeft, LuPanelRight } from "react-icons/lu";

type Props = {
  title: string;
  direction: "right" | "left";
  children?: ReactNode;
};

export const Sidebar = ({ title, direction, children }: Props) => {
  const [sideBarVisible, setSideBarVisible] = useState(true);
  const isLeftSidebar = direction === "left";
  return (
    <Box
      position="relative"
      height="full"
      shadow="xs"
      borderColor="border"
      borderLeftWidth={isLeftSidebar ? 0 : 1}
      borderRightWidth={isLeftSidebar ? 1 : 0}
      bg="white"
    >
      <Flex
        flexDir="column"
        w={{
          base: "full",
          md: !sideBarVisible ? "0px" : isLeftSidebar ? "20rem" : "28rem",
        }}
        h="full"
        maxH="calc(100vh - 3.75rem)"
        overflow="hidden"
        opacity={sideBarVisible ? 1 : 0}
        transition="all 0.24s"
        willChange="width, opacity"
        position="relative"
        zIndex="10"
      >
        {sideBarVisible && (
          <>
            <Box px={4} py={3} h={10} bg="blue.50">
              <Heading
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                color="blue.800"
                letterSpacing="wider"
                lineHeight="normal"
              >
                {title}
              </Heading>
            </Box>
            {children}
          </>
        )}
      </Flex>
      <IconButton
        size="xs"
        variant="plain"
        bg="white"
        position="absolute"
        top={10}
        zIndex={10}
        css={{
          [isLeftSidebar ? "right" : "left"]: -8,
          [isLeftSidebar ? "borderLeftRadius" : "borderRightRadius"]: 0,
        }}
        onClick={() => setSideBarVisible((prev) => !prev)}
      >
        {isLeftSidebar ? <LuPanelLeft /> : <LuPanelRight />}
      </IconButton>
    </Box>
  );
};
