import { NextRequest, NextResponse } from "next/server";
import { PersonalizationEngine } from "@/lib/personalization";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { profileStore } from "@/lib/profile-store";

export async function POST(req: NextRequest) {
    try {
        // Get session from Better Auth
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch user profile from profile store
        let simpleProfile = await profileStore.get(session.user.id);

        // If profile doesn't exist, create a default one
        if (!simpleProfile) {
            console.log("Profile not found for user:", session.user.id, "- creating default profile");
            const defaultProfile = {
                software_experience: "intermediate",
                hardware_experience: "arduino",
                interests: []
            };
            simpleProfile = await profileStore.set(session.user.id, defaultProfile);
        }

        const { chapterId, originalContent } = await req.json();

        if (!chapterId || !originalContent) {
            return NextResponse.json(
                { error: "Missing chapterId or originalContent" },
                { status: 400 }
            );
        }

        // Convert simple profile to full profile for PersonalizationEngine
        // Map the simple profile fields to the expected complex profile structure
        const fullProfile = {
            programming_experience: simpleProfile.software_experience || "intermediate",
            known_languages: ["python"], // Default
            ml_experience: "basic", // Default
            ros_experience: "none", // Default
            robotics_experience: simpleProfile.hardware_experience === "none" ? "none" : "hobbyist",
            electronics_knowledge: simpleProfile.hardware_experience || "basic",
            has_robot_hardware: simpleProfile.hardware_experience !== "none",
            hardware_platforms: simpleProfile.hardware_experience !== "none" ? [simpleProfile.hardware_experience] : [],
            learning_style: "mixed", // Default
            preferred_pace: "normal", // Default
            goals: simpleProfile.interests || []
        };

        // Generate personalized content using OpenAI
        const personalizedContent = await generatePersonalizedContent(
            originalContent,
            simpleProfile // Use simple profile for the prompt
        );

        return NextResponse.json({
            success: true,
            personalizedContent,
            experienceLevel: simpleProfile.software_experience, // Return experience level for UI badge
            profile: {
                difficulty: PersonalizationEngine.getContentDifficulty(fullProfile),
                interests: simpleProfile.interests || [],
                hardwareExperience: simpleProfile.hardware_experience,
            },
        });
    } catch (error) {
        console.error("Personalization error:", error);
        return NextResponse.json(
            { error: "Failed to personalize content" },
            { status: 500 }
        );
    }
}

async function generatePersonalizedContent(
    originalContent: string,
    profile: any
): Promise<string> {
    const prompt = PersonalizationEngine.getPersonalizationPrompt(profile, originalContent);

    // Call OpenAI to personalize content
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 4000,
        }),
    });

    if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`OpenAI API error: ${response.statusText}. Details: ${errorDetails}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
