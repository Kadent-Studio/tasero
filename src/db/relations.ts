import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export default defineRelations(schema, () => ({}));
