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
} from "@chakra-ui/react";
import { ReactNode, useState } from "react";
import { LuCircleHelp, LuFileDown, LuLockKeyhole, LuLogOut, LuShare2 } from "react-icons/lu";
import { ColorModeButton } from "@/components/ui/color-mode";
import { useAuthStore } from "@/store/auth-store";

export const Header = ({ onExportPdf }: HeaderProps) => {
  const [shareDialogIsOpen, setShareDialogIsOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();
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
    >
      <Image src="/MISLogo.svg" alt="Disaster Risk Management Information system Logo" boxSize="9" />
      <Heading
        font="Work Sans"
        fontWeight="700"
        size="xl"
        color="blue.700"
        as="h1"
      >
        Disaster Risk Management Information system
      </Heading>
      <Box as="nav" ml="auto" display="flex" alignItems="center" gap="1">
        <ColorModeButton />
        <List.Root
          display="flex"
          flexDirection="row"
          gap={{ base: "2", md: "4" }}
        >
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
        </List.Root>
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
