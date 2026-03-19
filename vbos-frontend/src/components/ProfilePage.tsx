/**
 * Full-page Profile and security: avatar, name, email, password, 2FA, auto-lock, PIN.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { LuArrowLeft, LuShield, LuLock, LuUser, LuMail, LuCamera, LuKeyRound } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { useLockStore, AUTO_LOCK_OPTIONS, type AutoLockMinutes } from "@/store/lock-store";
import { useUiStore } from "@/store/ui-store";
import * as profileApi from "@/api/profile";
import { setupEmailOtp, disable2fa, getCurrentUser } from "@/api/auth";
import { toast } from "@/utils/toast";

const API_HOST = import.meta.env.VITE_API_HOST ?? "";

function avatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return `${API_HOST.replace(/\/$/, "")}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
}

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { setProfilePageOpen } = useUiStore();
  const {
    autoLockTimeoutMinutes,
    setAutoLockTimeout,
    setPin,
    pinHash,
  } = useLockStore();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

  const [disable2faPassword, setDisable2faPassword] = useState("");
  const [isDisabling2fa, setIsDisabling2fa] = useState(false);
  const [isEnabling2fa, setIsEnabling2fa] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFirstName(user?.first_name ?? "");
    setLastName(user?.last_name ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  // Refetch user when profile opens to get latest otp_required_for_all_logins and mfa_enabled
  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => {});
  }, [setUser]);

  const handleSaveProfile = useCallback(async () => {
    setIsSavingProfile(true);
    try {
      const updated = await profileApi.updateProfile({
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
      });
      setUser(updated);
      toast.success("Profile updated", "Your changes have been saved.");
    } catch (e) {
      toast.error("Failed to update profile", String(e instanceof Error ? e.message : e));
    } finally {
      setIsSavingProfile(false);
    }
  }, [firstName, lastName, email, setUser]);

  const handleChangePassword = useCallback(async () => {
    if (newPassword.length < 8) {
      toast.error("Password too short", "Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match", "Please enter the same password in both fields.");
      return;
    }
    setIsChangingPassword(true);
    try {
      await profileApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed", "Your password has been updated.");
    } catch (e) {
      toast.error("Failed to change password", String(e instanceof Error ? e.message : e));
    } finally {
      setIsChangingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const handleSavePin = useCallback(async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error("Invalid PIN", "PIN must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs don't match", "Please enter the same PIN in both fields.");
      return;
    }
    setIsSavingPin(true);
    try {
      await setPin(newPin);
      setNewPin("");
      setConfirmPin("");
      toast.success("PIN saved", "Your unlock PIN has been set.");
    } catch {
      toast.error("Failed to save PIN", "Please try again.");
    } finally {
      setIsSavingPin(false);
    }
  }, [newPin, confirmPin, setPin]);

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const updated = await profileApi.uploadAvatar(file);
        setUser(updated);
        toast.success("Avatar updated", "Your profile picture has been updated.");
      } catch (e) {
        toast.error("Failed to upload avatar", String(e instanceof Error ? e.message : e));
      }
      e.target.value = "";
    },
    [setUser],
  );

  const handleEnableEmailOtp = useCallback(async () => {
    if (!user?.email) {
      toast.error("Email required", "Add an email address above before enabling 2FA.");
      return;
    }
    setIsEnabling2fa(true);
    try {
      const result = await setupEmailOtp();
      setUser?.({ ...user!, mfa_enabled: result.mfa_enabled, mfa_method: result.mfa_method });
      toast.success("2FA enabled", "A verification code will be sent to your email on each login.");
    } catch (e) {
      toast.error("Failed to enable 2FA", String(e instanceof Error ? e.message : e));
    } finally {
      setIsEnabling2fa(false);
    }
  }, [user, setUser]);

  const handleDisable2fa = useCallback(async () => {
    if (!disable2faPassword) {
      toast.error("Password required", "Enter your password to disable 2FA.");
      return;
    }
    setIsDisabling2fa(true);
    try {
      await disable2fa(disable2faPassword);
      setUser?.({ ...user!, mfa_enabled: false, mfa_method: "" });
      setDisable2faPassword("");
      toast.success("2FA disabled", "You can now sign in with password only.");
    } catch (e) {
      toast.error("Failed to disable 2FA", String(e instanceof Error ? e.message : e));
    } finally {
      setIsDisabling2fa(false);
    }
  }, [user, setUser, disable2faPassword]);

  const handleTimeoutChange = useCallback(
    (value: string) => {
      const minutes = Number(value) as AutoLockMinutes;
      setAutoLockTimeout(minutes);
      if (minutes > 0 && !pinHash) {
        toast.warning("Set a PIN first", "Enable auto-lock by setting a 4-digit PIN below.");
      } else if (minutes > 0) {
        toast.success("Auto-lock enabled", `Screen will lock after ${minutes} minute${minutes === 1 ? "" : "s"} of inactivity.`);
      } else {
        toast.success("Auto-lock disabled", "Screen will not lock automatically.");
      }
    },
    [setAutoLockTimeout, pinHash],
  );

  const profileDirty =
    firstName !== (user?.first_name ?? "") ||
    lastName !== (user?.last_name ?? "") ||
    email !== (user?.email ?? "");
  const pinDirty = newPin || confirmPin;
  const canSavePin = newPin.length === 4 && confirmPin.length === 4 && newPin === confirmPin;

  const avatarSrc = avatarUrl(user?.avatar ?? null);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col overflow-auto bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setProfilePageOpen(false)}
          className="gap-2"
        >
          <LuArrowLeft className="size-4" />
          Back
        </Button>
        <h1 className="flex items-center gap-2 font-semibold">
          <LuShield className="size-5 text-primary" />
          Profile & security
        </h1>
      </header>

      <main className="flex-1 p-4 md:p-6 lg:mx-auto lg:max-w-2xl lg:p-8">
        <div className="flex flex-col gap-6">
          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LuUser className="size-4" />
                Profile picture
              </CardTitle>
              <CardDescription>Upload a photo to personalize your account.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted"
                aria-label="Change profile picture"
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="size-full object-cover" />
                ) : (
                  <LuCamera className="size-8 text-muted-foreground" />
                )}
              </button>
              <div className="flex flex-col gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change photo
                </Button>
                <p className="text-xs text-muted-foreground">JPEG, PNG, GIF or WebP. Max 5MB.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </CardContent>
          </Card>

          {/* Name & Email */}
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>Update your name and email address.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <LuMail className="size-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <p className="text-xs text-muted-foreground">Username: {user?.username}</p>
              {profileDirty && (
                <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? "Saving…" : "Save changes"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={
                  !currentPassword || !newPassword || !confirmPassword || isChangingPassword
                }
              >
                {isChangingPassword ? "Updating…" : "Update password"}
              </Button>
            </CardContent>
          </Card>

          {/* Two-factor authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LuKeyRound className="size-4" />
                Two-factor authentication
              </CardTitle>
              <CardDescription>
                {user?.otp_required_for_all_logins
                  ? "Login verification is required for all users. Configured by administrator."
                  : "Add an extra layer of security by requiring a code sent to your email when signing in."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {user?.otp_required_for_all_logins ? (
                <p className="text-sm text-muted-foreground">
                  OTP is enabled globally. Contact your administrator to change this setting.
                </p>
              ) : user?.mfa_enabled ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    Two-factor authentication is enabled
                    {user.mfa_method === "email" && " (email code)"}
                    {user.mfa_method === "totp" && " (authenticator app)"}.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="disable-2fa-password">Enter your password to disable</Label>
                    <Input
                      id="disable-2fa-password"
                      type="password"
                      value={disable2faPassword}
                      onChange={(e) => setDisable2faPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <Button
                      variant="destructive"
                      onClick={handleDisable2fa}
                      disabled={!disable2faPassword || isDisabling2fa}
                    >
                      {isDisabling2fa ? "Disabling…" : "Disable 2FA"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleEnableEmailOtp}
                    disabled={!user?.email || isEnabling2fa}
                    variant="outline"
                  >
                    {isEnabling2fa ? "Enabling…" : "Enable email verification"}
                  </Button>
                  {!user?.email && (
                    <p className="text-xs text-muted-foreground">
                      Add an email address above before enabling 2FA.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auto-lock & PIN */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LuLock className="size-4" />
                Session security
              </CardTitle>
              <CardDescription>
                Configure auto-lock and unlock PIN for your session.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="auto-lock">Auto-lock after inactivity</Label>
                <Select
                  value={String(autoLockTimeoutMinutes)}
                  onValueChange={handleTimeoutChange}
                >
                  <SelectTrigger id="auto-lock" className="w-full">
                    <SelectValue placeholder="Select timeout" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTO_LOCK_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  When idle, the screen locks instead of logging out. Enter your PIN to resume.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label>
                  Unlock PIN {pinHash ? "(change)" : "(required for auto-lock)"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) =>
                      setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    className="font-mono-num text-center"
                    aria-label="New 4-digit PIN"
                  />
                  <Input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    className="font-mono-num text-center"
                    aria-label="Confirm 4-digit PIN"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  4 digits. Used to unlock the screen after auto-lock. Not sent to the server.
                </p>
              </div>
              {pinDirty && (
                <Button onClick={handleSavePin} disabled={!canSavePin || isSavingPin}>
                  {isSavingPin ? "Saving…" : "Save PIN"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
