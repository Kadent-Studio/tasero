import { buildRelations } from "drizzle-orm";
import * as schema from "./schema.ts";

export default buildRelations(schema, (r) => ({}));
