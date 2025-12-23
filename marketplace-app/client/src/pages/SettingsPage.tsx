import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, getUser, getToken } from "@/lib/auth";
import {
  Settings,
  Shield,
  User,
  Key,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Copy,
  QrCode,
  Upload,
  FileText,
  Camera,
  Star,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getUser();
  const [setup2FAOpen, setSetup2FAOpen] = useState(false);
  const [reset2FAOpen, setReset2FAOpen] = useState(false);
  const [verifyToken, setVerifyToken] = useState("");
  const [reset2FAToken, setReset2FAToken] = useState("");
  const [kycDialogOpen, setKycDialogOpen] = useState(false);
  const [idType, setIdType] = useState("passport");
  const [idNumber, setIdNumber] = useState("");
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const idDocumentRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const profilePictureRef = useRef<HTMLInputElement>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/auth/me");
      return res.json();
    },
  });

  const { data: kycStatus } = useQuery({
    queryKey: ["kyc-status"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/kyc/status");
      return res.json();
    },
  });

  const { data: tradeStats } = useQuery({
    queryKey: ["user-trades", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetchWithAuth(`/api/users/${user.id}/trades`);
      if (!res.ok) throw new Error("Failed to fetch trades");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetchWithAuth(`/api/users/${user.id}/profile`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchWithAuth("/api/auth/2fa/setup", { method: "POST" });
      if (!res.ok) throw new Error("Failed to setup 2FA");
      return res.json();
    },
  });

  const enable2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await fetchWithAuth("/api/auth/2fa/enable", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error("Invalid token");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setSetup2FAOpen(false);
      setVerifyToken("");
      toast({ title: "2FA Enabled", description: "Your account is now more secure" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Invalid code", description: "Please try again" });
    },
  });

  const disable2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await fetchWithAuth("/api/auth/2fa/disable", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error("Invalid token");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast({ title: "2FA Disabled" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Invalid code" });
    },
  });

  const [reset2FAData, setReset2FAData] = useState<any>(null);

  const reset2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await fetchWithAuth("/api/auth/2fa/reset", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error("Invalid token");
      return res.json();
    },
    onSuccess: (data) => {
      setReset2FAData(data);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setReset2FAToken("");
      toast({ title: "2FA Reset", description: "Your 2FA has been reset. Save your recovery codes!" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Invalid code", description: "Please enter the correct 2FA code" });
    },
  });

  const copyRecoveryCodes = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join("\n"));
    toast({ title: "Copied!", description: "Recovery codes copied to clipboard" });
  };

  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const token = getToken();
      const res = await fetch("/api/users/profile-picture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to upload profile picture");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setProfilePicture(null);
      if (profilePictureRef.current) profilePictureRef.current.value = "";
      toast({ title: "Profile Picture Updated", description: "Your profile picture has been updated" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    },
  });

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      uploadProfilePictureMutation.mutate(file);
    }
  };

  const submitKycMutation = useMutation({
    mutationFn: async () => {
      if (!idDocument || !selfie || !idNumber) {
        throw new Error("Please fill in all required fields");
      }
      const formData = new FormData();
      formData.append("idType", idType);
      formData.append("idNumber", idNumber);
      formData.append("idDocument", idDocument);
      formData.append("selfie", selfie);

      const token = getToken();
      const res = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit KYC");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
      setKycDialogOpen(false);
      setIdNumber("");
      setIdDocument(null);
      setSelfie(null);
      if (idDocumentRef.current) idDocumentRef.current.value = "";
      if (selfieRef.current) selfieRef.current.value = "";
      toast({ title: "KYC Submitted", description: "Your documents are being reviewed" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message });
    },
  });

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto px-2 sm:px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{t('settings.title')}</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('settings.account')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="grid gap-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="relative">
                    <input
                      type="file"
                      ref={profilePictureRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureChange}
                    />
                    <div
                      onClick={() => profilePictureRef.current?.click()}
                      className="cursor-pointer group relative"
                      data-testid="upload-profile-picture"
                    >
                      {me?.profilePicture ? (
                        <img
                          src={me.profilePicture}
                          alt={me.username}
                          className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold">
                          {me?.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                      {uploadProfilePictureMutation.isPending && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium text-lg">{me?.username}</p>
                    <p className="text-muted-foreground text-sm">{t('common.edit')}</p>
                    <Badge className="mt-2">{me?.role}</Badge>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-sm">{t('auth.email')}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-foreground font-medium">{me?.email}</p>
                    {me?.emailVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-sm">{t('common.confirm')}</p>
                  <p className="text-foreground font-medium">
                    {new Date(me?.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('settings.security')}
            </CardTitle>
            <CardDescription>
              {t('settings.twoFactor')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-medium">{t('twoFactor.title')}</p>
                  <p className="text-muted-foreground text-sm">
                    {t('twoFactor.description')}
                  </p>
                </div>
              </div>
              {me?.twoFactorEnabled ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600">{t('twoFactor.enabled')}</Badge>
                  <Dialog open={reset2FAOpen} onOpenChange={(open) => {
                    setReset2FAOpen(open);
                    if (!open) setReset2FAData(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                        data-testid="button-reset-2fa"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Reset 2FA</DialogTitle>
                      </DialogHeader>
                      {reset2FAData ? (
                        <div className="space-y-6 pt-4">
                          <div className="text-center">
                            <p className="text-muted-foreground text-sm mb-4">
                              Scan this QR code with your authenticator app
                            </p>
                            <div className="flex justify-center p-4 bg-white rounded-lg">
                              <img src={reset2FAData.qrCode} alt="New QR Code" className="w-48 h-48" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-foreground">Manual Entry Code</Label>
                            <div className="flex gap-2">
                              <Input
                                readOnly
                                value={reset2FAData.secret}
                                className="bg-muted border-border font-mono text-sm"
                              />
                              <Button
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(reset2FAData.secret);
                                  toast({ title: "Copied!" });
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-foreground">Recovery Codes</Label>
                            <div className="bg-muted p-3 rounded-lg max-h-24 overflow-y-auto">
                              <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words">
                                {reset2FAData.recoveryCodes?.join("\n")}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => copyRecoveryCodes(reset2FAData.recoveryCodes)}
                            >
                              Copy Recovery Codes
                            </Button>
                          </div>

                          <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setReset2FAOpen(false);
                              setReset2FAData(null);
                            }}
                          >
                            Done
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4 pt-4">
                          <p className="text-sm text-muted-foreground">
                            Enter your current 2FA code to reset your authenticator. You'll receive a new QR code to scan.
                          </p>
                          <div className="space-y-2">
                            <Label className="text-foreground">Current 2FA Code</Label>
                            <Input
                              placeholder="000000"
                              maxLength={6}
                              className="bg-muted border-border text-center text-lg tracking-widest"
                              value={reset2FAToken}
                              onChange={(e) => setReset2FAToken(e.target.value)}
                              data-testid="input-reset-2fa-code"
                            />
                          </div>
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            disabled={reset2FAToken.length !== 6 || reset2FAMutation.isPending}
                            onClick={() => reset2FAMutation.mutate(reset2FAToken)}
                            data-testid="button-confirm-reset-2fa"
                          >
                            {reset2FAMutation.isPending ? "Resetting..." : "Reset 2FA"}
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <Dialog open={setup2FAOpen} onOpenChange={setSetup2FAOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => setup2FAMutation.mutate()}
                      data-testid="button-setup-2fa"
                    >
                      {t('twoFactor.enable')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">{t('twoFactor.setup')}</DialogTitle>
                    </DialogHeader>
                    {setup2FAMutation.data ? (
                      <div className="space-y-6 pt-4">
                        <div className="text-center">
                          <p className="text-muted-foreground text-sm mb-4">
                            {t('twoFactor.scanQR')}
                          </p>
                          <div className="flex justify-center p-4 bg-white rounded-lg">
                            <img src={setup2FAMutation.data.qrCode} alt="QR Code" className="w-48 h-48" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-foreground">{t('twoFactor.enterManually')}</Label>
                          <div className="flex gap-2">
                            <Input
                              readOnly
                              value={setup2FAMutation.data.secret}
                              className="bg-muted border-border font-mono text-sm"
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(setup2FAMutation.data.secret);
                                toast({ title: "Copied!" });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-foreground">{t('twoFactor.verificationCode')}</Label>
                          <Input
                            placeholder="000000"
                            maxLength={6}
                            className="bg-muted border-border text-center text-lg tracking-widest"
                            value={verifyToken}
                            onChange={(e) => setVerifyToken(e.target.value)}
                            data-testid="input-2fa-verify"
                          />
                        </div>

                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={verifyToken.length !== 6 || enable2FAMutation.isPending}
                          onClick={() => enable2FAMutation.mutate(verifyToken)}
                          data-testid="button-verify-2fa"
                        >
                          {enable2FAMutation.isPending ? t('twoFactor.verifying') : t('twoFactor.verify')}
                        </Button>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                        <p className="text-muted-foreground mt-4">{t('twoFactor.setuping')}</p>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {user?.role !== "admin" && user?.role !== "dispute_admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('kyc.title')}
            </CardTitle>
            <CardDescription>
              {t('kyc.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              {kycStatus?.status === "approved" ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-foreground font-medium">{t('kyc.verified')}</p>
                    <p className="text-muted-foreground text-sm">{t('kyc.tier')}: {kycStatus.tier}</p>
                  </div>
                </div>
              ) : kycStatus?.status === "pending" ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-6 w-6 border-2 border-yellow-500 border-t-transparent rounded-full" />
                  <div>
                    <p className="text-foreground font-medium">{t('kyc.pending')}</p>
                    <p className="text-muted-foreground text-sm">{t('kyc.pendingDesc')}</p>
                  </div>
                </div>
              ) : kycStatus?.status === "rejected" ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                    <div>
                      <p className="text-foreground font-medium">{t('kyc.rejected')}</p>
                      <p className="text-muted-foreground text-sm">{kycStatus.rejectionReason || t('common.cancel')}</p>
                    </div>
                  </div>
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setKycDialogOpen(true)}
                    data-testid="button-resubmit-kyc"
                  >
                    {t('kyc.resubmit')}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground font-medium">{t('kyc.notVerified')}</p>
                    <p className="text-muted-foreground text-sm">{t('kyc.completeKyc')}</p>
                  </div>
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setKycDialogOpen(true)}
                    data-testid="button-start-kyc"
                  >
                    {t('kyc.startVerification')}
                  </Button>
                </div>
              )}

              <Dialog open={kycDialogOpen} onOpenChange={setKycDialogOpen}>
                    <DialogContent className="max-w-md max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">{t('kyc.kycVerification')}</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[70vh] pr-4">
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label className="text-foreground">{t('kyc.idType')}</Label>
                          <Select value={idType} onValueChange={setIdType}>
                            <SelectTrigger className="bg-muted border-border" data-testid="select-id-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="passport">{t('kyc.passport')}</SelectItem>
                              <SelectItem value="national_id">{t('kyc.nationalId')}</SelectItem>
                              <SelectItem value="drivers_license">{t('kyc.driversLicense')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-foreground">{t('kyc.idNumber')}</Label>
                          <Input
                            placeholder={t('kyc.enterIdNumber')}
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            className="bg-muted border-border"
                            data-testid="input-id-number"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-foreground">{t('kyc.idDocument')}</Label>
                          <input
                            type="file"
                            ref={idDocumentRef}
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                          />
                          <div
                            onClick={() => idDocumentRef.current?.click()}
                            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                            data-testid="upload-id-document"
                          >
                            {idDocument ? (
                              <div className="flex items-center justify-center gap-2 text-green-500">
                                <FileText className="h-5 w-5" />
                                <span>{idDocument.name}</span>
                              </div>
                            ) : (
                              <div className="text-muted-foreground">
                                <Upload className="h-8 w-8 mx-auto mb-2" />
                                <p>Click to upload ID document</p>
                                <p className="text-xs">JPG, PNG or PDF (max 5MB)</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-foreground">Selfie with ID</Label>
                          <input
                            type="file"
                            ref={selfieRef}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setSelfie(e.target.files?.[0] || null)}
                          />
                          <div
                            onClick={() => selfieRef.current?.click()}
                            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                            data-testid="upload-selfie"
                          >
                            {selfie ? (
                              <div className="flex items-center justify-center gap-2 text-green-500">
                                <Camera className="h-5 w-5" />
                                <span>{selfie.name}</span>
                              </div>
                            ) : (
                              <div className="text-muted-foreground">
                                <Camera className="h-8 w-8 mx-auto mb-2" />
                                <p>Click to upload selfie holding your ID</p>
                                <p className="text-xs">JPG or PNG (max 5MB)</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          className="w-full bg-primary hover:bg-primary/90"
                          disabled={!idDocument || !selfie || !idNumber || submitKycMutation.isPending}
                          onClick={() => submitKycMutation.mutate()}
                          data-testid="button-submit-kyc"
                        >
                          {submitKycMutation.isPending ? "Submitting..." : "Submit Verification"}
                        </Button>
                      </div>
                      </ScrollArea>
                    </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Verified Badge Section */}
        {tradeStats && (
          <Card className="bg-card border-border border-yellow-200 bg-yellow-50/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-5 w-5 text-yellow-600" />
                Verified Badge Application
              </CardTitle>
              <CardDescription>
                Unlock the verified badge for increased trust and visibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userProfile?.hasVerifyBadge ? (
                <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <p className="font-bold text-green-700">
                      You have the Verified Badge! 🎉
                    </p>
                  </div>
                  <p className="text-sm text-green-600">
                    Your badge appears next to your name on your profile
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      Requirements to qualify:
                    </p>
                    <div className="space-y-2">
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${tradeStats.totalTrades >= 10 ? "bg-green-100/30 border border-green-200" : "bg-gray-100/30 border border-gray-200"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${tradeStats.totalTrades >= 10 ? "bg-green-600 text-white" : "border-2 border-gray-400 text-gray-400"}`}>
                          {tradeStats.totalTrades >= 10 ? "✓" : ""}
                        </div>
                        <div className="flex-1">
                          <span className={tradeStats.totalTrades >= 10 ? "text-green-700 font-medium" : "text-muted-foreground"}>
                            More than 10 trades
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Current: {tradeStats.totalTrades} trades
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${parseFloat(tradeStats.totalTradeVolume || "0") > 700 ? "bg-green-100/30 border border-green-200" : "bg-gray-100/30 border border-gray-200"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${parseFloat(tradeStats.totalTradeVolume || "0") > 700 ? "bg-green-600 text-white" : "border-2 border-gray-400 text-gray-400"}`}>
                          {parseFloat(tradeStats.totalTradeVolume || "0") > 700 ? "✓" : ""}
                        </div>
                        <div className="flex-1">
                          <span className={parseFloat(tradeStats.totalTradeVolume || "0") > 700 ? "text-green-700 font-medium" : "text-muted-foreground"}>
                            Trade volume above 700 USDT
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Current: ${tradeStats.totalTradeVolume || "0"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    disabled={
                      tradeStats.totalTrades < 10 ||
                      parseFloat(tradeStats.totalTradeVolume || "0") <= 700
                    }
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                    data-testid="button-apply-verify-badge"
                    onClick={() => {
                      console.log("Applying for verify badge");
                      toast({ title: "Application submitted", description: "Admin will review and approve your application soon" });
                    }}
                  >
                    Apply for Verified Badge
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Admin approval required • Badge appears next to your username once approved
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
