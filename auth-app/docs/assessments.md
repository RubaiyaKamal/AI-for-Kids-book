
# Assessments

## Course Assessment Structure

This course evaluates your learning through **4 major projects** that progressively build your Physical AI skills. Each assessment is designed to be practical, hands-on, and directly applicable to real-world robotics development.

## Assessment 1: ROS 2 Package Development (Week 5)

### Overview
Build a complete ROS 2 package that demonstrates your understanding of the robot software architecture.

### Requirements
Create a ROS 2 package that includes:

1. **Multiple Nodes** (minimum 3)
   - Publisher node
   - Subscriber node
   - Service node

2. **Communication**
   - Topics for sensor data
   - Services for commands
   - Parameters for configuration

3. **URDF Model**
   - Simple robot description
   - Joint definitions
   - Link properties

### Deliverables
- [ ] Source code in GitHub repository
- [ ] README with setup instructions
- [ ] Launch file to start all nodes
- [ ] Demo video (2-3 minutes)

### Grading Criteria (100 points)
- **Functionality** (40 pts): All nodes work correctly
- **Code Quality** (20 pts): Clean, documented, follows ROS 2 conventions
- **URDF Model** (20 pts): Valid robot description
- **Documentation** (10 pts): Clear README and comments
- **Demo** (10 pts): Effective demonstration of capabilities

---

## Assessment 2: Gazebo Simulation Implementation (Week 7)

### Overview
Create a physics-based simulation environment with a robot and demonstrate sensor integration.

### Requirements

1. **Environment Design**
   - Custom Gazebo world
   - Obstacles and terrain
   - Lighting and textures

2. **Robot Integration**
   - Import URDF model
   - Configure physics properties
   - Add sensors (camera, LiDAR, IMU)

3. **Sensor Visualization**
   - Display camera feed
   - Visualize LiDAR data
   - Show IMU readings

### Deliverables
- [ ] Gazebo world file (.world)
- [ ] Robot URDF with sensors
- [ ] ROS 2 nodes to process sensor data
- [ ] Visualization in RViz
- [ ] Demo video (3-4 minutes)

### Grading Criteria (100 points)
- **Environment** (25 pts): Well-designed, realistic world
- **Robot Model** (25 pts): Proper physics, sensors configured
- **Sensor Integration** (30 pts): All sensors working, data published
- **Visualization** (10 pts): Clear RViz setup
- **Documentation** (10 pts): Setup and usage instructions

---

## Assessment 3: Isaac-Based Perception Pipeline (Week 10)

### Overview
Implement an AI-powered perception system using NVIDIA Isaac for object detection and navigation.

### Requirements

1. **Isaac Sim Environment**
   - Photorealistic scene
   - Multiple objects to detect
   - Navigation waypoints

2. **Perception Pipeline**
   - Object detection using Isaac ROS
   - Depth estimation
   - Semantic segmentation

3. **Navigation**
   - VSLAM (Visual SLAM)
   - Path planning with Nav2
   - Obstacle avoidance

### Deliverables
- [ ] Isaac Sim scene
- [ ] Perception pipeline code
- [ ] Navigation configuration
- [ ] Performance metrics (accuracy, latency)
- [ ] Demo video (4-5 minutes)

### Grading Criteria (100 points)
- **Scene Design** (15 pts): Realistic, challenging environment
- **Object Detection** (30 pts): Accurate, real-time detection
- **SLAM** (25 pts): Robust localization and mapping
- **Navigation** (20 pts): Successful path planning and execution
- **Documentation** (10 pts): Clear explanation of pipeline

---

## Assessment 4: Capstone - Simulated Humanoid with Conversational AI (Week 13)

### Overview
**The ultimate challenge**: Build an autonomous humanoid robot that understands voice commands and executes complex tasks.

### Scenario
Your robot receives the command: **"Clean the room"**

It must:
1. **Understand** the command (speech recognition + LLM)
2. **Plan** the task (break down into steps)
3. **Navigate** to objects (path planning)
4. **Identify** objects (computer vision)
5. **Manipulate** objects (grasping and moving)
6. **Report** completion (text-to-speech)

### Technical Requirements

#### 1. Voice Interface
- OpenAI Whisper for speech-to-text
- GPT-4 for command interpretation
- Text-to-speech for responses

#### 2. Task Planning
- LLM-based task decomposition
- ROS 2 action sequences
- Error handling and recovery

#### 3. Perception
- Object detection and classification
- Depth estimation for grasping
- Scene understanding

#### 4. Manipulation
- Inverse kinematics for arm control
- Grasp planning
- Object placement

#### 5. Navigation
- Bipedal locomotion
- Dynamic balance
- Obstacle avoidance

### Deliverables
- [ ] Complete source code (GitHub)
- [ ] Isaac Sim environment
- [ ] System architecture diagram
- [ ] Performance analysis
- [ ] Demo video (5-7 minutes)
- [ ] Technical report (5-10 pages)

### Grading Criteria (200 points)

#### Technical Implementation (120 pts)
- **Voice Interface** (20 pts): Accurate speech recognition and synthesis
- **LLM Integration** (25 pts): Effective task planning with GPT
- **Perception** (25 pts): Robust object detection and scene understanding
- **Manipulation** (25 pts): Successful grasping and object handling
- **Navigation** (25 pts): Stable bipedal walking and path following

#### System Design (40 pts)
- **Architecture** (15 pts): Well-designed, modular system
- **Error Handling** (10 pts): Graceful failure recovery
- **Performance** (15 pts): Real-time operation, low latency

#### Documentation (40 pts)
- **Technical Report** (20 pts): Clear explanation of approach
- **Code Documentation** (10 pts): Well-commented, readable code
- **Demo Video** (10 pts): Professional presentation

### Bonus Points (up to 50 pts)
- **Multi-step tasks** (+15 pts): Handle complex, multi-object scenarios
- **Learning from feedback** (+15 pts): Improve from user corrections
- **Natural conversation** (+10 pts): Multi-turn dialogue
- **Sim-to-real** (+10 pts): Demonstrate on real hardware

---

## Assessment Timeline

| Week | Assessment | Due Date | Weight |
|------|-----------|----------|--------|
| 5 | ROS 2 Package | End of Week 5 | 15% |
| 7 | Gazebo Simulation | End of Week 7 | 20% |
| 10 | Isaac Perception | End of Week 10 | 25% |
| 13 | Capstone Project | End of Week 13 | 40% |

## Submission Guidelines

### Code Submission
1. **GitHub Repository**
   - Public repository
   - Clear README.md
   - MIT or Apache 2.0 license
   - .gitignore for build artifacts

2. **Code Structure**
```
project-name/
├── README.md
├── src/
│   ├── package1/
│   └── package2/
├── launch/
├── config/
├── urdf/
├── worlds/
└── docs/
```

3. **Documentation Requirements**
   - Setup instructions
   - Dependencies list
   - Usage examples
   - Troubleshooting guide

### Video Submission
- **Format**: MP4, 1080p minimum
- **Platform**: YouTube (unlisted) or Google Drive
- **Content**: Live demonstration, not slides
- **Audio**: Clear narration explaining what's happening

### Report Submission (Capstone only)
- **Format**: PDF
- **Sections**:
  1. Introduction and objectives
  2. System architecture
  3. Implementation details
  4. Results and analysis
  5. Challenges and solutions
  6. Future improvements
  7. References

## Academic Integrity

### Allowed
- ✅ Using ROS 2 and NVIDIA Isaac documentation
- ✅ Referencing open-source examples
- ✅ Asking questions in course forums
- ✅ Collaborating on debugging (with attribution)

### Not Allowed
- ❌ Copying code without attribution
- ❌ Submitting someone else's work
- ❌ Using AI to generate entire solutions
- ❌ Sharing your code before deadlines

### Using AI Tools
You may use AI assistants (ChatGPT, Claude, etc.) for:
- Understanding concepts
- Debugging specific errors
- Code review and suggestions

You must:
- Understand all code you submit
- Document AI assistance in your README
- Be able to explain your implementation

## Getting Help

### Office Hours
- **When**: Tuesdays and Thursdays, 2-4 PM
- **Where**: Virtual (Zoom link in course portal)
- **What**: Technical questions, debugging help, project guidance

### Discussion Forum
- Post questions about assignments
- Share resources and tips
- Help classmates (without sharing solutions)

### Technical Support
- ROS 2 issues: [ROS Answers](https://answers.ros.org/)
- NVIDIA Isaac: [Isaac Forum](https://forums.developer.nvidia.com/c/agx-autonomous-machines/isaac/67)
- Gazebo: [Gazebo Answers](https://answers.gazebosim.org/)

## Recommended Resources
- [ROS 2 Documentation](https://docs.ros.org/en/humble/)
- [Gazebo Sim Documentation](https://gazebosim.org/docs)
- [NVIDIA Isaac Sim](https://docs.omniverse.nvidia.com/isaacsim/latest/index.html)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

## Tips for Success

### Start Early
- Don't wait until the last week
- Test incrementally
- Ask for help when stuck

### Document as You Go
- Write README sections as you build
- Comment code while writing it
- Record demo videos early (you can redo them)

### Test Thoroughly
- Test each component independently
- Integration test the full system
- Have a backup plan for demos

### Learn from Feedback
- Review grading rubrics carefully
- Apply feedback from earlier assessments
- Iterate and improve

---

## Questions?

Use the AI chatbot to ask questions about assessment requirements, grading criteria, or submission guidelines. You can also attend office hours or post in the discussion forum.

Good luck! 🚀
