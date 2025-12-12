interface UserProfile {
    programming_experience: string;
    known_languages: string[];
    ml_experience: string;
    ros_experience: string;
    robotics_experience: string;
    electronics_knowledge: string;
    has_robot_hardware: boolean;
    hardware_platforms: string[];
    learning_style: string;
    preferred_pace: string;
    goals: string[];
}

export class PersonalizationEngine {
    /**
     * Get recommended chapters based on user profile
     */
    static getRecommendedChapters(profile: UserProfile): {
        chapterId: string;
        reason: string;
        priority: number;
    }[] {
        const recommendations: { chapterId: string; reason: string; priority: number }[] = [];

        // Beginners start from basics
        if (profile.programming_experience === "beginner") {
            recommendations.push({
                chapterId: "module-01/chapter-01",
                reason: "Start with fundamentals",
                priority: 10,
            });
            recommendations.push({
                chapterId: "module-02/chapter-01",
                reason: "Learn programming basics",
                priority: 9,
            });
        }

        // Advanced users skip to specialized topics
        if (
            profile.programming_experience === "advanced" ||
            profile.programming_experience === "expert"
        ) {
            if (profile.ml_experience === "none" || profile.ml_experience === "basic") {
                recommendations.push({
                    chapterId: "module-05/chapter-01",
                    reason: "Build ML skills for robotics",
                    priority: 10,
                });
            }
            if (profile.ros_experience === "none") {
                recommendations.push({
                    chapterId: "module-02/chapter-04",
                    reason: "Learn ROS framework",
                    priority: 9,
                });
            }
        }

        // Hardware owners get practical chapters
        if (profile.has_robot_hardware) {
            recommendations.push({
                chapterId: "module-03/chapter-01",
                reason: "Work with your sensors",
                priority: 8,
            });
            recommendations.push({
                chapterId: "module-04/chapter-01",
                reason: "Control your actuators",
                priority: 8,
            });
            recommendations.push({
                chapterId: "module-06/chapter-01",
                reason: "Build humanoid robots",
                priority: 7,
            });
        }

        // Sort by priority
        return recommendations.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Determine content difficulty level
     */
    static getContentDifficulty(
        profile: UserProfile
    ): "beginner" | "intermediate" | "advanced" {
        const scores = {
            beginner: 0,
            intermediate: 0,
            advanced: 0,
        };

        // Programming experience (weight: 3)
        if (profile.programming_experience === "beginner") scores.beginner += 3;
        if (profile.programming_experience === "intermediate") scores.intermediate += 3;
        if (
            profile.programming_experience === "advanced" ||
            profile.programming_experience === "expert"
        )
            scores.advanced += 3;

        // ML experience (weight: 2)
        if (profile.ml_experience === "none") scores.beginner += 2;
        if (profile.ml_experience === "basic") scores.intermediate += 2;
        if (
            profile.ml_experience === "intermediate" ||
            profile.ml_experience === "advanced"
        )
            scores.advanced += 2;

        // ROS experience (weight: 2)
        if (profile.ros_experience === "none") scores.beginner += 2;
        if (profile.ros_experience === "basic") scores.intermediate += 2;
        if (
            profile.ros_experience === "intermediate" ||
            profile.ros_experience === "advanced"
        )
            scores.advanced += 2;

        // Robotics experience (weight: 1)
        if (profile.robotics_experience === "none") scores.beginner += 1;
        if (profile.robotics_experience === "hobbyist") scores.intermediate += 1;
        if (
            profile.robotics_experience === "professional" ||
            profile.robotics_experience === "expert"
        )
            scores.advanced += 1;

        // Find highest score
        const maxScore = Math.max(scores.beginner, scores.intermediate, scores.advanced);
        if (scores.advanced === maxScore) return "advanced";
        if (scores.intermediate === maxScore) return "intermediate";
        return "beginner";
    }

    /**
     * Generate personalized chatbot system prompt
     */
    static getChatbotSystemPrompt(profile: UserProfile): string {
        const difficulty = this.getContentDifficulty(profile);
        const knownLanguages = profile.known_languages.join(", ");

        let prompt = `You are an AI assistant for the 'Physical AI & Humanoid Robotics' textbook. `;

        // Adjust based on experience level
        if (difficulty === "beginner") {
            prompt += `The user is a beginner. Provide detailed explanations with simple examples. `;
            prompt += `Avoid assuming prior knowledge. Break down complex concepts step by step. `;
            prompt += `Use analogies and real-world examples to explain abstract ideas. `;
        } else if (difficulty === "intermediate") {
            prompt += `The user has intermediate experience. Provide balanced explanations with practical examples. `;
            prompt += `You can assume basic programming and robotics knowledge. `;
            prompt += `Focus on practical applications and implementation details. `;
        } else {
            prompt += `The user is advanced. Provide concise, technical explanations. `;
            prompt += `You can use advanced concepts, mathematical formulations, and technical jargon. `;
            prompt += `Focus on optimization, edge cases, and advanced techniques. `;
        }

        // Language preferences
        if (knownLanguages) {
            prompt += `The user knows: ${knownLanguages}. Prefer code examples in these languages when possible. `;
            if (profile.known_languages.includes("python")) {
                prompt += `Python is preferred for ML and high-level robotics code. `;
            }
            if (profile.known_languages.includes("c++")) {
                prompt += `C++ is preferred for performance-critical code. `;
            }
        }

        // Learning style adaptation
        if (profile.learning_style === "visual") {
            prompt += `The user prefers visual learning. Suggest diagrams, flowcharts, and visualizations when relevant. `;
            prompt += `Describe visual representations of concepts. `;
        } else if (profile.learning_style === "hands-on") {
            prompt += `The user prefers hands-on learning. Provide practical code examples and exercises. `;
            prompt += `Suggest experiments and projects they can try. `;
        } else if (profile.learning_style === "theoretical") {
            prompt += `The user prefers theoretical understanding. Include mathematical formulations and formal definitions. `;
            prompt += `Explain the underlying principles and theory. `;
        } else {
            prompt += `The user prefers a mixed approach. Balance theory, visuals, and practical examples. `;
        }

        // Pace adaptation
        if (profile.preferred_pace === "slow") {
            prompt += `The user prefers a slow, thorough pace. Provide comprehensive explanations with multiple examples. `;
        } else if (profile.preferred_pace === "fast") {
            prompt += `The user prefers a fast pace. Be concise and get to the point quickly. `;
        }

        // Hardware context
        if (profile.has_robot_hardware) {
            const platforms = profile.hardware_platforms.join(", ");
            prompt += `The user has robot hardware: ${platforms}. `;
            prompt += `Provide practical implementation suggestions for their specific hardware. `;
            prompt += `Include tips for debugging and troubleshooting on their platform. `;
        } else {
            prompt += `The user doesn't have robot hardware. Focus on simulation and theoretical understanding. `;
            prompt += `Suggest simulation tools and virtual environments when relevant. `;
        }

        // Goals context
        if (profile.goals.includes("career-change")) {
            prompt += `The user is pursuing a career change. Emphasize industry-relevant skills and best practices. `;
        }
        if (profile.goals.includes("startup-idea")) {
            prompt += `The user is working on a startup. Focus on practical, production-ready solutions. `;
        }
        if (profile.goals.includes("academic-research")) {
            prompt += `The user is in academic research. Include references to papers and cutting-edge techniques. `;
        }

        prompt += `\n\nWhen answering:\n`;
        prompt += `- Use double line breaks for readability\n`;
        prompt += `- Format code with proper syntax highlighting\n`;
        prompt += `- Use bullet points for lists\n`;
        prompt += `- Be helpful, clear, and encouraging\n`;

        return prompt;
    }

    /**
     * Get personalized learning path
     */
    static getLearningPath(profile: UserProfile): {
        module: string;
        chapters: string[];
        reason: string;
        estimatedHours: number;
    }[] {
        const path = [];
        const difficulty = this.getContentDifficulty(profile);

        // Module 1: Always included
        path.push({
            module: "Module 1: Introduction to Physical AI",
            chapters: ["chapter-01", "chapter-02", "chapter-03"],
            reason: "Foundation concepts for everyone",
            estimatedHours: difficulty === "beginner" ? 6 : difficulty === "intermediate" ? 4 : 2,
        });

        // Module 2: Adjust based on programming experience
        if (profile.programming_experience === "beginner") {
            path.push({
                module: "Module 2: Programming Fundamentals",
                chapters: ["chapter-01", "chapter-02", "chapter-03", "chapter-04"],
                reason: "Build essential programming skills",
                estimatedHours: 12,
            });
        } else if (profile.ros_experience === "none") {
            path.push({
                module: "Module 2: ROS Fundamentals",
                chapters: ["chapter-04"],
                reason: "Learn Robot Operating System",
                estimatedHours: 4,
            });
        }

        // Module 3: Sensors (especially for hardware owners)
        if (profile.has_robot_hardware || profile.robotics_experience !== "none") {
            path.push({
                module: "Module 3: Sensors and Perception",
                chapters: ["chapter-01", "chapter-02", "chapter-03"],
                reason: profile.has_robot_hardware
                    ? "Work with your robot's sensors"
                    : "Understand sensor systems",
                estimatedHours: 8,
            });
        }

        // Module 4: Actuators (for hardware owners)
        if (profile.has_robot_hardware) {
            path.push({
                module: "Module 4: Actuators and Control",
                chapters: ["chapter-01", "chapter-02", "chapter-03"],
                reason: "Control your robot's movements",
                estimatedHours: 8,
            });
        }

        // Module 5: ML (if needed)
        if (profile.ml_experience === "none" || profile.ml_experience === "basic") {
            path.push({
                module: "Module 5: AI and Machine Learning",
                chapters: ["chapter-01", "chapter-02", "chapter-03"],
                reason: "Learn ML fundamentals for robotics",
                estimatedHours: 10,
            });
        } else {
            path.push({
                module: "Module 5: Advanced ML for Robotics",
                chapters: ["chapter-03", "chapter-04"],
                reason: "Apply ML to robotics problems",
                estimatedHours: 6,
            });
        }

        // Module 6: Humanoid Robotics
        if (
            profile.robotics_experience !== "none" ||
            profile.goals.includes("startup-idea") ||
            profile.goals.includes("academic-research")
        ) {
            path.push({
                module: "Module 6: Humanoid Robotics",
                chapters: ["chapter-01", "chapter-02", "chapter-03"],
                reason: "Advanced humanoid robot systems",
                estimatedHours: 10,
            });
        }

        return path;
    }

    /**
     * Get next recommended chapter based on progress
     */
    static getNextChapter(
        profile: UserProfile,
        completedChapters: string[]
    ): { chapterId: string; reason: string } | null {
        const learningPath = this.getLearningPath(profile);

        for (const module of learningPath) {
            for (const chapter of module.chapters) {
                const chapterId = `${module.module.toLowerCase().replace(/\s+/g, "-").split(":")[0]}/${chapter}`;
                if (!completedChapters.includes(chapterId)) {
                    return {
                        chapterId,
                        reason: `Continue with ${module.module}`,
                    };
                }
            }
        }

        return null; // All chapters completed
    }

    /**
     * Generate personalization prompt for OpenAI
     */
    static getPersonalizationPrompt(profile: any, originalContent: string): string {
        const difficulty = this.getContentDifficulty(profile);
        const interests = profile.interests || [];
        const hardwareExp = profile.hardware_experience || "none";
        const experienceLevel = profile.software_experience || "intermediate";

        return `You are personalizing educational content for a student with the following profile:
- Software Experience: ${experienceLevel}
- Hardware Experience: ${hardwareExp}
- Interests: ${interests.join(", ") || "General robotics"}
- Target Difficulty: ${difficulty}

IMPORTANT INSTRUCTIONS:
1. KEEP ALL ORIGINAL TEXT EXACTLY AS IS - Do not modify, rewrite, or remove any existing content
2. ADD ONLY 2-3 RELEVANT EXAMPLES based on their ${experienceLevel} experience level
3. Insert examples naturally after relevant sections in the content
4. Mark each example clearly as: "💡 **Example for ${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}:** [your example here]"
5. Examples should be:
   - Practical and relevant to their experience level
   - Related to their interests: ${interests.join(", ") || "robotics"}
   ${hardwareExp !== "none" ? `- Include hardware-specific examples for ${hardwareExp}` : "- Focus on simulation and theory"}
6. Keep the same markdown structure and headings
7. Do not add any other personalization markers or modifications

Original Content:
${originalContent}

Return the content with ONLY the original text plus 2-3 added examples in markdown format.`;
    }
}
