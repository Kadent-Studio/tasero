import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.ts";

export default defineRelations(schema, () => ({}));
