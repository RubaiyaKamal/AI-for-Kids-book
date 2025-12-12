import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
});

// Create user profile
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Fix: Correct way to get session in Better Auth
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const {
            programming_experience,
            known_languages,
            ml_experience,
            ros_experience,
            robotics_experience,
            electronics_knowledge,
            has_robot_hardware,
            hardware_platforms,
            learning_style,
            preferred_pace,
            goals,
        } = body;

        const result = await pool.query(
            `INSERT INTO user_profiles (
                user_id, programming_experience, known_languages, ml_experience,
                ros_experience, robotics_experience, electronics_knowledge,
                has_robot_hardware, hardware_platforms, learning_style,
                preferred_pace, goals, completed_onboarding
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
            ON CONFLICT (user_id)
            DO UPDATE SET
                programming_experience = $2,
                known_languages = $3,
                ml_experience = $4,
                ros_experience = $5,
                robotics_experience = $6,
                electronics_knowledge = $7,
                has_robot_hardware = $8,
                hardware_platforms = $9,
                learning_style = $10,
                preferred_pace = $11,
                goals = $12,
                completed_onboarding = true,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *`,
            [
                session.user.id,
                programming_experience,
                known_languages,
                ml_experience,
                ros_experience,
                robotics_experience,
                electronics_knowledge,
                has_robot_hardware,
                hardware_platforms,
                learning_style,
                preferred_pace,
                goals,
            ]
        );

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("Profile creation error:", error);
        return NextResponse.json(
            { error: "Failed to create profile" },
            { status: 500 }
        );
    }
}

// Get user profile
export async function GET(req: NextRequest) {
    try {
        // Fix: Correct way to get session
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await pool.query(
            "SELECT * FROM user_profiles WHERE user_id = $1",
            [session.user.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ profile: null });
        }

        return NextResponse.json({ profile: result.rows[0] });
    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}