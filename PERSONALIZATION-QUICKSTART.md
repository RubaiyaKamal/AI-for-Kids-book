# Chapter Personalization - Quick Start

## What You've Got

✅ **API Endpoint** - `/api/personalize` - Personalizes content using OpenAI
✅ **React Component** - `PersonalizeButton` - One-click personalization UI
✅ **Chapter Wrapper** - `ChapterContent` - Integrates button with content
✅ **Styling** - Beautiful gradient button with animations

---

## Usage Example

### In Your Docusaurus MDX File:

```mdx
---
id: chapter-01
title: Introduction to Physical AI
sidebar_label: Chapter 1
---

import ChapterContent from '@site/src/components/ChapterContent';

export const chapterContent = `
# Introduction to Physical AI

Physical AI represents the convergence of artificial intelligence with physical systems...

## What is Physical AI?

Physical AI systems combine:
- Artificial Intelligence algorithms
- Physical embodiment (robots, drones, etc.)
- Real-time sensor processing
- Actuator control

## Code Example: Simple Robot Controller

\`\`\`python
class RobotController:
    def __init__(self):
        self.position = 0
        self.velocity = 0

    def move(self, target):
        # PID controller logic
        error = target - self.position
        self.velocity = error * 0.5
        self.position += self.velocity
\`\`\`

## Key Concepts

1. **Embodied Intelligence** - AI that interacts physically
2. **Sensor-Motor Loop** - Continuous perception-action cycle
3. **Real-time Processing** - Low-latency decision making

...rest of your chapter content...
`;

<ChapterContent
  chapterId="module-01/chapter-01"
  originalContent={chapterContent}
  title="Introduction to Physical AI"
/>
```

---

## What Happens When User Clicks "Personalize for Me"

### For a Beginner User:
```
Profile:
- programming_experience: "beginner"
- learning_style: "hands-on"
- known_languages: ["python"]

Personalized Output:
- Simpler explanations with analogies
- More detailed code comments
- Step-by-step breakdowns
- Beginner-friendly tips
```

**Example:**
```markdown
## Code Example: Simple Robot Controller

Let's build a simple robot controller step by step. Think of it like
a smart cruise control for your robot!

```python
class RobotController:
    """
    A simple controller that helps a robot move to a target position.
    Think of this like a thermostat - it constantly adjusts to reach
    the desired temperature (or in our case, position).
    """
    def __init__(self):
        self.position = 0  # Where the robot is now
        self.velocity = 0  # How fast it's moving

    def move(self, target):
        # Calculate how far we are from target
        error = target - self.position

        # Adjust speed based on distance (closer = slower)
        self.velocity = error * 0.5

        # Update position
        self.position += self.velocity
```

💡 **Personalized Tip**: Start by testing this with small target values
(like 10) before trying larger movements. This makes debugging easier!
```

### For an Advanced User with Hardware:
```
Profile:
- programming_experience: "advanced"
- has_robot_hardware: true
- hardware_platforms: ["raspberry-pi"]
- learning_style: "hands-on"

Personalized Output:
- Concise, technical explanations
- Hardware-specific implementation tips
- Performance optimizations
- Real-world deployment considerations
```

**Example:**
```markdown
## Code Example: PID Controller for Raspberry Pi

Optimized implementation for real-time motor control on Raspberry Pi:

```python
import pigpio
import time

class PIDController:
    def __init__(self, kp=1.0, ki=0.1, kd=0.05):
        self.kp, self.ki, self.kd = kp, ki, kd
        self.integral = 0
        self.prev_error = 0

    def update(self, error, dt):
        self.integral += error * dt
        derivative = (error - self.prev_error) / dt
        output = self.kp * error + self.ki * self.integral + self.kd * derivative
        self.prev_error = error
        return output
```

💡 **Personalized Tip**: For your Raspberry Pi, use hardware PWM pins
(GPIO 12, 13, 18, 19) for better timing accuracy. With pigpio, you can
achieve ~1kHz control loop frequency. Consider implementing anti-windup
for the integral term to prevent overshooting during startup.

**Hardware Setup:**
- Connect motor driver to GPIO 18 (PWM)
- Use external power supply (motors draw too much current for Pi)
- Add flyback diodes to protect GPIO pins
```

---

## Features

### 🎯 Smart Personalization
- Adjusts complexity (beginner/intermediate/advanced)
- Matches learning style (visual/hands-on/theoretical)
- Includes hardware-specific tips
- Adapts code comments and explanations

### 🔄 Reversible
- Users can switch back to original content anytime
- No permanent changes to source files

### 📊 Tracked
- Records when users personalize chapters
- Can be used for analytics and engagement metrics

### 🎨 Beautiful UI
- Gradient button with smooth animations
- Loading states
- Success banner
- Profile badges showing personalization settings

---

## Installation

1. **Copy files to your project:**
```bash
# API endpoint
auth-app/app/api/personalize/route.ts

# Components
auth-app/components/PersonalizeButton.tsx
auth-app/components/PersonalizeButton.css
auth-app/components/ChapterContent.tsx
```

2. **Install dependencies:**
```bash
npm install react-markdown
```

3. **Ensure environment variables are set:**
```env
OPENAI_API_KEY=sk-your-key
NEON_DATABASE_URL=postgresql://...
```

---

## Cost Optimization

### Current Cost per Personalization:
- Input: ~8000 tokens (chapter content)
- Output: ~4000 tokens (personalized version)
- **Cost with GPT-4 Turbo**: ~$0.15
- **Cost with GPT-3.5-turbo**: ~$0.01

### Optimization Strategies:

1. **Use GPT-3.5-turbo** for lower cost:
```typescript
// In route.ts, change:
model: "gpt-3.5-turbo"  // Instead of gpt-4-turbo-preview
```

2. **Add caching** (save personalized content):
```typescript
// Check if already personalized
const cached = await pool.query(
  "SELECT personalized_content FROM user_personalized_chapters WHERE user_id = $1 AND chapter_id = $2",
  [userId, chapterId]
);

if (cached.rows.length > 0) {
  return cached.rows[0].personalized_content;
}
```

3. **Limit personalizations**:
```typescript
// Add rate limiting
const count = await pool.query(
  "SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND DATE(last_accessed) = CURRENT_DATE",
  [userId]
);

if (count.rows[0].count > 10) {
  return { error: "Daily personalization limit reached" };
}
```

---

## Testing

```bash
# Start your dev server
npm run dev

# Navigate to a chapter
http://localhost:3000/docs/module-01/chapter-01

# Click "Personalize for Me" button
# Content should transform based on your profile
```

---

## Troubleshooting

### Button doesn't appear
- Check if user is logged in
- Verify session is active

### Personalization fails
- Check OpenAI API key is set
- Verify user has completed profile onboarding
- Check API logs for errors

### Content doesn't change
- Verify `onPersonalized` callback is working
- Check browser console for errors
- Ensure API returns `success: true`

---

## Summary

✅ Users can personalize any chapter with one click
✅ Content adapts to their experience level
✅ Includes hardware-specific tips for robot owners
✅ Beautiful, animated UI
✅ Fully reversible
✅ Tracked for analytics

**The personalization makes learning more effective by matching content to each user's unique background!** 🎯
