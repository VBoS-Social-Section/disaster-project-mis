import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Image,
  Input,
  VStack,
  Field,
  Text,
} from "@chakra-ui/react";
import { useAuthStore } from "@/store/auth-store";
import { login } from "@/api/auth";
import { toast } from "@/utils/toast";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { token } = await login(username, password);
      const { getCurrentUser: fetchUser } = await import("@/api/auth");
      const user = await fetchUser(token);
      setAuth(token, user);
      toast.success("Signed in successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error("Sign in failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
      p={4}
      role="main"
      aria-label="Sign in"
    >
      <Box
        as="form"
        onSubmit={handleSubmit}
        w="full"
        maxW="400px"
        bg="white"
        p={8}
        borderRadius="lg"
        shadow="lg"
      >
        <VStack gap={6} align="stretch">
          <Box textAlign="center">
            <Image
              src="/MISLogo.svg"
              alt="VBoS MIS Logo"
              boxSize="16"
              mx="auto"
              mb={4}
            />
            <Heading size="xl" color="blue.700">
              VBoS MIS
            </Heading>
            <Text color="fg.muted" mt={2} fontSize="sm">
              Management Information System
            </Text>
          </Box>

          <Field.Root invalid={!!error}>
            <Field.Label>Username</Field.Label>
            <Input
              ref={usernameInputRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
              aria-label="Username"
            />
          </Field.Root>

          <Field.Root invalid={!!error}>
            <Field.Label>Password</Field.Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              aria-label="Password"
            />
            {error && (
              <Field.ErrorText color="red.500" fontSize="sm" mt={1}>
                {error}
              </Field.ErrorText>
            )}
          </Field.Root>

          <Button
            type="submit"
            colorPalette="blue"
            loading={isLoading}
            disabled={isLoading}
          >
            Sign in
          </Button>

          <Text fontSize="xs" color="fg.muted" textAlign="center">
            Contact your administrator if you need access.
          </Text>
        </VStack>
      </Box>
    </Box>
  );
}
