import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
    // By default, Docusaurus generates a sidebar from the docs folder structure
    tutorialSidebar: [
        {
            type: 'doc',
            id: 'intro',
            label: 'Course Overview',
        },
        {
            type: 'category',
            label: 'Module 1: The Robotic Nervous System (ROS 2)',
            items: [
                // {
                //     type: 'category',
                //     label: 'Weeks 1-2: Introduction to Physical AI',
                //     items: [
                //         'module-1/week-1-2/intro-physical-ai',
                //         'module-1/week-1-2/embodied-intelligence',
                //         'module-1/week-1-2/humanoid-landscape',
                //         'module-1/week-1-2/sensor-systems',
                //     ],
                // },
                // {
                //     type: 'category',
                //     label: 'Weeks 3-5: ROS 2 Fundamentals',
                //     items: [
                //         'module-1/week-3-5/ros2-architecture',
                //         'module-1/week-3-5/nodes-topics-services',
                //         'module-1/week-3-5/building-packages',
                //         'module-1/week-3-5/launch-files',
                //     ],
                // },
            ],
        },
        {
            type: 'category',
            label: 'Module 2: The Digital Twin (Gazebo & Unity)',
            items: [
                // {
                //     type: 'category',
                //     label: 'Weeks 6-7: Robot Simulation',
                //     items: [
                //         'module-2/week-6-7/gazebo-setup',
                //         'module-2/week-6-7/urdf-sdf',
                //         'module-2/week-6-7/physics-sensors',
                //         'module-2/week-6-7/unity-visualization',
                //     ],
                // },
            ],
        },
        {
            type: 'category',
            label: 'Module 3: The AI-Robot Brain (NVIDIA Isaac™)',
            items: [
                // {
                //     type: 'category',
                //     label: 'Weeks 8-10: NVIDIA Isaac Platform',
                //     items: [
                //         'module-3/week-8-10/isaac-sdk',
                //         'module-3/week-8-10/ai-perception',
                //         'module-3/week-8-10/reinforcement-learning',
                //         'module-3/week-8-10/sim-to-real',
                //     ],
                // },
            ],
        },
        {
            type: 'category',
            label: 'Module 4: Vision-Language-Action (VLA)',
            items: [
                // {
                //     type: 'category',
                //     label: 'Weeks 11-12: Humanoid Robot Development',
                //     items: [
                //         'module-4/week-11-12/humanoid-kinematics',
                //         'module-4/week-11-12/bipedal-locomotion',
                //         'module-4/week-11-12/manipulation-grasping',
                //         'module-4/week-11-12/human-robot-interaction',
                //     ],
                // },
                // {
                //     type: 'category',
                //     label: 'Week 13: Conversational Robotics',
                //     items: [
                //         'module-4/week-13/gpt-integration',
                //         'module-4/week-13/speech-recognition',
                //         'module-4/week-13/multimodal-interaction',
                //     ],
                // },
            ],
        },
        // {
        //     type: 'category',
        //     label: 'Hardware Requirements',
        //     items: [
        //         'hardware/hardware-requirements',
        //     ],
        // },
        {
            type: 'doc',
            id: 'assessments',
            label: 'Assessments',
        },
    ],
};

export default sidebars;
