CREATE TABLE "desk_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"instrument" text NOT NULL,
	"side" text NOT NULL,
	"stake_usd_cents" integer NOT NULL,
	"leverage" integer NOT NULL,
	"entry_price" double precision NOT NULL,
	"stop_loss_price" double precision,
	"take_profit_price" double precision,
	"active" boolean DEFAULT true NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"close_price" double precision,
	"pnl_cents" integer
);
--> statement-breakpoint
ALTER TABLE "desk_positions" ADD CONSTRAINT "desk_positions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;