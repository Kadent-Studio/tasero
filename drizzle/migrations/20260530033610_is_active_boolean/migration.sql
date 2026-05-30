ALTER TABLE "api_keys" ALTER COLUMN "is_active" SET DATA TYPE boolean USING "is_active"::boolean;--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "is_active" SET DEFAULT true;