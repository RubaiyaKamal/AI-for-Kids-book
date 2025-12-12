import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { marked } from 'marked';

// Configure marked with custom renderer for proper styling
const renderer = new marked.Renderer();

// Custom heading renderer to add IDs and classes
renderer.heading = ({ text, depth }) => {
    const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const classes = {
        1: 'text-4xl font-bold text-dark-brown dark:text-cream mb-6 mt-8',
        2: 'text-3xl font-semibold text-dark-brown dark:text-cream mb-4 mt-6 border-b-2 border-goldenrod/30 pb-2',
        3: 'text-2xl font-semibold text-dark-brown dark:text-cream mb-3 mt-4',
        4: 'text-xl font-semibold text-goldenrod dark:text-goldenrod mb-2 mt-3',
        5: 'text-lg font-semibold text-dark-brown dark:text-cream mb-2 mt-2',
        6: 'text-base font-semibold text-dark-brown dark:text-cream mb-2 mt-2'
    };

    return `<h${depth} id="${id}" class="${classes[depth as keyof typeof classes]}">${text}</h${depth}>`;
};

// Custom strong renderer for goldenrod color
renderer.strong = ({ text }) => {
    return `<strong class="text-goldenrod font-semibold">${text}</strong>`;
};

// Custom code renderer for inline code
renderer.codespan = ({ text }) => {
    return `<code class="bg-cream dark:bg-dark-brown/50 px-2 py-1 rounded text-sm font-mono text-mint">${text}</code>`;
};

// Custom link renderer
renderer.link = ({ href, text }) => {
    return `<a href="${href}" class="text-goldenrod hover:text-goldenrod/80 underline">${text}</a>`;
};

marked.setOptions({
    gfm: true,
    breaks: true,
    renderer: renderer
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    // Map IDs to file paths
    const filePathMap: Record<string, string> = {
        'intro': 'intro.md',
        'intro-physical-ai': 'module-1/week-1-2/intro-physical-ai.md',
        'embodied-intelligence': 'module-1/week-1-2/embodied-intelligence.md',
        'humanoid-landscape': 'module-1/week-1-2/humanoid-landscape.md',
        'sensor-systems': 'module-1/week-1-2/sensor-systems.md',
        'ros2-architecture': 'module-1/week-3-5/ros2-architecture.md',
        'nodes-topics-services': 'module-1/week-3-5/nodes-topics-services.md',
        'building-packages': 'module-1/week-3-5/building-packages.md',
        'launch-files': 'module-1/week-3-5/launch-files.md',
        'gazebo-setup': 'module-2/week-6-7/gazebo-setup.md',
        'urdf-sdf': 'module-2/week-6-7/urdf-sdf.md',
        'physics-sensors': 'module-2/week-6-7/physics-sensors.md',
        'unity-visualization': 'module-2/week-6-7/unity-visualization.md',
        'isaac-sdk': 'module-3/week-8-10/isaac-sdk.md',
        'ai-perception': 'module-3/week-8-10/ai-perception.md',
        'reinforcement-learning': 'module-3/week-8-10/reinforcement-learning.md',
        'sim-to-real': 'module-3/week-8-10/sim-to-real.md',
        'humanoid-kinematics': 'module-4/week-11-12/humanoid-kinematics.md',
        'bipedal-locomotion': 'module-4/week-11-12/bipedal-locomotion.md',
        'manipulation-grasping': 'module-4/week-11-12/manipulation-grasping.md',
        'human-robot-interaction': 'module-4/week-11-12/human-robot-interaction.md',
        'gpt-integration': 'module-4/week-13/gpt-integration.md',
        'speech-recognition': 'module-4/week-13/speech-recognition.md',
        'multimodal-interaction': 'module-4/week-13/multimodal-interaction.md',
        'hardware-requirements': 'hardware/hardware-requirements.md',
        'assessments': 'assessments.md',
    };

    const filePath = filePathMap[id];
    if (!filePath) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    try {
        const fullPath = join(process.cwd(), 'docs', filePath);
        const content = readFileSync(fullPath, 'utf-8');

        // Extract title and sections
        const lines = content.split('\n');
        let title = id;
        const sections: string[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('title:')) {
                title = trimmedLine.replace('title:', '').trim().replace(/['"]/g, '');
            }

            // Fallback: Extract H1 as title if we haven't found a frontmatter title
            // (and the line looks like a title, not just a random #)
            if (title === id && trimmedLine.match(/^#\s+(.+)$/)) {
                const h1Match = trimmedLine.match(/^#\s+(.+)$/);
                if (h1Match) {
                    title = h1Match[1].trim();
                }
            }

            // Match H2 headers more robustly (trim first to handle CRLF)
            const h2Match = trimmedLine.match(/^##\s+(.+)$/);
            if (h2Match) {
                sections.push(h2Match[1].trim());
            }
        }

        // Convert markdown to HTML on server
        const htmlContent = await marked(content);

        return NextResponse.json({ title, content: htmlContent, sections });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
    }
}
