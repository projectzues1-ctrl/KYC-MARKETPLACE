import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MaintenanceSettings {
  mode: "none" | "full" | "financial" | "trading" | "readonly";
  message: string | null;
  customReason: string | null;
  expectedDowntime: string | null;
  depositsEnabled: boolean;
  withdrawalsEnabled: boolean;
  tradingEnabled: boolean;
  loginEnabled: boolean;
}

export default function MaintenancePage() {
  const { t } = useTranslation();
  const { data: settings, refetch, isRefetching } = useQuery<MaintenanceSettings>({
    queryKey: ["public-maintenance"],
    queryFn: async () => {
      const res = await fetch("/api/maintenance/status");
      if (!res.ok) throw new Error("Failed to fetch maintenance status");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const getModeTitle = () => {
    switch (settings?.mode) {
      case "full":
        return "Platform Under Full Maintenance";
      case "financial":
        return "Financial Services Temporarily Unavailable";
      case "trading":
        return "Trading/Order Services Temporarily Unavailable";
      case "readonly":
        return "Platform in Read-Only Mode";
      default:
        return "Platform Under Maintenance";
    }
  };

  const getModeDescription = () => {
    if (settings?.customReason) {
      return settings.customReason;
    }
    switch (settings?.mode) {
      case "full":
        return "We are performing scheduled maintenance. Login and sign up are temporarily disabled. Only administrators have access.";
      case "financial":
        return "Deposit and withdrawal services are temporarily unavailable. You can still login, view orders, access KYC, and use support.";
      case "trading":
        return "Order creation and matching are temporarily unavailable. You can still login, view balances, deposit, withdraw, and access support.";
      case "readonly":
        return "Emergency maintenance mode. You can login and view your balances, orders, and history, but all actions are disabled.";
      default:
        return "We are upgrading our systems to improve security and performance.";
    }
  };

  const getEnabledFeatures = () => {
    switch (settings?.mode) {
      case "trading":
        return ["Login", "View Balances", "Deposits", "Withdrawals", "KYC", "Disputes", "Chat/Support"];
      case "financial":
        return ["Login", "View Orders", "KYC", "Disputes", "Admin Panel"];
      case "readonly":
        return ["Login", "View Balances", "View Orders", "View History"];
      case "full":
        return ["Super-admin access only"];
      default:
        return [];
    }
  };

  const getDisabledFeatures = () => {
    switch (settings?.mode) {
      case "trading":
        return ["Create Orders", "Accept/Match Orders", "Order Status Changes"];
      case "financial":
        return ["Deposits", "Withdrawals"];
      case "readonly":
        return ["All User Actions"];
      case "full":
        return ["Login", "Sign Up", "All User Actions"];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4" data-testid="maintenance-page">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 md:p-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white truncate" data-testid="maintenance-title">
              {getModeTitle()}
            </h1>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed" data-testid="maintenance-message">
              {getModeDescription()}
            </p>
          </div>

          {settings?.expectedDowntime && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg" data-testid="maintenance-downtime">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-medium">
                Estimated time: {settings.expectedDowntime}
              </span>
            </div>
          )}

          {/* Disabled Features */}
          {getDisabledFeatures().length > 0 && (
            <div className="space-y-2" data-testid="maintenance-disabled-features">
              <p className="text-red-400 text-sm font-medium">Disabled:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {getDisabledFeatures().map((feature) => (
                  <Badge key={feature} variant="outline" className="bg-red-500/10 text-red-400 border-red-500/50">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Enabled Features */}
          {getEnabledFeatures().length > 0 && settings?.mode !== "full" && (
            <div className="space-y-2" data-testid="maintenance-enabled-features">
              <p className="text-green-400 text-sm font-medium">Still Available:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {getEnabledFeatures().map((feature) => (
                  <Badge key={feature} variant="outline" className="bg-green-500/10 text-green-400 border-green-500/50">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 space-y-4">
            <Button
              variant="outline"
              className="border-gray-600 hover:bg-gray-700"
              onClick={() => refetch()}
              disabled={isRefetching}
              data-testid="button-check-status"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Check Status
            </Button>
            
            <p className="text-gray-500 text-sm">
              Thank you for your patience. We'll be back shortly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
