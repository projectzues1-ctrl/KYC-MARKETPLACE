import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, Lock, User } from "lucide-react";

export default function AuthPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loginForm, setLoginForm] = useState({ emailOrUsername: "", password: "", twoFactorToken: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" });
  const [verificationCode, setVerificationCode] = useState("");
  const [registrationStep, setRegistrationStep] = useState<"email" | "verify" | "create">("email");
  const [requires2FA, setRequires2FA] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"username" | "code" | "reset">("username");
  const [forgotPasswordUsernameOrEmail, setForgotPasswordUsernameOrEmail] = useState("");
  const [forgotPasswordVerifiedIdentifier, setForgotPasswordVerifiedIdentifier] = useState("");
  const [forgotPasswordCode, setForgotPasswordCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showForgot2FA, setShowForgot2FA] = useState(false);
  const [forgot2FAStep, setForgot2FAStep] = useState<"email" | "emailVerify">("email");
  const [forgot2FAVerifyCode, setForgot2FAVerifyCode] = useState("");
  const [forgot2FAEmail, setForgot2FAEmail] = useState(loginForm.emailOrUsername);

  const loginMutation = useMutation({
    mutationFn: async (data: typeof loginForm) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (data) => {
      if (data.requiresTwoFactor) {
        setRequires2FA(true);
        toast({ title: "2FA Required", description: "Please enter your authenticator code" });
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({ title: "Welcome back!", description: `Logged in as ${data.user.username}` });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    },
  });

  const sendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      toast({ title: "Code Sent", description: "Check your email for the verification code" });
      setRegistrationStep("verify");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof registerForm & { verificationCode: string }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({ title: "Account Created!", description: "Welcome to KYC Marketplace" });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message });
    },
  });

  const sendForgotPasswordMutation = useMutation({
    mutationFn: async (emailOrUsername: string) => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (data, emailOrUsername) => {
      setForgotPasswordVerifiedIdentifier(emailOrUsername);
      toast({ title: "Code Sent", description: "Check your email for the password reset code" });
      setForgotPasswordStep("code");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { emailOrUsername: string; code: string; newPassword: string }) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      toast({ title: "Password Reset", description: "Your password has been reset successfully" });
      setShowForgotPassword(false);
      setForgotPasswordStep("username");
      setForgotPasswordUsernameOrEmail("");
      setForgotPasswordVerifiedIdentifier("");
      setForgotPasswordCode("");
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Reset Failed", description: error.message });
    },
  });

  const reset2FAMutation = useMutation({
    mutationFn: async (data: { emailOrUsername: string }) => {
      const res = await fetch("/api/auth/reset-2fa-lost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (data) => {
      if (data.requiresVerification) {
        toast({ title: "Code Sent", description: "Enter the verification code from your email" });
        setForgot2FAStep("emailVerify");
      } else {
        toast({ title: "2FA Reset", description: "Your 2FA has been reset successfully" });
        setShowForgot2FA(false);
        setForgot2FAStep("email");
        setForgot2FAVerifyCode("");
        setForgot2FAEmail("");
      }
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    },
  });

  const verify2FAResetMutation = useMutation({
    mutationFn: async (data: { emailOrUsername: string; code: string }) => {
      const res = await fetch("/api/auth/verify-2fa-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      toast({ title: "2FA Reset", description: "Your 2FA has been reset successfully" });
      setShowForgot2FA(false);
      setForgot2FAStep("email");
      setForgot2FAVerifyCode("");
      setForgot2FAEmail("");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <Shield className="h-7 sm:h-8 w-7 sm:w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">KYC Marketplace</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">Secure peer-to-peer trading</p>
        </div>

        <Card className="border-border bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-foreground">Get Started</CardTitle>
            <CardDescription>Sign in or create an account to start trading</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {showForgot2FA ? (
                  <>
                    {forgot2FAStep === "email" && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          reset2FAMutation.mutate({ emailOrUsername: loginForm.emailOrUsername });
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label className="text-foreground">Confirm Identity</Label>
                          <p className="text-xs text-muted-foreground">We'll send a verification code to your email</p>
                          <Input
                            value={loginForm.emailOrUsername}
                            disabled
                            className="bg-muted border-border text-foreground opacity-70"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={reset2FAMutation.isPending}
                          data-testid="button-send-2fa-reset"
                        >
                          {reset2FAMutation.isPending ? "Sending..." : "Send Verification Code"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowForgot2FA(false)}
                        >
                          Back
                        </Button>
                      </form>
                    )}

                    {forgot2FAStep === "emailVerify" && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          verify2FAResetMutation.mutate({ emailOrUsername: loginForm.emailOrUsername, code: forgot2FAVerifyCode });
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label className="text-foreground">Verification Code</Label>
                          <p className="text-xs text-muted-foreground">Enter the 6-digit code from your email</p>
                          <Input
                            placeholder="Enter 6-digit code"
                            value={forgot2FAVerifyCode}
                            onChange={(e) => setForgot2FAVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className="bg-muted border-border text-foreground text-center text-lg tracking-widest"
                            maxLength={6}
                            data-testid="input-2fa-verify-code"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={forgot2FAVerifyCode.length !== 6 || verify2FAResetMutation.isPending}
                          data-testid="button-verify-2fa-code"
                        >
                          {verify2FAResetMutation.isPending ? "Verifying..." : "Verify Code"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setForgot2FAStep("email")}
                        >
                          Back
                        </Button>
                      </form>
                    )}
                  </>
                ) : !showForgotPassword ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      loginMutation.mutate(loginForm);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-foreground">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="login-email"
                          data-testid="input-login-email"
                          placeholder="Enter your email"
                          type="email"
                          className="pl-10 bg-muted border-border text-foreground"
                          value={loginForm.emailOrUsername}
                          onChange={(e) => setLoginForm({ ...loginForm, emailOrUsername: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-foreground">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="login-password"
                          data-testid="input-login-password"
                          type="password"
                          placeholder="Enter password"
                          className="pl-10 bg-muted border-border text-foreground"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        />
                      </div>
                      <button
                        type="button"
                        data-testid="button-forgot-password"
                        className="text-xs text-primary hover:underline"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotPasswordUsernameOrEmail(loginForm.emailOrUsername);
                        }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    {requires2FA && (
                      <div className="space-y-2">
                        <Label htmlFor="2fa-token" className="text-foreground">2FA Code</Label>
                        <Input
                          id="2fa-token"
                          data-testid="input-2fa-token"
                          placeholder="Enter 6-digit code"
                          className="bg-muted border-border text-foreground text-center text-lg tracking-widest"
                          maxLength={6}
                          value={loginForm.twoFactorToken}
                          onChange={(e) => setLoginForm({ ...loginForm, twoFactorToken: e.target.value })}
                        />
                        <button
                          type="button"
                          data-testid="button-reset-authenticator"
                          className="text-xs text-primary hover:underline"
                          onClick={() => setShowForgot2FA(true)}
                        >
                          Reset Authenticator?
                        </button>
                      </div>
                    )}
                    <Button
                      type="submit"
                      data-testid="button-login"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                ) : (
                  <>
                    {forgotPasswordStep === "username" && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendForgotPasswordMutation.mutate(forgotPasswordUsernameOrEmail);
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email" className="text-foreground">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="forgot-email"
                              data-testid="input-forgot-email"
                              placeholder="Your email"
                              type="email"
                              className="pl-10 bg-muted border-border text-foreground opacity-70 cursor-not-allowed"
                              value={forgotPasswordUsernameOrEmail}
                              disabled
                              required
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Reset password for this account</p>
                        </div>
                        <Button
                          type="submit"
                          data-testid="button-send-reset-code"
                          className="w-full"
                          disabled={sendForgotPasswordMutation.isPending || !forgotPasswordUsernameOrEmail}
                        >
                          {sendForgotPasswordMutation.isPending ? "Sending..." : "Send Reset Code"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowForgotPassword(false)}
                          disabled={sendForgotPasswordMutation.isPending}
                        >
                          Back to Login
                        </Button>
                      </form>
                    )}

                    {forgotPasswordStep === "code" && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setForgotPasswordStep("reset");
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label className="text-foreground">Account Confirmed</Label>
                          <div className="bg-muted border border-border rounded-lg p-3 mb-3">
                            <p className="text-sm text-foreground font-medium">{forgotPasswordVerifiedIdentifier}</p>
                            <p className="text-xs text-muted-foreground mt-1">Password reset code sent to this account's registered email</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground">Reset Code</Label>
                          <p className="text-xs text-muted-foreground mb-2">Enter the 6-digit code from your email</p>
                          <Input
                            data-testid="input-forgot-code"
                            placeholder="Enter 6-digit code"
                            className="bg-muted border-border text-foreground text-center text-lg tracking-widest"
                            maxLength={6}
                            value={forgotPasswordCode}
                            onChange={(e) => setForgotPasswordCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          data-testid="button-verify-reset-code"
                          className="w-full"
                          disabled={forgotPasswordCode.length !== 6}
                        >
                          Continue
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setForgotPasswordStep("username");
                            setForgotPasswordUsernameOrEmail("");
                            setForgotPasswordVerifiedIdentifier("");
                            setForgotPasswordCode("");
                            setNewPassword("");
                          }}
                        >
                          Back to Login
                        </Button>
                      </form>
                    )}

                    {forgotPasswordStep === "reset" && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          resetPasswordMutation.mutate({
                            emailOrUsername: forgotPasswordVerifiedIdentifier,
                            code: forgotPasswordCode,
                            newPassword: newPassword,
                          });
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label className="text-foreground">Account</Label>
                          <div className="bg-muted border border-border rounded-lg p-3 mb-3">
                            <p className="text-sm text-foreground font-medium">{forgotPasswordVerifiedIdentifier}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password" className="text-foreground">New Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="new-password"
                              data-testid="input-new-password"
                              type="password"
                              placeholder="Enter new password"
                              className="pl-10 bg-muted border-border text-foreground"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          data-testid="button-reset-password"
                          className="w-full"
                          disabled={resetPasswordMutation.isPending}
                        >
                          {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setForgotPasswordStep("username");
                            setForgotPasswordUsernameOrEmail("");
                            setForgotPasswordVerifiedIdentifier("");
                            setForgotPasswordCode("");
                            setNewPassword("");
                          }}
                        >
                          Back to Login
                        </Button>
                      </form>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="register">
                {registrationStep === "email" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendVerificationMutation.mutate(registerForm.email);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-foreground">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="register-email"
                          data-testid="input-register-email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10 bg-muted border-border text-foreground"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      data-testid="button-send-code"
                      className="w-full"
                      disabled={sendVerificationMutation.isPending}
                    >
                      {sendVerificationMutation.isPending ? "Sending..." : "Send Verification Code"}
                    </Button>
                  </form>
                )}

                {registrationStep === "verify" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setRegistrationStep("create");
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label className="text-foreground">Verification Code</Label>
                      <p className="text-xs text-muted-foreground mb-2">Enter the code sent to {registerForm.email}</p>
                      <div className="relative">
                        <Input
                          data-testid="input-verification-code"
                          placeholder="Enter 6-digit code"
                          className="bg-muted border-border text-foreground text-center text-lg tracking-widest"
                          maxLength={6}
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      data-testid="button-verify-code"
                      className="w-full"
                      disabled={verificationCode.length !== 6}
                    >
                      Continue
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setRegistrationStep("email")}
                    >
                      Back
                    </Button>
                  </form>
                )}

                {registrationStep === "create" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      registerMutation.mutate({ ...registerForm, verificationCode });
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="register-username" className="text-foreground">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="register-username"
                          data-testid="input-register-username"
                          placeholder="Choose username"
                          className="pl-10 bg-muted border-border text-foreground"
                          value={registerForm.username}
                          onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-foreground">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="register-password"
                          data-testid="input-register-password"
                          type="password"
                          placeholder="Create password"
                          className="pl-10 bg-muted border-border text-foreground"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      data-testid="button-register"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setRegistrationStep("verify")}
                    >
                      Back
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
