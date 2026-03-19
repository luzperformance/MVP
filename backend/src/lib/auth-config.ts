import { betterAuth } from "better-auth";
import { pool } from "../db/database";

export const auth = betterAuth({
    database: {
        provider: "pg",
        pool: pool,
        user: {
            additionalFields: {
                crm: {
                    type: "string",
                    required: false
                }
            }
        }
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: true
    },
    secret: process.env.BETTER_AUTH_SECRET || "a-very-secure-secret-key-at-least-32-chars"
});
