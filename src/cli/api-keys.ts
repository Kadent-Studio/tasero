import "dotenv/config";

import { checkbox, confirm, input, select } from "@inquirer/prompts";
import {
  createApiKey,
  listActiveApiKeys,
  listApiKeys,
  revokeApiKey,
  type ApiKeyListItem,
  type CreatedApiKey,
} from "../services/api-keys.ts";

const SCOPE_OPTIONS = [
  { name: "Read rates (read:rates)", value: "read:rates" },
  { name: "Write rates (write:rates)", value: "write:rates" },
  { name: "Read admin (read:admin)", value: "read:admin" },
  { name: "Write admin (write:admin)", value: "write:admin" },
  { name: "Full access (*)", value: "*" },
];

function printApiKeyCreated(key: CreatedApiKey) {
  console.log("\n✅ API key created successfully!");
  console.log(`\nKey:   ${key.fullKey}`);
  console.log(`Name:   ${key.name}`);
  if (key.description) console.log(`Description: ${key.description}`);
  if (key.group) console.log(`Group:      ${key.group}`);
  console.log(`Scopes: ${key.scopes.join(", ") || "none"}`);
  if (key.expiresAt) {
    console.log(`Expires: ${key.expiresAt.toISOString()}`);
  }
  console.log("\n⚠️  Store this key securely. It will not be shown again.\n");
}

function printApiKeyList(keys: ApiKeyListItem[]) {
  if (keys.length === 0) {
    console.log("\nNo API keys found.\n");
    return;
  }

  console.log(`\n📋 API Keys (${keys.length}):`);
  console.log("─".repeat(84));
  for (const key of keys) {
    const status = key.isActive ? "✅ Active" : "🔴 Revoked";
    const expires = key.expiresAt ? key.expiresAt.toLocaleDateString() : "Never";
    const lastUsed = key.lastUsedAt ? key.lastUsedAt.toLocaleDateString() : "Never";

    console.log(`ID:        ${key.id}`);
    console.log(`Name:      ${key.name}`);
    console.log(`Prefix:    ${key.keyPrefix}...`);
    console.log(`Status:    ${status}`);
    console.log(`Scopes:    ${key.scopes.join(", ") || "none"}`);
    if (key.group) console.log(`Group:     ${key.group}`);
    if (key.revokedReason) console.log(`Reason:    ${key.revokedReason}`);
    console.log(`Created:   ${key.createdAt.toLocaleDateString()}`);
    console.log(`Expires:   ${expires}`);
    console.log(`Last Used: ${lastUsed}`);
    console.log("─".repeat(84));
  }
  console.log();
}

// ── Screens ──────────────────────────────────────────────────────────────────

async function screenCreate() {
  const name = await input({
    message: "API key name:",
    required: true,
  });

  const description = await input({ message: "Description (optional):" });

  const group = await input({
    message: "Group (e.g. project-abc-web) (optional):",
  });

  const scopes = await checkbox({
    message: "Select scopes:",
    choices: SCOPE_OPTIONS,
  });

  const days = await input({
    message: "Expiration in days (leave empty for no expiration):",
    validate: (v: string) =>
      v === "" || (!isNaN(Number(v)) && Number(v) > 0)
        ? true
        : "Enter a positive number or leave empty",
  });

  const maxAge = days ? Number(days) * 86400000 : null; // Convert days to milliseconds
  const expiresAt = maxAge ? new Date(Date.now() + maxAge) : null;

  const created = await createApiKey({
    name,
    description: description || undefined,
    group: group || undefined,
    scopes,
    expiresAt,
  });

  printApiKeyCreated(created);
}

async function screenList() {
  const keys = await listApiKeys();
  printApiKeyList(keys);
}

async function screenRevoke() {
  const keys = await listActiveApiKeys();

  if (keys.length === 0) {
    console.log("\nNo active API keys to revoke.\n");
    return;
  }

  const choice = await select({
    message: "Select an API key to revoke:",
    choices: keys.map((k) => ({
      name: `${k.name} (${k.keyPrefix}...)`,
      value: k.id,
    })),
  });

  const reason = await input({
    message: "Reason for revocation (optional):",
  });

  const confirmed = await confirm({
    message: "Are you sure you want to revoke this key?",
    default: false,
  });

  if (!confirmed) {
    console.log("Cancelled.\n");
    return;
  }

  await revokeApiKey(choice, reason || undefined);
  console.log("\n🔴 API key revoked successfully.\n");
}

// ── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log("🔑 Tasero API Key Manager\n");

  const action = await select({
    message: "What would you like to do?",
    choices: [
      { name: "Create a new API key", value: "create" },
      { name: "List API keys", value: "list" },
      { name: "Revoke an API key", value: "revoke" },
    ],
  });

  switch (action) {
    case "create":
      await screenCreate();
      break;
    case "list":
      await screenList();
      break;
    case "revoke":
      await screenRevoke();
      break;
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("\n❌ Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
