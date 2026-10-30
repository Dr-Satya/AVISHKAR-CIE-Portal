/**
 * AVISHKAR-v2 Core Library Index
 * Provides unified access to all platform library domains:
 * - auth: Authentication and RBAC
 * - database: Persistence and Supabase helpers
 * - email: Resend transactional email notification service
 * - validation: Magic-byte inspection and schema validation
 * - storage: Photo and document storage handlers
 */

export * as auth from "./auth";
export * as database from "./database";
export * as email from "./email";
export * as validation from "./validation";
export * as storage from "./storage";
export * from "./utils";
