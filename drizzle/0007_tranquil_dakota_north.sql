CREATE TABLE "copy_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_position_id" uuid NOT NULL,
	"real_allocation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"size_usd_cents" integer NOT NULL,
	"realized_pnl_cents" integer,
	"active" boolean DEFAULT true NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "provider_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trader_slug" text NOT NULL,
	"instrument" text NOT NULL,
	"side" text NOT NULL,
	"entry_price" double precision NOT NULL,
	"close_price" double precision,
	"bucket" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "copy_positions" ADD CONSTRAINT "copy_positions_provider_position_id_provider_positions_id_fk" FOREIGN KEY ("provider_position_id") REFERENCES "public"."provider_positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_positions" ADD CONSTRAINT "copy_positions_real_allocation_id_real_allocations_id_fk" FOREIGN KEY ("real_allocation_id") REFERENCES "public"."real_allocations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_positions" ADD CONSTRAINT "copy_positions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;