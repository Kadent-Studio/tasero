CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL UNIQUE,
	"group" text,
	"scopes" jsonb DEFAULT '[]' NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"expires_at" integer,
	"last_used_at" integer,
	"revoked_at" integer,
	"revoked_reason" text,
	"created_at" integer DEFAULT (extract(epoch from now())::integer) NOT NULL,
	"updated_at" integer DEFAULT (extract(epoch from now())::integer) NOT NULL
);
