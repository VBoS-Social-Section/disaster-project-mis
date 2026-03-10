import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
      setAuth(token, null); // Set token first so HTTP helper can use it
      const user = await fetchUser();
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
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4"
      role="main"
      aria-label="Sign in"
    >
      <Card className="w-full max-w-[400px] border border-border shadow-md">
        <form onSubmit={handleSubmit}>
          <CardHeader className="space-y-6 text-center">
            <img
              src="/MISLogo.svg"
              alt="Disaster Risk Management Information system Logo"
              className="mx-auto mb-4 size-16"
            />
            <h1 className="text-lg font-semibold text-foreground">
              Disaster Risk Management Information System
            </h1>
            <p className="text-sm text-muted-foreground">
              Secure access to vital information for disaster
              preparedness and response.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                ref={usernameInputRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
                aria-invalid={!!error}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                aria-invalid={!!error}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Contact your administrator if you need access.
            </p>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
