import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Manual sidebar structure for the Physical AI & Humanoid Robotics textbook
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Introduction',
      items: [
        'introduction/index',
        'quarter-overview/index',
        'glossary',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Module 1 - ROS 2 Fundamentals',
      items: [
        'module-1-ros2/index',
        'module-1-ros2/mermaid-example',
        'module-1-ros2/python-example',
        'module-1-ros2/ros2-communication-patterns',
        'module-1-ros2/ros2-urdf-modeling',
        'module-1-ros2/ros2-navigation-basics',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Module 2 - Gazebo and Unity Simulation',
      items: [
        'module-2-gazebo-unity/index',
        'module-2-gazebo-unity/gazebo-physics-simulation',
        'module-2-gazebo-unity/unity-robotics-tools',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Module 3 - NVIDIA Isaac Sim',
      items: [
        'module-3-nvidia-isaac/index',
        'module-3-nvidia-isaac/isaac-sim-fundamentals',
        'module-3-nvidia-isaac/domain-randomization',
        'module-3-nvidia-isaac/gpu-accelerated-physics',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Module 4 - Vision-Language-Action Models',
      items: [
        'module-4-vla/index',
        'module-4-vla/vla-model-architectures',
        'module-4-vla/human-robot-interaction',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Capstone Project',
      items: [
        'capstone/index',
        'capstone/integrated-system-design',
      ],
      collapsed: false,
    },
  ],
};

export default sidebars;