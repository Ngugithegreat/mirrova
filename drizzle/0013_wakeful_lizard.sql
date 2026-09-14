ALTER TABLE "platform_settings" ADD COLUMN "blow_schedule_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "blow_schedule_email" text;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "auto_blow_days" double precision DEFAULT 0 NOT NULL;