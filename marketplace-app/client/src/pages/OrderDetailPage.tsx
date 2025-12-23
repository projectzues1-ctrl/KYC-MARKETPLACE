import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, getUser } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  Shield,
  DollarSign,
  ArrowRight,
  Lock,
  Unlock,
  KeyRound,
  BadgeCheck,
  XCircle,
  Star,
  ThumbsUp,
  User,
  Paperclip,
  FileText,
  Image,
  Video,
  File as FileIcon,
} from "lucide-react";

interface Order {
  id: string;
  offerId: string;
  buyerId: string;
  vendorId: string;
  tradeIntent: "sell_ad" | "buy_ad";
  amount: string;
  fiatAmount: string;
  pricePerUnit: string;
  currency: string;
  paymentMethod: string;
  status: string;
  escrowAmount: string | null;
  platformFee: string | null;
  sellerReceives: string | null;
  createdAt: string;
  autoReleaseAt: string | null;
}

interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderUsername?: string;
  message: string;
  fileUrl?: string;
  isSystemMessage: boolean;
  createdAt: string;
}

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const [, params] = useRoute("/order/:id");
  const orderId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getUser();
  const [, setLocation] = useLocation();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accountDetailsConfirmed, setAccountDetailsConfirmed] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackStars, setFeedbackStars] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");

  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/orders/${orderId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch order");
      }
      return res.json();
    },
    enabled: !!orderId,
    retry: 3,
    retryDelay: 1000,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["messages", orderId],
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/orders/${orderId}/messages`);
      return res.json();
    },
    enabled: !!orderId,
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetchWithAuth(`/api/orders/${orderId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", orderId] });
      setNewMessage("");
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/orders/${orderId}/messages/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload file");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", orderId] });
      toast({ title: "File uploaded", description: "File sent successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to upload file" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
      e.target.value = "";
    }
  };

  const getFileIcon = (fileUrl: string) => {
    const ext = fileUrl.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return Image;
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) return Video;
    if (['pdf', 'doc', 'docx'].includes(ext || '')) return FileText;
    return FileIcon;
  };

  const isImageFile = (fileUrl: string) => {
    const ext = fileUrl.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif'].includes(ext || '');
  };

  const markPaidMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchWithAuth(`/api/orders/${orderId}/paid`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to mark as paid");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      toast({ title: "Payment marked", description: "Waiting for vendor confirmation" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to mark payment" });
    },
  });

  const confirmOrderMutation = useMutation({
    mutationFn: async (twoFactorToken?: string) => {
      const res = await fetchWithAuth(`/api/orders/${orderId}/confirm`, {
        method: "POST",
        body: JSON.stringify({ twoFactorToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requires2FASetup) {
          throw new Error("requires2FASetup");
        }
        if (data.requires2FA) {
          throw new Error("requires2FA");
        }
        throw new Error(data.message || "Failed to confirm delivery");
      }
      return data;
    },
    onSuccess: (data) => {
      setShow2FADialog(false);
      setTwoFactorCode("");
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast({ 
        title: "Delivery Confirmed!", 
        description: `Payment released to seller (${data.sellerAmount} USDT after 20% platform fee)` 
      });
    },
    onError: (error: Error) => {
      if (error.message === "requires2FASetup") {
        toast({ 
          variant: "destructive", 
          title: "2FA Required", 
          description: "You must enable two-factor authentication before confirming delivery. Go to Settings > Security to enable 2FA." 
        });
        setLocation("/settings");
        return;
      }
      if (error.message === "requires2FA") {
        setShow2FADialog(true);
        return;
      }
      setTwoFactorCode("");
      toast({ variant: "destructive", title: "Failed to confirm delivery", description: error.message });
    },
  });

  const deliverProductMutation = useMutation({
    mutationFn: async (deliveryDetails: string | undefined = undefined) => {
      const res = await fetchWithAuth(`/api/orders/${orderId}/deliver`, {
        method: "POST",
        body: JSON.stringify({ deliveryDetails }),
      });
      if (!res.ok) throw new Error("Failed to mark as delivered");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      toast({ title: "Product Delivered", description: "Waiting for buyer to confirm receipt" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to mark as delivered" });
    },
  });

  const openDisputeMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetchWithAuth(`/api/orders/${orderId}/dispute`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Failed to open dispute");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      setShowDisputeDialog(false);
      setDisputeReason("");
      toast({ title: "Dispute opened", description: "An admin will review your case" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to open dispute" });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetchWithAuth(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to cancel order");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      setShowCancelDialog(false);
      setCancelReason("");
      toast({ title: "Order cancelled", description: "The order has been cancelled and any escrowed funds have been refunded" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed to cancel order", description: error.message });
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ stars, comment }: { stars: number; comment: string }) => {
      const res = await fetchWithAuth(`/api/orders/${orderId}/feedback`, {
        method: "POST",
        body: JSON.stringify({ stars, comment }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit feedback");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback", orderId] });
      setShowFeedbackDialog(false);
      setFeedbackStars(5);
      setFeedbackComment("");
      toast({ title: "Feedback submitted", description: "Thank you for your feedback!" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed to submit feedback", description: error.message });
    },
  });

  const { data: feedbackStatus } = useQuery({
    queryKey: ["feedback", orderId],
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/orders/${orderId}/feedback`);
      return res.json();
    },
    enabled: !!orderId && order?.status === "completed",
  });

  const depositMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchWithAuth(`/api/orders/${orderId}/deposit`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to deposit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast({ title: "Funds Deposited!", description: "Funds are now in escrow. Waiting for seller to deliver." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed to deposit", description: error.message });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage);
    }
  };

  const isBuyer = order?.buyerId === user?.id;
  const isBuyAd = order?.tradeIntent === "buy_ad";

  const getStatusStep = (status: string) => {
    switch (status) {
      case "awaiting_deposit": return 0;
      case "escrowed": return 1;
      case "created": return 1;
      case "paid": return 2;
      case "confirmed": return 3;
      case "completed": return 4;
      default: return 0;
    }
  };

  const steps = isBuyAd ? [
    { label: "Deposit Required", icon: DollarSign },
    { label: "Funds in Escrow", icon: Lock },
    { label: "Product Delivered", icon: ArrowRight },
    { label: "Completed", icon: Unlock },
  ] : [
    { label: "Funds in Escrow", icon: Lock },
    { label: "Payment Sent", icon: DollarSign },
    { label: "Product Delivered", icon: ArrowRight },
    { label: "Completed", icon: Unlock },
  ];

  if (orderLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64 bg-gray-800" />
          <Skeleton className="h-64 bg-gray-800" />
          <Skeleton className="h-96 bg-gray-800" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-xl">Order not found</p>
        </div>
      </Layout>
    );
  }

  const currentStep = getStatusStep(order.status);

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
            Order #{order.id.slice(0, 8)}
          </h1>
          <Badge className={
            order.status === "completed" ? "bg-green-600" :
            order.status === "disputed" ? "bg-orange-600" :
            order.status === "cancelled" ? "bg-red-600" :
            order.status === "awaiting_deposit" ? "bg-yellow-600" :
            order.status === "escrowed" ? "bg-purple-600" :
            "bg-blue-600"
          }>
            {order.status === "awaiting_deposit" ? "Awaiting Deposit" :
             order.status === "escrowed" ? "Funds Escrowed" :
             order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-400" />
              Order Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center relative">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      index < currentStep
                        ? "bg-green-600"
                        : index === currentStep
                        ? "bg-purple-600"
                        : "bg-gray-700"
                    }`}
                  >
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm text-gray-400 mt-2 text-center">{step.label}</p>
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute top-6 left-12 w-full h-0.5 ${
                        index < currentStep ? "bg-green-600" : "bg-gray-700"
                      }`}
                      style={{ width: "calc(100% + 2rem)" }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-sm">Accounts</p>
                <p className="text-white font-bold">
                  {Math.floor(parseFloat(order.amount))} account{Math.floor(parseFloat(order.amount)) !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-sm">Total Price</p>
                <p className="text-white font-bold">${Math.floor(parseFloat(order.fiatAmount))}</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-sm">Payment Method</p>
                <p className="text-white font-bold">{order.paymentMethod}</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-sm">Price/Account</p>
                <p className="text-white font-bold">${Math.floor(parseFloat(order.pricePerUnit))}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {isBuyer && isBuyAd && order.status === "awaiting_deposit" && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => depositMutation.mutate()}
                  disabled={depositMutation.isPending}
                  data-testid="button-deposit-funds"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Deposit ${parseFloat(order.fiatAmount).toFixed(2)} to Escrow
                </Button>
              )}

              {isBuyer && !isBuyAd && order.status === "escrowed" && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => markPaidMutation.mutate()}
                  disabled={markPaidMutation.isPending}
                  data-testid="button-mark-paid"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  I've Sent Payment
                </Button>
              )}

              {isBuyer && order.status === "created" && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => markPaidMutation.mutate()}
                  disabled={markPaidMutation.isPending}
                  data-testid="button-mark-paid"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  I've Sent Payment
                </Button>
              )}

              {!isBuyer && (order.status === "paid" || order.status === "escrowed") && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => deliverProductMutation.mutate(undefined)}
                  disabled={deliverProductMutation.isPending}
                  data-testid="button-deliver-product"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Deliver Product
                </Button>
              )}

              {isBuyer && order.status === "confirmed" && (
                <div className="flex flex-col gap-3 w-full">
                  <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="confirm-account-details"
                        checked={accountDetailsConfirmed}
                        onCheckedChange={(checked) => setAccountDetailsConfirmed(checked === true)}
                        data-testid="checkbox-confirm-account-details"
                      />
                      <label 
                        htmlFor="confirm-account-details" 
                        className="text-yellow-300 text-sm cursor-pointer"
                      >
                        I confirm that I have received and verified the account details provided by the seller in the chat. I understand that once I release payment, this action cannot be undone.
                      </label>
                    </div>
                  </div>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => confirmOrderMutation.mutate(undefined)}
                    disabled={confirmOrderMutation.isPending || !accountDetailsConfirmed}
                    data-testid="button-confirm-delivery"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Delivery (Release Payment)
                  </Button>
                </div>
              )}

              {(order.status === "created" || order.status === "escrowed" || order.status === "paid" || order.status === "confirmed") && (
                <Button
                  variant="outline"
                  className="border-orange-600 text-orange-400 hover:bg-orange-600/20"
                  onClick={() => setShowDisputeDialog(true)}
                  disabled={openDisputeMutation.isPending}
                  data-testid="button-open-dispute"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Open Dispute
                </Button>
              )}

              {(order.status === "created" || order.status === "escrowed") && (
                <Button
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600/20"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelOrderMutation.isPending}
                  data-testid="button-cancel-order"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              )}

              {order.status === "completed" && !feedbackStatus?.hasSubmitted && (
                <Button
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => setShowFeedbackDialog(true)}
                  data-testid="button-leave-feedback"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Leave Feedback
                </Button>
              )}
            </div>

            {order.status === "awaiting_deposit" && isBuyer && (
              <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <p className="text-yellow-300 text-sm">
                  Please deposit ${parseFloat(order.fiatAmount).toFixed(2)} USDT to proceed with this order.
                </p>
              </div>
            )}

            {order.autoReleaseAt && order.status === "paid" && (
              <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <p className="text-yellow-300 text-sm">
                  Auto-release at: {new Date(order.autoReleaseAt).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>


        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Order Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-800/50 rounded-lg">
              {messagesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 bg-gray-700" />
                  ))}
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.isSystemMessage 
                        ? "justify-center" 
                        : msg.senderId === user?.id 
                        ? "justify-end" 
                        : "justify-start"
                    }`}
                    data-testid={`message-${msg.id}`}
                  >
                    {msg.isSystemMessage ? (
                      <div className="px-4 py-2 bg-gray-700/50 rounded-full text-xs text-gray-400 italic">
                        {msg.message}
                      </div>
                    ) : (
                      <div className="flex flex-col max-w-[75%]">
                        {msg.senderId !== user?.id && (
                          <span className="text-xs text-purple-400 mb-1 ml-1 font-medium">
                            {isBuyer ? "Seller" : "Buyer"}
                          </span>
                        )}
                        <div
                          className={`p-3 rounded-xl ${
                            msg.senderId === user?.id
                              ? "bg-purple-600 text-white rounded-br-sm"
                              : "bg-gray-700 text-white rounded-bl-sm"
                          }`}
                        >
                          {msg.fileUrl && (
                            <div className="mb-2">
                              {isImageFile(msg.fileUrl) ? (
                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <img 
                                    src={msg.fileUrl} 
                                    alt="Attachment" 
                                    className="max-w-full max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  />
                                </a>
                              ) : (
                                <a 
                                  href={msg.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 bg-gray-600/50 rounded-lg hover:bg-gray-600/70 transition-colors"
                                >
                                  {(() => {
                                    const FileIcon = getFileIcon(msg.fileUrl);
                                    return <FileIcon className="h-5 w-5" />;
                                  })()}
                                  <span className="text-sm underline truncate max-w-[200px]">
                                    {msg.message.replace('📎 Attached file: ', '')}
                                  </span>
                                </a>
                              )}
                            </div>
                          )}
                          {!msg.fileUrl && <p className="text-sm whitespace-pre-wrap">{msg.message}</p>}
                          <p className={`text-xs mt-1 ${
                            msg.senderId === user?.id ? "text-purple-200" : "text-gray-400"
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,.csv,.mp4,.mov,.avi,.webm"
            />
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadFileMutation.isPending}
                data-testid="button-attach-file"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 border-gray-700 text-white"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                data-testid="input-chat-message"
              />
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                Open Dispute
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Please describe the issue with this transaction. Be as detailed as possible to help the dispute admin resolve your case.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Reason for dispute</Label>
                <Textarea
                  placeholder="Describe the issue (e.g., seller hasn't delivered, wrong product received, payment not received...)"
                  className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  data-testid="input-dispute-reason"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-700"
                  onClick={() => {
                    setShowDisputeDialog(false);
                    setDisputeReason("");
                  }}
                  data-testid="button-cancel-dispute"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={() => openDisputeMutation.mutate(disputeReason)}
                  disabled={!disputeReason.trim() || openDisputeMutation.isPending}
                  data-testid="button-submit-dispute"
                >
                  {openDisputeMutation.isPending ? "Opening..." : "Open Dispute"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-purple-400" />
                Authenticator Code Required
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter the 6-digit code from your authenticator app to confirm delivery and release payment. This ensures you authorized this transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                className="bg-gray-800 border-gray-700 text-white text-center text-lg tracking-widest"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                data-testid="input-2fa-code"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-700"
                  onClick={() => {
                    setShow2FADialog(false);
                    setTwoFactorCode("");
                  }}
                  data-testid="button-cancel-2fa"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => confirmOrderMutation.mutate(twoFactorCode)}
                  disabled={twoFactorCode.length !== 6 || confirmOrderMutation.isPending}
                  data-testid="button-submit-2fa"
                >
                  {confirmOrderMutation.isPending ? "Confirming..." : "Confirm & Release"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Leave Feedback
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Rate your experience with this trade. Your feedback helps build trust in the marketplace.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={`${feedbackStars >= star ? 'text-yellow-400' : 'text-gray-600'} hover:text-yellow-400`}
                      onClick={() => setFeedbackStars(star)}
                      data-testid={`button-star-${star}`}
                    >
                      <Star className={`h-6 w-6 ${feedbackStars >= star ? 'fill-yellow-400' : ''}`} />
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Comment (optional)</Label>
                <Textarea
                  placeholder="Share your experience..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  data-testid="input-feedback-comment"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-700"
                  onClick={() => {
                    setShowFeedbackDialog(false);
                    setFeedbackStars(5);
                    setFeedbackComment("");
                  }}
                  data-testid="button-cancel-feedback"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => submitFeedbackMutation.mutate({ stars: feedbackStars, comment: feedbackComment })}
                  disabled={submitFeedbackMutation.isPending}
                  data-testid="button-submit-feedback"
                >
                  {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
