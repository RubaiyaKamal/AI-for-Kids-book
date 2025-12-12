// Book navigation data structure based on sidebars.ts
export interface BookSection {
    id: string;
    label: string;
    type: 'doc' | 'category';
    items?: BookSection[];
}

export const bookNavigation: BookSection[] = [
    {
        id: 'intro',
        label: 'Course Overview',
        type: 'doc',
    },
    {
        id: 'module-1',
        label: 'Module 1: The Robotic Nervous System (ROS 2)',
        type: 'category',
        items: [
            {
                id: 'week-1-2',
                label: 'Weeks 1-2: Introduction to Physical AI',
                type: 'category',
                items: [
                    { id: 'intro-physical-ai', label: 'Introduction to Physical AI', type: 'doc' },
                    { id: 'embodied-intelligence', label: 'Embodied Intelligence', type: 'doc' },
                    { id: 'humanoid-landscape', label: 'Humanoid Landscape', type: 'doc' },
                    { id: 'sensor-systems', label: 'Sensor Systems', type: 'doc' },
                ],
            },
            {
                id: 'week-3-5',
                label: 'Weeks 3-5: ROS 2 Fundamentals',
                type: 'category',
                items: [
                    { id: 'ros2-architecture', label: 'ROS 2 Architecture', type: 'doc' },
                    { id: 'nodes-topics-services', label: 'Nodes, Topics & Services', type: 'doc' },
                    { id: 'building-packages', label: 'Building Packages', type: 'doc' },
                    { id: 'launch-files', label: 'Launch Files', type: 'doc' },
                ],
            },
        ],
    },
    {
        id: 'module-2',
        label: 'Module 2: The Digital Twin (Gazebo & Unity)',
        type: 'category',
        items: [
            {
                id: 'week-6-7',
                label: 'Weeks 6-7: Robot Simulation',
                type: 'category',
                items: [
                    { id: 'gazebo-setup', label: 'Gazebo Setup', type: 'doc' },
                    { id: 'urdf-sdf', label: 'URDF & SDF', type: 'doc' },
                    { id: 'physics-sensors', label: 'Physics & Sensors', type: 'doc' },
                    { id: 'unity-visualization', label: 'Unity Visualization', type: 'doc' },
                ],
            },
        ],
    },
    {
        id: 'module-3',
        label: 'Module 3: The AI-Robot Brain (NVIDIA Isaac™)',
        type: 'category',
        items: [
            {
                id: 'week-8-10',
                label: 'Weeks 8-10: NVIDIA Isaac Platform',
                type: 'category',
                items: [
                    { id: 'isaac-sdk', label: 'Isaac SDK', type: 'doc' },
                    { id: 'ai-perception', label: 'AI Perception', type: 'doc' },
                    { id: 'reinforcement-learning', label: 'Reinforcement Learning', type: 'doc' },
                    { id: 'sim-to-real', label: 'Sim-to-Real Transfer', type: 'doc' },
                ],
            },
        ],
    },
    {
        id: 'module-4',
        label: 'Module 4: Vision-Language-Action (VLA)',
        type: 'category',
        items: [
            {
                id: 'week-11-12',
                label: 'Weeks 11-12: Humanoid Robot Development',
                type: 'category',
                items: [
                    { id: 'humanoid-kinematics', label: 'Humanoid Kinematics', type: 'doc' },
                    { id: 'bipedal-locomotion', label: 'Bipedal Locomotion', type: 'doc' },
                    { id: 'manipulation-grasping', label: 'Manipulation & Grasping', type: 'doc' },
                    { id: 'human-robot-interaction', label: 'Human-Robot Interaction', type: 'doc' },
                ],
            },
            {
                id: 'week-13',
                label: 'Week 13: Conversational Robotics',
                type: 'category',
                items: [
                    { id: 'gpt-integration', label: 'GPT Integration', type: 'doc' },
                    { id: 'speech-recognition', label: 'Speech Recognition', type: 'doc' },
                    { id: 'multimodal-interaction', label: 'Multimodal Interaction', type: 'doc' },
                ],
            },
        ],
    },
    {
        id: 'hardware',
        label: 'Hardware Requirements',
        type: 'category',
        items: [
            { id: 'hardware-requirements', label: 'Hardware Requirements', type: 'doc' },
        ],
    },
    {
        id: 'assessments',
        label: 'Assessments',
        type: 'doc',
    },
];
