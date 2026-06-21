CREATE TABLE "push_device_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"platform" text DEFAULT 'android' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "push_device_tokens_token_idx" ON "push_device_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "push_device_tokens_user_id_idx" ON "push_device_tokens" USING btree ("user_id");