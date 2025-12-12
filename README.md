# Physical AI & Humanoid Robotics Textbook

An AI-native textbook for teaching Physical AI & Humanoid Robotics, built with Docusaurus and integrated with a RAG chatbot.

## 🚀 Project Overview

This textbook bridges the gap between digital AI and embodied intelligence, teaching students to design, simulate, and deploy humanoid robots using:
- **ROS 2** (Robot Operating System)
- **Gazebo & Unity** (Simulation)
- **NVIDIA Isaac** (AI Robot Platform)
- **GPT Integration** (Conversational Robotics)

## 📚 Course Structure

### Module 1: The Robotic Nervous System (ROS 2)
**Weeks 1-5** - Middleware for robot control

### Module 2: The Digital Twin (Gazebo & Unity)
**Weeks 6-7** - Physics simulation and environment building

### Module 3: The AI-Robot Brain (NVIDIA Isaac™)
**Weeks 8-10** - Advanced perception and training

### Module 4: Vision-Language-Action (VLA)
**Weeks 11-13** - LLMs + Robotics convergence

## 🛠️ Tech Stack

- **Framework**: Docusaurus v3
- **Language**: TypeScript/JavaScript
- **Deployment**: GitHub Pages
- **RAG Chatbot**: FastAPI + OpenAI + Qdrant + Neon Postgres

## 📋 Prerequisites

### Software
- Node.js 18+
- npm or yarn
- Git

### Hardware (for running simulations)
- **GPU**: NVIDIA RTX 4070 Ti (12GB VRAM) or higher
- **CPU**: Intel Core i7 (13th Gen+) or AMD Ryzen 9
- **RAM**: 64 GB DDR5 (minimum 32 GB)
- **OS**: Ubuntu 22.04 LTS

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/Book-for-project-hackathon.git
cd Book-for-project-hackathon

# Install dependencies
npm install

# Start development server
npm start
```

The site will open at `http://localhost:3000`

### Build for Production

```bash
# Build static files
npm run build

# Serve locally
npm run serve
```

## 📁 Project Structure

```
Book-for-project-hackathon/
├── docs/                  # Course content
│   ├── intro.md          # Course overview
│   ├── module-1/         # ROS 2 content
│   ├── module-2/         # Gazebo & Unity
│   ├── module-3/         # NVIDIA Isaac
│   ├── module-4/         # VLA content
│   ├── hardware/         # Hardware guides
│   └── assessments.md    # Course assessments
├── src/                  # React components
│   ├── components/       # Custom components
│   └── css/             # Styling
├── static/              # Static assets
├── docusaurus.config.ts # Docusaurus configuration
├── sidebars.ts          # Sidebar navigation
└── package.json         # Dependencies
```

## 🤖 RAG Chatbot Integration

The textbook includes an AI-powered chatbot that can:
- Answer questions about course content
- Respond to selected text
- Provide context-aware assistance

### Backend Setup (Coming Soon)
- FastAPI backend
- Qdrant vector store
- Neon Serverless Postgres
- OpenAI Agents/ChatKit SDK

## 🎯 Learning Outcomes

By completing this course, you will:
1. ✅ Understand Physical AI principles and embodied intelligence
2. ✅ Master ROS 2 for robotic control
3. ✅ Simulate robots with Gazebo and Unity
4. ✅ Develop with NVIDIA Isaac AI robot platform
5. ✅ Design humanoid robots for natural interactions
6. ✅ Integrate GPT models for conversational robotics

## 📝 Assessments

- **Week 5**: ROS 2 Package Development
- **Week 7**: Gazebo Simulation Implementation
- **Week 10**: Isaac-Based Perception Pipeline
- **Week 13**: Capstone - Autonomous Humanoid

## 🤝 Contributing

This is a hackathon project for Panaversity. Contributions, suggestions, and feedback are welcome!

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Panaversity** - For organizing the hackathon
- **NVIDIA** - For Isaac platform documentation
- **Open Robotics** - For ROS 2
- **Docusaurus** - For the amazing documentation framework

## 📧 Contact

For questions or feedback, please open an issue or reach out via the course discussion forum.

---

**Built with ❤️ for the Panaversity Hackathon 2025**
