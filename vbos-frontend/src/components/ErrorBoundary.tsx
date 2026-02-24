import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="gray.50"
          p={6}
        >
          <VStack
            gap={6}
            maxW="md"
            p={8}
            bg="white"
            borderRadius="lg"
            shadow="lg"
            align="stretch"
          >
            <Box>
              <Heading size="lg" color="red.600" mb={2}>
                Something went wrong
              </Heading>
              <Text color="fg.muted" fontSize="sm">
                {this.state.error.message}
              </Text>
            </Box>
            <Button
              colorPalette="blue"
              onClick={this.handleRetry}
              alignSelf="flex-start"
            >
              Try again
            </Button>
            <Text fontSize="xs" color="fg.muted">
              If the problem persists, try refreshing the page or contact support.
            </Text>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}
