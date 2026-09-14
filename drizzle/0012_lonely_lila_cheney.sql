CREATE TABLE "admin_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"flag" text DEFAULT '🏳️' NOT NULL,
	"strategy" text NOT NULL,
	"style" text NOT NULL,
	"markets" text NOT NULL,
	"bio" text NOT NULL,
	"perf_fee" integer NOT NULL,
	"min_copy" integer NOT NULL,
	"win_rate" double precision NOT NULL,
	"verified" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_providers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "flagged" boolean DEFAULT false NOT NULL;