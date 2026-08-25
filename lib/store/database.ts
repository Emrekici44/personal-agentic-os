import type { DatabaseSync } from "node:sqlite";
import { getStoreDatabase } from "../shared-store.ts";

/** Server-only database boundary. Runtime services use repositories, never this directly. */
export const operationalDatabase = (): DatabaseSync => getStoreDatabase();
