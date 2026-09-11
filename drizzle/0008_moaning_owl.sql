ALTER TABLE "copies" ADD COLUMN "value_cents" integer;--> statement-breakpoint
ALTER TABLE "copies" ADD COLUMN "pnl_cents" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_product_updates" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_signal_alerts" boolean DEFAULT true NOT NULL;