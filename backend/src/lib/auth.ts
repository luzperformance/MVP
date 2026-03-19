import { betterAuth } from "better-auth";
import { sqlite } from "better-auth/db";
import path from "node:path";

export const auth = betterAuth({
    database: sqlite({
        path: path.join(process.cwd(), 'database.sqlite')
    }),
    emailAndPassword: {
        enabled: true
    }
});
