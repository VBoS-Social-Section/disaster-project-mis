import {
  Box,
  Button,
  ButtonProps,
  Clipboard,
  CloseButton,
  Dialog,
  Heading,
  IconButton,
  Image,
  Link,
  List,
  Portal,
  Popover,
  Stack,
} from "@chakra-ui/react";
import { ReactNode, useState } from "react";
import {
  LuCircleHelp,
  LuFileDown,
  LuLockKeyhole,
  LuLogOut,
  LuMenu,
  LuShare2,
} from "react-icons/lu";
import { useAuthStore } from "@/store/auth-store";

export const Header = ({ onExportPdf }: HeaderProps) => {
  const [shareDialogIsOpen, setShareDialogIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();

  const closeMenu = () => setMenuOpen(false);

  const navActions = (
    <>
      <NavButton>
        <LuCircleHelp />
        Help
      </NavButton>
      <NavButton onClick={() => setShareDialogIsOpen(true)}>
        <LuShare2 />
        Share
      </NavButton>
      {onExportPdf && (
        <NavButton onClick={onExportPdf} title="Export map and stats to PDF">
          <LuFileDown />
          Export PDF
        </NavButton>
      )}
      {user?.is_staff && (
        <Link href={`${import.meta.env.VITE_API_HOST}/admin/`}>
          <NavButton solid colorPalette="blue">
            <LuLockKeyhole />
            Admin
          </NavButton>
        </Link>
      )}
      <NavButton
        onClick={() => clearAuth()}
        aria-label="Logout"
        title={`Logout (${user?.username})`}
      >
        <LuLogOut />
        Logout
      </NavButton>
    </>
  );

  return (
    <Box
      as="header"
      display="flex"
      alignItems="center"
      gap="3"
      bg="bg.panel"
      px="4"
      py="3"
      shadow="base"
      minW="0"
      overflow="hidden"
    >
      <Image
        src="/MISLogo.svg"
        alt="Disaster Risk Management Information system Logo"
        boxSize="9"
        flexShrink={0}
      />
      <Heading
        font="Work Sans"
        fontWeight="700"
        size={{ base: "md", sm: "xl" }}
        color="blue.700"
        as="h1"
        truncate
        flex="1"
        minW="0"
      >
        <Box as="span" display={{ base: "inline", md: "none" }}>
          DRMIS
        </Box>
        <Box as="span" display={{ base: "none", md: "inline" }}>
          Disaster Risk Management Information system
        </Box>
      </Heading>
      {/* Desktop: inline buttons */}
      <Box as="nav" ml="auto" display={{ base: "none", md: "block" }}>
        <List.Root
          display="flex"
          flexDirection="row"
          gap="4"
        >
          {navActions}
        </List.Root>
      </Box>
      {/* Mobile/tablet: floating action button with popover */}
      <Box
        display={{ base: "block", md: "none" }}
        position="fixed"
        bottom="1.5rem"
        right="1rem"
        zIndex={9999}
      >
        <Popover.Root
          open={menuOpen}
          onOpenChange={(e) => setMenuOpen(e.open)}
          positioning={{ placement: "top-end", strategy: "fixed" }}
          size="sm"
        >
          <Popover.Trigger asChild>
            <IconButton
              aria-label="Open menu"
              size="lg"
              borderRadius="full"
              colorPalette="blue"
              shadow="lg"
              _hover={{ shadow: "xl" }}
            >
              <LuMenu />
            </IconButton>
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content>
              <Popover.Arrow>
                <Popover.ArrowTip />
              </Popover.Arrow>
              <Popover.Body>
                <Stack direction="column" gap="1" py="2">
                  <MobileNavItem icon={<LuCircleHelp />} onClick={closeMenu}>
                    Help
                  </MobileNavItem>
                  <MobileNavItem
                    icon={<LuShare2 />}
                    onClick={() => {
                      setShareDialogIsOpen(true);
                      closeMenu();
                    }}
                  >
                    Share
                  </MobileNavItem>
                  {onExportPdf && (
                    <MobileNavItem
                      icon={<LuFileDown />}
                      onClick={() => {
                        onExportPdf();
                        closeMenu();
                      }}
                    >
                      Export PDF
                    </MobileNavItem>
                  )}
                  {user?.is_staff && (
                    <Link
                      href={`${import.meta.env.VITE_API_HOST}/admin/`}
                      display="flex"
                      alignItems="center"
                      gap="3"
                      px="3"
                      py="2"
                      fontSize="sm"
                      borderRadius="md"
                      bg="blue.50"
                      color="blue.700"
                      _hover={{ bg: "blue.100" }}
                    >
                      <LuLockKeyhole />
                      Admin
                    </Link>
                  )}
                  <MobileNavItem
                    icon={<LuLogOut />}
                    onClick={() => {
                      clearAuth();
                      closeMenu();
                    }}
                  >
                    Logout
                  </MobileNavItem>
                </Stack>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>
      </Box>
      <ShareDialog
        isOpen={shareDialogIsOpen}
        setIsOpen={setShareDialogIsOpen}
      />
    </Box>
  );
};

interface NavButtonProps extends ButtonProps {
  solid?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

const NavButton = ({ solid, onClick, children, ...props }: NavButtonProps) => (
  <IconButton
    px="2"
    variant={solid ? "solid" : "outline"}
    fontWeight="600"
    size="sm"
    onClick={onClick}
    {...props}
  >
    {children}
  </IconButton>
);

interface MobileNavItemProps {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}

const MobileNavItem = ({ icon, children, onClick }: MobileNavItemProps) => (
  <Button
    justifyContent="flex-start"
    gap="3"
    variant="ghost"
    colorPalette="gray"
    size="sm"
    w="full"
    onClick={onClick}
  >
    {icon}
    {children}
  </Button>
);

type ShareDialogProps = {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
};

type HeaderProps = {
  onExportPdf?: () => void;
};

const ShareDialog = ({ isOpen, setIsOpen }: ShareDialogProps) => {
  return (
    <Dialog.Root
      lazyMount
      size="sm"
      open={isOpen}
      onOpenChange={(e) => setIsOpen(e.open)}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Share</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box
                borderColor="blackAlpha.800"
                bg="gray.100"
                borderWidth={1}
                p={2}
              >
                {`${window.location}`}
              </Box>
            </Dialog.Body>
            <Dialog.Footer>
              <Clipboard.Root value={`${window.location}`} timeout={1500}>
                <Clipboard.Trigger asChild>
                  <Button variant="surface" size="sm">
                    <Clipboard.Indicator />
                    Copy Link
                  </Button>
                </Clipboard.Trigger>
              </Clipboard.Root>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
