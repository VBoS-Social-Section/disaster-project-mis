import { Box, Flex, Heading, IconButton } from "@chakra-ui/react";
import { ReactNode, useState, useEffect } from "react";
import { LuPanelLeft, LuPanelRight, LuX } from "react-icons/lu";
import { useUiStore } from "@/store/ui-store";

const MOBILE_BREAKPOINT = 768;

type Props = {
  title: string;
  direction: "right" | "left";
  children?: ReactNode;
};

export const Sidebar = ({ title, direction, children }: Props) => {
  const isLeftSidebar = direction === "left";
  const {
    isMobile,
    setIsMobile,
    mobileOpenPanel,
    setMobileOpenPanel,
  } = useUiStore();

  // Desktop: local state. Mobile: use store (only one panel at a time)
  const [desktopVisible, setDesktopVisible] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= MOBILE_BREAKPOINT,
  );

  const panelId = isLeftSidebar ? "left" : "right";
  const sideBarVisible = isMobile
    ? mobileOpenPanel === panelId
    : desktopVisible;

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpenPanel(mobileOpenPanel === panelId ? null : panelId);
    } else {
      setDesktopVisible((prev) => !prev);
    }
  };

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      if (mobile) setMobileOpenPanel(null);
    };
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [setIsMobile, setMobileOpenPanel]);

  return (
    <Box
      position="relative"
      height="full"
      shadow="xs"
      borderColor="border"
      borderLeftWidth={isLeftSidebar ? 0 : 1}
      borderRightWidth={isLeftSidebar ? 1 : 0}
      bg="bg.panel"
    >
      <Flex
        flexDir="column"
        w={{
          base: sideBarVisible ? "min(18rem, 88vw)" : "0px",
          md: !sideBarVisible ? "0px" : isLeftSidebar ? "20rem" : "28rem",
        }}
        maxW={{ base: "88vw", md: "none" }}
        h="full"
        maxH="calc(100vh - 3.75rem)"
        overflow="hidden"
        opacity={sideBarVisible ? 1 : 0}
        transition="all 0.24s"
        willChange="width, opacity"
        position={{ base: "absolute", md: "relative" }}
        top={0}
        bottom={0}
        left={isLeftSidebar ? { base: 0, md: "auto" } : undefined}
        right={!isLeftSidebar ? { base: 0, md: "auto" } : undefined}
        zIndex={{ base: 1000, md: 10 }}
        bg="bg.panel"
        shadow={{ base: sideBarVisible ? "xl" : "none", md: "none" }}
      >
        {sideBarVisible && (
          <>
            <Flex
              px={4}
              py={3}
              h={10}
              bg="blue.50"
              alignItems="center"
              justifyContent="space-between"
              gap="2"
            >
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
              {isMobile && (
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label="Close panel"
                  onClick={toggleSidebar}
                >
                  <LuX />
                </IconButton>
              )}
            </Flex>
            {children}
          </>
        )}
      </Flex>
      {/* Mobile: toggle at top of panel */}
      {isMobile && !sideBarVisible && (
        <IconButton
          size="sm"
          variant="plain"
          bg="bg.panel"
          position="absolute"
          top={0}
          left={isLeftSidebar ? 4 : undefined}
          right={!isLeftSidebar ? 4 : undefined}
          zIndex={1001}
          borderRadius="md"
          aria-label={`Open ${title}`}
          onClick={toggleSidebar}
        >
          {isLeftSidebar ? <LuPanelLeft /> : <LuPanelRight />}
        </IconButton>
      )}
      {/* Desktop: toggle on side of panel (original behavior) */}
      {!isMobile && (
        <IconButton
          size="xs"
          variant="plain"
          bg="bg.panel"
          position="absolute"
          top={10}
          zIndex={20}
          aria-label={sideBarVisible ? "Close panel" : `Open ${title}`}
          css={{
            [isLeftSidebar ? "right" : "left"]: -8,
            [isLeftSidebar ? "borderLeftRadius" : "borderRightRadius"]: 0,
          }}
          onClick={toggleSidebar}
        >
          {isLeftSidebar ? <LuPanelLeft /> : <LuPanelRight />}
        </IconButton>
      )}
    </Box>
  );
};
