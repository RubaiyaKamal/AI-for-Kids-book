# Better Auth Implementation Guide
## Signup/Signin with User Background Profiling for Personalized Content

---

## Overview

Implement authentication using [Better Auth](https://www.better-auth.com/) with user background profiling to personalize book content based on software and hardware experience.

### Features
- ✅ Email/Password Authentication
- ✅ OAuth (Google, GitHub)
- ✅ User Background Questionnaire at Signup
- ✅ Profile-based Content Personalization
- ✅ Progress Tracking
- ✅ Neon Postgres Integration
- ✅ Session Management

---

## Architecture

```mermaid
graph TB
    A[User] --> B[Signup/Signin UI]
    B --> C[Better Auth]
    C --> D[Neon Postgres]
    D --> E[User Profile]
    E --> F[Background Data]
    F --> G[Personalization Engine]
    G --> H[Customized Content]
    G --> I[Adaptive Chatbot]

    style C fill:#2563eb,stroke:#1e40af,color:#fff
    style D fill:#10b981,stroke:#059669,color:#fff
    style G fill:#f59e0b,stroke:#d97706,color:#fff
```

---

## Tech Stack

- **Auth Framework:** Better Auth
- **Database:** Neon Serverless Postgres
- **Frontend:** React + TypeScript
- **Backend:** Next.js API Routes (or FastAPI)
- **Styling:** Tailwind CSS

---

## Database Schema

### Extended User Tables

```sql
-- Better Auth default users table (auto-created)
-- We'll extend it with additional tables

-- User background profile
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Software Background
    programming_experience VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', 'expert'
    known_languages TEXT[], -- ['python', 'cpp', 'javascript', etc.]
    ml_experience VARCHAR(50), -- 'none', 'basic', 'intermediate', 'advanced'
    ros_experience VARCHAR(50), -- 'none', 'basic', 'intermediate', 'advanced'

    -- Hardware Background
    robotics_experience VARCHAR(50), -- 'none', 'hobbyist', 'professional', 'expert'
    electronics_knowledge VARCHAR(50), -- 'none', 'basic', 'intermediate', 'advanced'
    has_robot_hardware BOOLEAN DEFAULT FALSE,
    hardware_platforms TEXT[], -- ['raspberry-pi', 'arduino', 'jetson-nano', etc.]

    -- Learning Preferences
    learning_style VARCHAR(50), -- 'visual', 'hands-on', 'theoretical', 'mixed'
    preferred_pace VARCHAR(50), -- 'slow', 'moderate', 'fast'
    goals TEXT[], -- ['career-change', 'hobby', 'research', 'startup', etc.]

    -- Metadata
    completed_onboarding BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress tracking
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id VARCHAR(255) NOT NULL,

    -- Progress metrics
    completed BOOLEAN DEFAULT FALSE,
    time_spent_seconds INTEGER DEFAULT 0,
    last_position INTEGER DEFAULT 0,

    -- Engagement
    code_examples_tried INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    chatbot_interactions INTEGER DEFAULT 0,

    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, chapter_id)
);

-- User bookmarks
CREATE TABLE user_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id VARCHAR(255) NOT NULL,
    section_id VARCHAR(255),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, chapter_id, section_id)
);

-- User notes
CREATE TABLE user_notes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    selected_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_chapter_id ON user_progress(chapter_id);
CREATE INDEX idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX idx_user_notes_user_id ON user_notes(user_id);
```

---

## Backend Setup

### 1. Install Dependencies

```bash
npm install better-auth @better-auth/react
npm install @neondatabase/serverless
npm install zod
```

### 2. Better Auth Configuration

**File: `lib/auth.ts`**

```typescript
import { betterAuth } from "better-auth";
import { neonAdapter } from "better-auth/adapters/neon";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

export const auth = betterAuth({
  database: neonAdapter(pool),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
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
    additionalFields: {
      // We'll store additional data in user_profiles table
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

### 3. API Routes

**File: `app/api/auth/[...all]/route.ts`** (Next.js)

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

**File: `app/api/profile/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

// Create user profile
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
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
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
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
```

---

## Frontend Components

### 1. Auth Provider

**File: `components/providers/AuthProvider.tsx`**

```typescript
"use client";

import { createAuthClient } from "better-auth/react";
import { ReactNode } from "react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

### 2. Signup Component with Background Questionnaire

**File: `components/auth/SignupForm.tsx`**

```typescript
"use client";

import { useState } from "react";
import { authClient } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

interface SignupFormData {
  email: string;
  password: string;
  name: string;
}

interface BackgroundData {
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

export default function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Basic signup
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    password: "",
    name: "",
  });

  // Step 2: Background questionnaire
  const [background, setBackground] = useState<BackgroundData>({
    programming_experience: "",
    known_languages: [],
    ml_experience: "",
    ros_experience: "",
    robotics_experience: "",
    electronics_knowledge: "",
    has_robot_hardware: false,
    hardware_platforms: [],
    learning_style: "",
    preferred_pace: "",
    goals: [],
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Move to background questionnaire
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(background),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      // Redirect to personalized dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save background");
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  if (step === 1) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 8 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Creating Account..." : "Continue"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => authClient.signIn.social({ provider: "google" })}
              className="flex items-center justify-center px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                {/* Google icon */}
              </svg>
              Google
            </button>

            <button
              onClick={() => authClient.signIn.social({ provider: "github" })}
              className="flex items-center justify-center px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                {/* GitHub icon */}
              </svg>
              GitHub
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Background Questionnaire
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2">Tell Us About Yourself</h2>
      <p className="text-gray-600 mb-6">
        This helps us personalize your learning experience
      </p>

      <form onSubmit={handleBackgroundSubmit} className="space-y-6">
        {/* Software Background */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Software Background</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Programming Experience
              </label>
              <select
                value={background.programming_experience}
                onChange={(e) =>
                  setBackground({
                    ...background,
                    programming_experience: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select level</option>
                <option value="beginner">Beginner (0-1 years)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="advanced">Advanced (3-5 years)</option>
                <option value="expert">Expert (5+ years)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Programming Languages You Know
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Python", "C++", "JavaScript", "Java", "C", "Rust"].map(
                  (lang) => (
                    <label key={lang} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={background.known_languages.includes(
                          lang.toLowerCase()
                        )}
                        onChange={() =>
                          setBackground({
                            ...background,
                            known_languages: toggleArrayItem(
                              background.known_languages,
                              lang.toLowerCase()
                            ),
                          })
                        }
                        className="mr-2"
                      />
                      {lang}
                    </label>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Machine Learning Experience
              </label>
              <select
                value={background.ml_experience}
                onChange={(e) =>
                  setBackground({ ...background, ml_experience: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select level</option>
                <option value="none">No experience</option>
                <option value="basic">Basic (completed courses)</option>
                <option value="intermediate">
                  Intermediate (built projects)
                </option>
                <option value="advanced">Advanced (professional work)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                ROS (Robot Operating System) Experience
              </label>
              <select
                value={background.ros_experience}
                onChange={(e) =>
                  setBackground({ ...background, ros_experience: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select level</option>
                <option value="none">No experience</option>
                <option value="basic">Basic (tutorials)</option>
                <option value="intermediate">Intermediate (projects)</option>
                <option value="advanced">Advanced (professional)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hardware Background */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Hardware Background</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Robotics Experience
              </label>
              <select
                value={background.robotics_experience}
                onChange={(e) =>
                  setBackground({
                    ...background,
                    robotics_experience: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select level</option>
                <option value="none">No experience</option>
                <option value="hobbyist">Hobbyist</option>
                <option value="professional">Professional</option>
                <option value="expert">Expert/Researcher</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Electronics Knowledge
              </label>
              <select
                value={background.electronics_knowledge}
                onChange={(e) =>
                  setBackground({
                    ...background,
                    electronics_knowledge: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select level</option>
                <option value="none">No knowledge</option>
                <option value="basic">Basic (can read schematics)</option>
                <option value="intermediate">
                  Intermediate (can design circuits)
                </option>
                <option value="advanced">Advanced (PCB design)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={background.has_robot_hardware}
                  onChange={(e) =>
                    setBackground({
                      ...background,
                      has_robot_hardware: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                <span className="text-sm font-medium">
                  I have access to robot hardware
                </span>
              </label>
            </div>

            {background.has_robot_hardware && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Hardware Platforms You Have
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Raspberry Pi",
                    "Arduino",
                    "Jetson Nano",
                    "Custom Robot",
                    "Drone",
                    "Robotic Arm",
                  ].map((platform) => (
                    <label key={platform} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={background.hardware_platforms.includes(
                          platform.toLowerCase().replace(" ", "-")
                        )}
                        onChange={() =>
                          setBackground({
                            ...background,
                            hardware_platforms: toggleArrayItem(
                              background.hardware_platforms,
                              platform.toLowerCase().replace(" ", "-")
                            ),
                          })
                        }
                        className="mr-2"
                      />
                      {platform}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="pb-6">
          <h3 className="text-lg font-semibold mb-4">Learning Preferences</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Learning Style
              </label>
              <select
                value={background.learning_style}
                onChange={(e) =>
                  setBackground({ ...background, learning_style: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select style</option>
                <option value="visual">Visual (diagrams, videos)</option>
                <option value="hands-on">Hands-on (code, experiments)</option>
                <option value="theoretical">Theoretical (concepts, math)</option>
                <option value="mixed">Mixed approach</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Preferred Learning Pace
              </label>
              <select
                value={background.preferred_pace}
                onChange={(e) =>
                  setBackground({ ...background, preferred_pace: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select pace</option>
                <option value="slow">Slow & thorough</option>
                <option value="moderate">Moderate</option>
                <option value="fast">Fast-paced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Your Goals (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Career Change",
                  "Hobby Project",
                  "Academic Research",
                  "Startup Idea",
                  "Professional Development",
                  "Teaching Others",
                ].map((goal) => (
                  <label key={goal} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={background.goals.includes(
                        goal.toLowerCase().replace(" ", "-")
                      )}
                      onChange={() =>
                        setBackground({
                          ...background,
                          goals: toggleArrayItem(
                            background.goals,
                            goal.toLowerCase().replace(" ", "-")
                          ),
                        })
                      }
                      className="mr-2"
                    />
                    {goal}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Saving..." : "Complete Setup"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### 3. Signin Component

**File: `components/auth/SigninForm.tsx`**

```typescript
"use client";

import { useState } from "react";
import { authClient } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SigninForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Signin failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Welcome Back</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSignin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
          Forgot password?
        </Link>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => authClient.signIn.social({ provider: "google" })}
            className="flex items-center justify-center px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Google
          </button>

          <button
            onClick={() => authClient.signIn.social({ provider: "github" })}
            className="flex items-center justify-center px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            GitHub
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-sm">
        Don't have an account?{" "}
        <Link href="/signup" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
```

---

## Personalization Engine

### Content Personalization Service

**File: `lib/personalization.ts`**

```typescript
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
   * Get personalized content recommendations
   */
  static getRecommendedChapters(profile: UserProfile): string[] {
    const recommendations: string[] = [];

    // Beginners start from basics
    if (profile.programming_experience === "beginner") {
      recommendations.push("module-01/chapter-01"); // Introduction
      recommendations.push("module-02/chapter-01"); // Programming Basics
    }

    // Advanced users can skip to specific topics
    if (profile.programming_experience === "advanced" || profile.programming_experience === "expert") {
      if (profile.ml_experience === "none" || profile.ml_experience === "basic") {
        recommendations.push("module-05/chapter-01"); // ML for Robotics
      }
      if (profile.ros_experience === "none") {
        recommendations.push("module-02/chapter-04"); // ROS Introduction
      }
    }

    // Hardware owners get hardware-focused content
    if (profile.has_robot_hardware) {
      recommendations.push("module-04/chapter-01"); // Actuators
      recommendations.push("module-06/chapter-01"); // Humanoid Robotics
    }

    return recommendations;
  }

  /**
   * Adjust content difficulty based on profile
   */
  static getContentDifficulty(profile: UserProfile): "beginner" | "intermediate" | "advanced" {
    const scores = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };

    // Programming experience weight
    if (profile.programming_experience === "beginner") scores.beginner += 3;
    if (profile.programming_experience === "intermediate") scores.intermediate += 3;
    if (profile.programming_experience === "advanced" || profile.programming_experience === "expert") scores.advanced += 3;

    // ML experience weight
    if (profile.ml_experience === "none") scores.beginner += 2;
    if (profile.ml_experience === "basic") scores.intermediate += 2;
    if (profile.ml_experience === "intermediate" || profile.ml_experience === "advanced") scores.advanced += 2;

    // Find highest score
    const maxScore = Math.max(scores.beginner, scores.intermediate, scores.advanced);
    if (scores.advanced === maxScore) return "advanced";
    if (scores.intermediate === maxScore) return "intermediate";
    return "beginner";
  }

  /**
   * Get personalized chatbot system prompt
   */
  static getChatbotSystemPrompt(profile: UserProfile): string {
    const difficulty = this.getContentDifficulty(profile);
    const knownLanguages = profile.known_languages.join(", ");

    let prompt = `You are an AI assistant for the 'Physical AI & Humanoid Robotics' textbook. `;

    // Adjust based on experience
    if (difficulty === "beginner") {
      prompt += `The user is a beginner. Provide detailed explanations with simple examples. `;
      prompt += `Avoid assuming prior knowledge. `;
    } else if (difficulty === "intermediate") {
      prompt += `The user has intermediate experience. Provide balanced explanations with practical examples. `;
    } else {
      prompt += `The user is advanced. Provide concise, technical explanations. You can use advanced concepts. `;
    }

    // Language preferences
    if (knownLanguages) {
      prompt += `The user knows: ${knownLanguages}. Prefer code examples in these languages. `;
    }

    // Learning style
    if (profile.learning_style === "visual") {
      prompt += `The user prefers visual learning. Suggest diagrams and visualizations when relevant. `;
    } else if (profile.learning_style === "hands-on") {
      prompt += `The user prefers hands-on learning. Provide practical code examples and exercises. `;
    } else if (profile.learning_style === "theoretical") {
      prompt += `The user prefers theoretical understanding. Include mathematical formulations and concepts. `;
    }

    // Hardware context
    if (profile.has_robot_hardware) {
      prompt += `The user has robot hardware (${profile.hardware_platforms.join(", ")}). `;
      prompt += `Provide practical implementation suggestions for their hardware. `;
    }

    return prompt;
  }

  /**
   * Get personalized learning path
   */
  static getLearningPath(profile: UserProfile): {
    module: string;
    chapters: string[];
    reason: string;
  }[] {
    const path = [];

    // Everyone starts with Module 1
    path.push({
      module: "Module 1: Introduction to Physical AI",
      chapters: ["chapter-01", "chapter-02", "chapter-03"],
      reason: "Foundation concepts",
    });

    // Adjust based on programming experience
    if (profile.programming_experience === "beginner") {
      path.push({
        module: "Module 2: Programming Fundamentals",
        chapters: ["chapter-01", "chapter-02", "chapter-03", "chapter-04"],
        reason: "Build programming skills",
      });
    }

    // ML path
    if (profile.ml_experience === "none" || profile.ml_experience === "basic") {
      path.push({
        module: "Module 5: AI and Machine Learning",
        chapters: ["chapter-01", "chapter-02"],
        reason: "Learn ML fundamentals",
      });
    }

    // Hardware path
    if (profile.has_robot_hardware) {
      path.push({
        module: "Module 3: Sensors and Perception",
        chapters: ["chapter-01", "chapter-02", "chapter-03"],
        reason: "Work with your hardware",
      });
      path.push({
        module: "Module 4: Actuators and Control",
        chapters: ["chapter-01", "chapter-02"],
        reason: "Control your robot",
      });
    }

    return path;
  }
}
```

---

## Integration with Chatbot

Update the chatbot to use personalized prompts:

**File: `backend/chatkit_agent.py`** (Update)

```python
async def get_personalized_system_prompt(user_id: str) -> str:
    """Get personalized system prompt based on user profile."""
    # Fetch user profile from database
    result = await pool.query(
        "SELECT * FROM user_profiles WHERE user_id = $1",
        [user_id]
    )

    if not result.rows:
        return DEFAULT_SYSTEM_PROMPT

    profile = result.rows[0]

    # Build personalized prompt
    prompt = "You are an AI assistant for the 'Physical AI & Humanoid Robotics' textbook. "

    # Adjust based on experience level
    if profile['programming_experience'] == 'beginner':
        prompt += "The user is a beginner. Provide detailed, simple explanations. "
    elif profile['programming_experience'] in ['advanced', 'expert']:
        prompt += "The user is advanced. Provide concise, technical explanations. "

    # Add language preferences
    if profile['known_languages']:
        langs = ', '.join(profile['known_languages'])
        prompt += f"Prefer code examples in: {langs}. "

    # Add learning style
    if profile['learning_style'] == 'visual':
        prompt += "Suggest diagrams when relevant. "
    elif profile['learning_style'] == 'hands-on':
        prompt += "Provide practical code examples. "

    return prompt
```

---

## Environment Variables

**`.env`:**
```env
# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Database
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Deployment Checklist

- [ ] Set up Neon Postgres database
- [ ] Run database migrations (create tables)
- [ ] Configure Better Auth with production URL
- [ ] Set up OAuth providers (Google, GitHub)
- [ ] Enable email verification
- [ ] Configure CORS for production
- [ ] Test signup flow
- [ ] Test signin flow
- [ ] Test profile creation
- [ ] Test personalization engine
- [ ] Deploy to production

---

## Summary

✅ **Better Auth Integration** - Email/password + OAuth
✅ **User Background Profiling** - Comprehensive questionnaire
✅ **Neon Postgres** - User profiles and progress tracking
✅ **Personalization Engine** - Content recommendations based on background
✅ **Adaptive Chatbot** - Personalized system prompts
✅ **Learning Paths** - Customized chapter recommendations

**Users now get a personalized learning experience based on their software and hardware background!** 🎯
