import "@fontsource/work-sans/index.css";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import theme from "./Theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: "always",
      staleTime: 5 * 60 * 1000, // 5 min - reduce refetches when switching views
      gcTime: 10 * 60 * 1000, // 10 min - keep cache longer (formerly cacheTime)
    },
    mutations: {
      networkMode: "always",
    },
  },
});

function Providers({ children }: React.PropsWithChildren) {
  return (
    <ChakraProvider value={theme}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ChakraProvider>
  );
}

export default Providers;
