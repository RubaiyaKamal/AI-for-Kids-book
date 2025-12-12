import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
});

// Debug logging to verify environment variables
console.log("--- Auth Configuration Check ---");
console.log("BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Set" : "Missing");
console.log("GITHUB_CLIENT_ID:", process.env.GITHUB_CLIENT_ID ? "Set" : "Missing");

export const auth = betterAuth({
    database: pool,
    baseURL: process.env.BETTER_AUTH_URL, // Explicitly set base URL
    trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001", // In case you run on different port
        "http://localhost:3002", // Current running port
        "https://book-for-project-hackathon.onrender.com", // Production URL
        process.env.BETTER_AUTH_URL || "",
        process.env.NEXT_PUBLIC_APP_URL || "",
    ].filter(Boolean), // Remove empty strings
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    user: {
        // We'll store additional data in user_profiles table
    },
});

export type Session = typeof auth.$Infer.Session;
