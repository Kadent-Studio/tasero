ALTER TABLE "api_keys" ALTER COLUMN "expires_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "last_used_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "revoked_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING to_timestamp("expires_at") AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "last_used_at" SET DATA TYPE timestamp with time zone USING to_timestamp("last_used_at") AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "revoked_at" SET DATA TYPE timestamp with time zone USING to_timestamp("revoked_at") AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING to_timestamp("created_at") AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING to_timestamp("updated_at") AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "updated_at" SET DEFAULT now();