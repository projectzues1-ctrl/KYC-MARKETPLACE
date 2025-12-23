CREATE TYPE "public"."countdown_time" AS ENUM('15min', '30min', '1hr', '2hr');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'in_review', 'resolved_refund', 'resolved_release');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'approved', 'rejected', 'resubmit');--> statement-breakpoint
CREATE TYPE "public"."kyc_tier" AS ENUM('tier0', 'tier1', 'tier2');--> statement-breakpoint
CREATE TYPE "public"."liability_type" AS ENUM('full_payment', 'partial_10', 'partial_25', 'partial_50', 'time_bound_24h', 'time_bound_48h', 'time_bound_72h', 'time_bound_1week', 'time_bound_1month');--> statement-breakpoint
CREATE TYPE "public"."loader_dispute_status" AS ENUM('open', 'in_review', 'resolved_loader_wins', 'resolved_receiver_wins', 'resolved_mutual');--> statement-breakpoint
CREATE TYPE "public"."loader_feedback_type" AS ENUM('positive', 'negative');--> statement-breakpoint
CREATE TYPE "public"."loader_order_status" AS ENUM('created', 'awaiting_liability_confirmation', 'awaiting_payment_details', 'payment_details_sent', 'payment_sent', 'asset_frozen_waiting', 'completed', 'closed_no_payment', 'cancelled_auto', 'cancelled_loader', 'cancelled_receiver', 'disputed', 'resolved_loader_wins', 'resolved_receiver_wins', 'resolved_mutual');--> statement-breakpoint
CREATE TYPE "public"."maintenance_mode" AS ENUM('none', 'partial', 'full');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('order', 'payment', 'escrow', 'dispute', 'kyc', 'vendor', 'wallet', 'system');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('created', 'awaiting_deposit', 'escrowed', 'paid', 'confirmed', 'completed', 'cancelled', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'basic', 'pro', 'featured');--> statement-breakpoint
CREATE TYPE "public"."trade_intent" AS ENUM('sell_ad', 'buy_ad');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('deposit', 'withdraw', 'escrow_hold', 'escrow_release', 'fee', 'refund');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'vendor', 'customer', 'support', 'dispute_admin');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"changes" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"message" text NOT NULL,
	"file_url" text,
	"is_system_message" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"message" text NOT NULL,
	"file_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"opened_by" varchar NOT NULL,
	"reason" text NOT NULL,
	"evidence_urls" text[] DEFAULT ARRAY[]::text[],
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"resolution" text,
	"resolved_by" varchar,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "exchanges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"description" text,
	"icon_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exchanges_name_unique" UNIQUE("name"),
	CONSTRAINT "exchanges_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "kyc" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"tier" "kyc_tier" DEFAULT 'tier0' NOT NULL,
	"status" "kyc_status" DEFAULT 'pending' NOT NULL,
	"id_type" text,
	"id_number" text,
	"id_document_url" text,
	"id_front_url" text,
	"id_back_url" text,
	"selfie_url" text,
	"face_match_score" numeric(5, 2),
	"admin_notes" text,
	"rejection_reason" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" varchar,
	"is_star_verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loader_ads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loader_id" varchar NOT NULL,
	"asset_type" text NOT NULL,
	"deal_amount" numeric(18, 2) NOT NULL,
	"loading_terms" text,
	"upfront_percentage" integer DEFAULT 0,
	"countdown_time" "countdown_time" DEFAULT '30min' NOT NULL,
	"payment_methods" text[] NOT NULL,
	"frozen_commitment" numeric(18, 2) NOT NULL,
	"loader_fee_reserve" numeric(18, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loader_disputes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"opened_by" varchar NOT NULL,
	"reason" text NOT NULL,
	"evidence_urls" text[] DEFAULT ARRAY[]::text[],
	"status" "loader_dispute_status" DEFAULT 'open' NOT NULL,
	"resolution" text,
	"resolved_by" varchar,
	"winner_id" varchar,
	"loser_id" varchar,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "loader_feedback" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"giver_id" varchar NOT NULL,
	"receiver_id" varchar NOT NULL,
	"feedback_type" "loader_feedback_type" NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loader_order_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"sender_id" varchar,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_admin_message" boolean DEFAULT false NOT NULL,
	"content" text NOT NULL,
	"file_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loader_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" varchar NOT NULL,
	"loader_id" varchar NOT NULL,
	"receiver_id" varchar NOT NULL,
	"deal_amount" numeric(18, 2) NOT NULL,
	"loader_frozen_amount" numeric(18, 2) NOT NULL,
	"loader_fee_reserve" numeric(18, 2) DEFAULT '0' NOT NULL,
	"receiver_frozen_amount" numeric(18, 2) DEFAULT '0',
	"receiver_fee_reserve" numeric(18, 2) DEFAULT '0',
	"status" "loader_order_status" DEFAULT 'created' NOT NULL,
	"countdown_time" "countdown_time" DEFAULT '30min' NOT NULL,
	"countdown_expires_at" timestamp,
	"countdown_stopped" boolean DEFAULT false NOT NULL,
	"loader_sent_payment_details" boolean DEFAULT false NOT NULL,
	"receiver_sent_payment_details" boolean DEFAULT false NOT NULL,
	"loader_marked_payment_sent" boolean DEFAULT false NOT NULL,
	"receiver_confirmed_payment" boolean DEFAULT false NOT NULL,
	"liability_type" "liability_type",
	"receiver_liability_confirmed" boolean DEFAULT false NOT NULL,
	"loader_liability_confirmed" boolean DEFAULT false NOT NULL,
	"liability_locked_at" timestamp,
	"liability_deadline" timestamp,
	"cancelled_by" varchar,
	"cancel_reason" text,
	"loader_fee_deducted" numeric(18, 2) DEFAULT '0',
	"receiver_fee_deducted" numeric(18, 2) DEFAULT '0',
	"penalty_amount" numeric(18, 2) DEFAULT '0',
	"penalty_paid_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "loader_stats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"total_trades" integer DEFAULT 0 NOT NULL,
	"completed_trades" integer DEFAULT 0 NOT NULL,
	"cancelled_trades" integer DEFAULT 0 NOT NULL,
	"disputed_trades" integer DEFAULT 0 NOT NULL,
	"positive_feedback" integer DEFAULT 0 NOT NULL,
	"negative_feedback" integer DEFAULT 0 NOT NULL,
	"is_verified_vendor" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loader_stats_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "maintenance_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mode" "maintenance_mode" DEFAULT 'none' NOT NULL,
	"message" text,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"type" text NOT NULL,
	"trade_intent" "trade_intent" DEFAULT 'sell_ad' NOT NULL,
	"currency" text NOT NULL,
	"price_per_unit" numeric(18, 8) NOT NULL,
	"min_limit" numeric(18, 2) NOT NULL,
	"max_limit" numeric(18, 2) NOT NULL,
	"available_amount" numeric(18, 8) NOT NULL,
	"payment_methods" text[] NOT NULL,
	"terms" text,
	"account_details" jsonb,
	"escrow_held_amount" numeric(18, 8) DEFAULT '0',
	"is_active" boolean DEFAULT true NOT NULL,
	"is_priority" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" varchar NOT NULL,
	"buyer_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"created_by" varchar,
	"trade_intent" "trade_intent" DEFAULT 'sell_ad' NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"fiat_amount" numeric(18, 2) NOT NULL,
	"price_per_unit" numeric(18, 8) NOT NULL,
	"currency" text NOT NULL,
	"payment_method" text NOT NULL,
	"status" "order_status" DEFAULT 'created' NOT NULL,
	"escrow_amount" numeric(18, 8),
	"platform_fee" numeric(18, 8),
	"seller_receives" numeric(18, 8),
	"buyer_paid_at" timestamp,
	"vendor_confirmed_at" timestamp,
	"completed_at" timestamp,
	"escrow_held_at" timestamp,
	"escrow_released_at" timestamp,
	"auto_release_at" timestamp,
	"cancel_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"rated_by" varchar NOT NULL,
	"stars" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_dislikes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_mutes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"muted_by" varchar NOT NULL,
	"reason" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"dislikes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"shares_count" integer DEFAULT 0 NOT NULL,
	"original_post_id" varchar,
	"quote_text" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theme_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"primary_color" text DEFAULT '#3b82f6',
	"logo_url" text,
	"banner_urls" text[] DEFAULT ARRAY[]::text[],
	"branding_config" jsonb,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"wallet_id" varchar NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"currency" text NOT NULL,
	"related_order_id" varchar,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"profile_picture" text,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"two_factor_recovery_codes" text[],
	"email_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_frozen" boolean DEFAULT false NOT NULL,
	"frozen_reason" text,
	"last_login_at" timestamp,
	"login_attempts" integer DEFAULT 0 NOT NULL,
	"device_fingerprints" text[] DEFAULT ARRAY[]::text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"business_name" text,
	"bio" text,
	"country" text NOT NULL,
	"subscription_plan" "subscription_plan" DEFAULT 'free' NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"total_trades" integer DEFAULT 0 NOT NULL,
	"completed_trades" integer DEFAULT 0 NOT NULL,
	"cancelled_trades" integer DEFAULT 0 NOT NULL,
	"average_rating" numeric(3, 2) DEFAULT '0',
	"total_ratings" integer DEFAULT 0 NOT NULL,
	"suspicious_activity_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"currency" text DEFAULT 'USDT' NOT NULL,
	"available_balance" numeric(18, 8) DEFAULT '0' NOT NULL,
	"escrow_balance" numeric(18, 8) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_chat_messages" ADD CONSTRAINT "dispute_chat_messages_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_chat_messages" ADD CONSTRAINT "dispute_chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc" ADD CONSTRAINT "kyc_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc" ADD CONSTRAINT "kyc_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_ads" ADD CONSTRAINT "loader_ads_loader_id_users_id_fk" FOREIGN KEY ("loader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_disputes" ADD CONSTRAINT "loader_disputes_order_id_loader_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."loader_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_disputes" ADD CONSTRAINT "loader_disputes_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_disputes" ADD CONSTRAINT "loader_disputes_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_disputes" ADD CONSTRAINT "loader_disputes_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_disputes" ADD CONSTRAINT "loader_disputes_loser_id_users_id_fk" FOREIGN KEY ("loser_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_feedback" ADD CONSTRAINT "loader_feedback_order_id_loader_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."loader_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_feedback" ADD CONSTRAINT "loader_feedback_giver_id_users_id_fk" FOREIGN KEY ("giver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_feedback" ADD CONSTRAINT "loader_feedback_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_order_messages" ADD CONSTRAINT "loader_order_messages_order_id_loader_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."loader_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_order_messages" ADD CONSTRAINT "loader_order_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_orders" ADD CONSTRAINT "loader_orders_ad_id_loader_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."loader_ads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_orders" ADD CONSTRAINT "loader_orders_loader_id_users_id_fk" FOREIGN KEY ("loader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_orders" ADD CONSTRAINT "loader_orders_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_orders" ADD CONSTRAINT "loader_orders_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_orders" ADD CONSTRAINT "loader_orders_penalty_paid_by_users_id_fk" FOREIGN KEY ("penalty_paid_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loader_stats" ADD CONSTRAINT "loader_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_settings" ADD CONSTRAINT "maintenance_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rated_by_users_id_fk" FOREIGN KEY ("rated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_dislikes" ADD CONSTRAINT "social_dislikes_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_dislikes" ADD CONSTRAINT "social_dislikes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_likes" ADD CONSTRAINT "social_likes_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_likes" ADD CONSTRAINT "social_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_mutes" ADD CONSTRAINT "social_mutes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_mutes" ADD CONSTRAINT "social_mutes_muted_by_users_id_fk" FOREIGN KEY ("muted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_original_post_id_social_posts_id_fk" FOREIGN KEY ("original_post_id") REFERENCES "public"."social_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_settings" ADD CONSTRAINT "theme_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_related_order_id_orders_id_fk" FOREIGN KEY ("related_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;