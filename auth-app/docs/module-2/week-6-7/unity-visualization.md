
# Chapter 4: Unity for Robot Visualization

## Overview

Unity is a powerful game engine that can be used for robot visualization, simulation, and training AI with realistic graphics. This chapter introduces Unity for robotics, ROS 2 integration, and creating immersive robot visualizations.

:::info Learning Time
**Estimated Reading Time**: 50-60 minutes
**Hands-on Activities**: 60 minutes
**Total Chapter Time**: 2 hours
:::

---

## 4.1 Why Unity for Robotics?

### Unity vs. Gazebo

| Feature | Gazebo | Unity |
|---------|--------|-------|
| **Graphics** | Functional | Photorealistic |
| **Physics** | Excellent (robotics-focused) | Good (game-focused) |
| **Performance** | Moderate | Excellent |
| **VR/AR** | Limited | Native support |
| **Asset Store** | Limited | Massive ecosystem |
| **Learning Curve** | Moderate | Steeper |
| **Primary Use** | Robot simulation | Visualization, training |

### When to Use Unity

**✅ Use Unity for:**
- Photorealistic visualization
- Human-robot interaction studies
- VR/AR applications
- Marketing/demos
- Synthetic data generation
- Reinforcement learning environments

**❌ Use Gazebo for:**
- Accurate physics simulation
- Hardware-in-the-loop testing
- Standard robotics workflows
- ROS-centric development

---

## 4.2 Unity Basics

### Installation

**Unity Hub:**
1. Download Unity Hub: https://unity.com/download
2. Install Unity Editor (LTS version recommended: 2022.3 LTS)
3. Add modules:
   - Linux Build Support
   - Windows Build Support
   - WebGL Build Support

**System Requirements:**
- **OS**: Windows 10/11, macOS, Linux
- **GPU**: DirectX 11/12 compatible
- **RAM**: 8GB minimum, 16GB+ recommended
- **Storage**: 10GB+ for Unity + projects

### Unity Interface

```
┌─────────────────────────────────────────────────────┐
│  Menu Bar (File, Edit, Assets, GameObject, etc.)   │
├──────────┬──────────────────────────┬───────────────┤
│          │                          │               │
│ Hierarchy│      Scene View          │   Inspector   │
│  (Tree)  │   (3D Viewport)          │  (Properties) │
│          │                          │               │
│          ├──────────────────────────┤               │
│          │      Game View           │               │
│          │  (Runtime Preview)       │               │
├──────────┴──────────────────────────┴───────────────┤
│              Project (Assets)                       │
│           Console (Logs/Errors)                     │
└─────────────────────────────────────────────────────┘
```

**Key Panels:**
- **Hierarchy**: Scene object tree
- **Scene View**: 3D editing viewport
- **Inspector**: Object properties
- **Project**: Asset browser
- **Console**: Debug messages

---

## 4.3 Unity-ROS 2 Integration

### Unity Robotics Hub

**Installation:**

1. **Create new Unity project** (3D template)

2. **Add Unity Robotics packages:**
   - Window → Package Manager
   - Click "+" → Add package from git URL
   - Add: `https://github.com/Unity-Technologies/ROS-TCP-Connector.git?path=/com.unity.robotics.ros-tcp-connector`
   - Add: `https://github.com/Unity-Technologies/URDF-Importer.git?path=/com.unity.robotics.urdf-importer`

3. **Install ROS 2 TCP Endpoint:**
```bash
# In your ROS 2 workspace
cd ~/ros2_ws/src
git clone https://github.com/Unity-Technologies/ROS-TCP-Endpoint
cd ~/ros2_ws
colcon build --packages-select ros_tcp_endpoint
source install/setup.bash
```

### Configuring ROS Connection

**In Unity:**
1. Robotics → ROS Settings
2. Set ROS IP Address: `127.0.0.1` (localhost)
3. Set ROS Port: `10000`
4. Protocol: ROS 2

**Launch ROS 2 endpoint:**
```bash
ros2 run ros_tcp_endpoint default_server_endpoint --ros-args -p ROS_IP:=0.0.0.0
```

---

## 4.4 Importing URDF into Unity

### URDF Importer

**Import robot:**
1. Assets → Import Robot from URDF
2. Select your `.urdf` file
3. Configure import settings:
   - **Mesh Decomposer**: VHACD (for collision)
   - **Axis Type**: Y Axis
   - **Convex Method**: Inherit

**Result:**
- Robot GameObject in scene
- Articulation Body components (joints)
- Colliders and meshes

### Example: Import TurtleBot3

```bash
# Get TurtleBot3 URDF
cd ~/Downloads
git clone https://github.com/ROBOTIS-GIT/turtlebot3
```

**In Unity:**
1. Assets → Import Robot from URDF
2. Navigate to `turtlebot3/turtlebot3_description/urdf/turtlebot3_waffle.urdf`
3. Click "Import URDF"
4. Robot appears in scene!

---

## 4.5 Creating a Simple Scene

### Basic Environment Setup

**1. Create Ground Plane:**
```
GameObject → 3D Object → Plane
- Scale: (10, 1, 10)
- Position: (0, 0, 0)
```

**2. Add Lighting:**
```
GameObject → Light → Directional Light
- Rotation: (50, -30, 0)
- Intensity: 1
```

**3. Add Camera:**
```
GameObject → Camera
- Position: (5, 3, -5)
- Rotation: (20, -45, 0)
```

**4. Add Obstacles:**
```
GameObject → 3D Object → Cube
- Position: (2, 0.5, 0)
- Scale: (1, 1, 1)
```

### Materials and Textures

**Create material:**
1. Right-click in Project → Create → Material
2. Name: "FloorMaterial"
3. Inspector:
   - Albedo: Choose color or texture
   - Metallic: 0
   - Smoothness: 0.5

**Apply to object:**
- Drag material onto object in Scene

---

## 4.6 Publishing ROS 2 Messages from Unity

### Publishing Transform

**C# Script (PublishTransform.cs):**
```csharp
using UnityEngine;
using Unity.Robotics.ROSTCPConnector;
using RosMessageTypes.Geometry;

public class PublishTransform : MonoBehaviour
{
    ROSConnection ros;
    public string topicName = "unity/robot_pose";
    public float publishRate = 10.0f;

    private float timeElapsed;

    void Start()
    {
        // Get ROS connection
        ros = ROSConnection.GetOrCreateInstance();
        ros.RegisterPublisher<PoseStampedMsg>(topicName);
    }

    void Update()
    {
        timeElapsed += Time.deltaTime;

        if (timeElapsed > 1.0f / publishRate)
        {
            // Get transform
            Vector3 position = transform.position;
            Quaternion rotation = transform.rotation;

            // Create ROS message
            PoseStampedMsg poseMsg = new PoseStampedMsg
            {
                header = new RosMessageTypes.Std.HeaderMsg
                {
                    stamp = new RosMessageTypes.BuiltinInterfaces.TimeMsg
                    {
                        sec = (int)Time.time,
                        nanosec = (uint)((Time.time % 1) * 1e9)
                    },
                    frame_id = "world"
                },
                pose = new PoseMsg
                {
                    position = new PointMsg
                    {
                        x = position.x,
                        y = position.y,
                        z = position.z
                    },
                    orientation = new QuaternionMsg
                    {
                        x = rotation.x,
                        y = rotation.y,
                        z = rotation.z,
                        w = rotation.w
                    }
                }
            };

            // Publish
            ros.Publish(topicName, poseMsg);

            timeElapsed = 0;
        }
    }
}
```

**Attach script:**
1. Select robot GameObject
2. Add Component → Scripts → PublishTransform
3. Configure topic name and rate

---

## 4.7 Subscribing to ROS 2 Messages

### Controlling Robot from ROS 2

**C# Script (SubscribeVelocity.cs):**
```csharp
using UnityEngine;
using Unity.Robotics.ROSTCPConnector;
using RosMessageTypes.Geometry;

public class SubscribeVelocity : MonoBehaviour
{
    ROSConnection ros;
    public string topicName = "cmd_vel";

    private float linearVelocity = 0;
    private float angularVelocity = 0;

    void Start()
    {
        ros = ROSConnection.GetOrCreateInstance();
        ros.Subscribe<TwistMsg>(topicName, ReceiveVelocity);
    }

    void ReceiveVelocity(TwistMsg msg)
    {
        // Extract velocities
        linearVelocity = (float)msg.linear.x;
        angularVelocity = (float)msg.angular.z;
    }

    void FixedUpdate()
    {
        // Apply velocities to robot
        // Convert ROS velocities to Unity movement

        // Forward/backward
        transform.Translate(Vector3.forward * linearVelocity * Time.fixedDeltaTime);

        // Rotation
        transform.Rotate(Vector3.up, angularVelocity * Mathf.Rad2Deg * Time.fixedDeltaTime);
    }
}
```

**Test with ROS 2:**
```bash
# Publish velocity commands
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist \
  "{linear: {x: 0.5}, angular: {z: 0.5}}"
```

---

## 4.8 Simulating Sensors in Unity

### Camera Sensor

**Add camera to robot:**
```
1. Right-click robot → Create Empty (name: "CameraMount")
2. Right-click CameraMount → Camera
3. Position camera appropriately
```

**Publish camera images:**
```csharp
using UnityEngine;
using Unity.Robotics.ROSTCPConnector;
using RosMessageTypes.Sensor;

public class PublishCameraImage : MonoBehaviour
{
    ROSConnection ros;
    public string topicName = "camera/image_raw";
    public Camera imageCamera;
    public int resolutionWidth = 640;
    public int resolutionHeight = 480;
    public float publishRate = 10.0f;

    private RenderTexture renderTexture;
    private Texture2D texture2D;
    private float timeElapsed;

    void Start()
    {
        ros = ROSConnection.GetOrCreateInstance();
        ros.RegisterPublisher<ImageMsg>(topicName);

        // Create render texture
        renderTexture = new RenderTexture(resolutionWidth, resolutionHeight, 24);
        imageCamera.targetTexture = renderTexture;

        texture2D = new Texture2D(resolutionWidth, resolutionHeight, TextureFormat.RGB24, false);
    }

    void Update()
    {
        timeElapsed += Time.deltaTime;

        if (timeElapsed > 1.0f / publishRate)
        {
            // Render camera
            imageCamera.Render();

            // Read pixels
            RenderTexture.active = renderTexture;
            texture2D.ReadPixels(new Rect(0, 0, resolutionWidth, resolutionHeight), 0, 0);
            texture2D.Apply();

            // Convert to ROS message
            byte[] imageData = texture2D.GetRawTextureData();

            ImageMsg imageMsg = new ImageMsg
            {
                header = new RosMessageTypes.Std.HeaderMsg
                {
                    stamp = new RosMessageTypes.BuiltinInterfaces.TimeMsg
                    {
                        sec = (int)Time.time,
                        nanosec = (uint)((Time.time % 1) * 1e9)
                    },
                    frame_id = "camera_link"
                },
                height = (uint)resolutionHeight,
                width = (uint)resolutionWidth,
                encoding = "rgb8",
                is_bigendian = 0,
                step = (uint)(resolutionWidth * 3),
                data = imageData
            };

            ros.Publish(topicName, imageMsg);

            timeElapsed = 0;
        }
    }
}
```

### LiDAR Sensor

**Simple 2D LiDAR:**
```csharp
using UnityEngine;
using Unity.Robotics.ROSTCPConnector;
using RosMessageTypes.Sensor;

public class PublishLaserScan : MonoBehaviour
{
    ROSConnection ros;
    public string topicName = "scan";
    public int numRays = 360;
    public float maxRange = 10.0f;
    public float publishRate = 10.0f;

    private float timeElapsed;

    void Start()
    {
        ros = ROSConnection.GetOrCreateInstance();
        ros.RegisterPublisher<LaserScanMsg>(topicName);
    }

    void Update()
    {
        timeElapsed += Time.deltaTime;

        if (timeElapsed > 1.0f / publishRate)
        {
            float[] ranges = new float[numRays];
            float angleMin = -Mathf.PI;
            float angleMax = Mathf.PI;
            float angleIncrement = (angleMax - angleMin) / numRays;

            // Cast rays
            for (int i = 0; i < numRays; i++)
            {
                float angle = angleMin + i * angleIncrement;
                Vector3 direction = new Vector3(
                    Mathf.Cos(angle),
                    0,
                    Mathf.Sin(angle)
                );

                RaycastHit hit;
                if (Physics.Raycast(transform.position, transform.TransformDirection(direction), out hit, maxRange))
                {
                    ranges[i] = hit.distance;
                }
                else
                {
                    ranges[i] = float.PositiveInfinity;
                }
            }

            // Create ROS message
            LaserScanMsg scanMsg = new LaserScanMsg
            {
                header = new RosMessageTypes.Std.HeaderMsg
                {
                    stamp = new RosMessageTypes.BuiltinInterfaces.TimeMsg
                    {
                        sec = (int)Time.time,
                        nanosec = (uint)((Time.time % 1) * 1e9)
                    },
                    frame_id = "lidar_link"
                },
                angle_min = angleMin,
                angle_max = angleMax,
                angle_increment = angleIncrement,
                time_increment = 0,
                scan_time = 1.0f / publishRate,
                range_min = 0.1f,
                range_max = maxRange,
                ranges = ranges,
                intensities = new float[0]
            };

            ros.Publish(topicName, scanMsg);

            timeElapsed = 0;
        }
    }
}
```

---

## 4.9 Advanced Unity Features

### High-Quality Rendering

**Universal Render Pipeline (URP):**
1. Window → Package Manager
2. Install "Universal RP"
3. Create URP Asset:
   - Assets → Create → Rendering → URP Asset
4. Edit → Project Settings → Graphics
   - Set Scriptable Render Pipeline Settings to URP asset

**Post-Processing:**
- Bloom
- Ambient Occlusion
- Color Grading
- Depth of Field

### Particle Systems

**Dust/smoke effects:**
```
GameObject → Effects → Particle System
- Configure emission, shape, color over lifetime
```

### Animation

**Animate robot joints:**
1. Window → Animation → Animation
2. Select robot link
3. Click "Create" to make animation clip
4. Add keyframes for rotation/position

---

## 4.10 VR/AR Integration

### VR Setup

**Install XR Plugin:**
1. Edit → Project Settings → XR Plug-in Management
2. Install XR Plugin Management
3. Enable OpenXR or Oculus

**Add VR camera:**
```
GameObject → XR → XR Origin (Action-based)
```

**VR robot teleoperation:**
- Use VR controllers to control robot
- Visualize sensor data in 3D space
- Immersive human-robot interaction

---

## 4.11 Unity ML-Agents (Bonus)

### Reinforcement Learning

**Unity ML-Agents** enables training robots with RL:

**Installation:**
```bash
pip install mlagents
```

**Create training environment:**
1. Define observation space (sensors)
2. Define action space (motors)
3. Define reward function
4. Train with PPO/SAC algorithms

**Example use cases:**
- Bipedal walking
- Object manipulation
- Navigation

---

## 4.12 Learning Objectives

By completing this chapter, you should be able to:

### Knowledge Objectives
- [ ] **Explain** Unity's role in robotics
- [ ] **Describe** Unity-ROS 2 integration
- [ ] **List** Unity's advantages for visualization

### Comprehension Objectives
- [ ] **Understand** when to use Unity vs. Gazebo
- [ ] **Compare** Unity and Gazebo capabilities
- [ ] **Explain** how to publish/subscribe ROS 2 messages

### Application Objectives
- [ ] **Import** URDF robots into Unity
- [ ] **Create** realistic 3D environments
- [ ] **Implement** ROS 2 communication
- [ ] **Simulate** sensors in Unity

---

## 4.13 Key Takeaways

:::tip Essential Concepts
1. **Unity** excels at visualization, VR/AR, and graphics

2. **Unity Robotics Hub** enables ROS 2 integration

3. **URDF Importer** brings ROS robots into Unity

4. **C# scripts** handle ROS 2 pub/sub communication

5. **Sensors** can be simulated with raycasting and cameras

6. **VR/AR** support enables immersive robot interaction
:::

:::warning Considerations
- Unity physics ≠ robotics-grade physics
- Use Unity for visualization, Gazebo for accurate simulation
- C# learning curve for ROS developers
- Performance depends on scene complexity
:::

---

## 4.14 Hands-On Project

### Project: Unity Robot Visualizer

**Create:**
1. Import your robot URDF
2. Build a realistic environment (floor, walls, objects)
3. Add lighting and materials
4. Implement ROS 2 communication:
   - Subscribe to `/cmd_vel`
   - Publish camera images
   - Publish robot pose

**Bonus:**
- Add particle effects (dust from wheels)
- Implement VR camera view
- Create animated UI panels

---

## Next Steps

**Congratulations!** You've completed Weeks 6-7: Robot Simulation.

**You've learned**:
- ✅ Gazebo simulation environment
- ✅ URDF and SDF robot descriptions
- ✅ Physics and sensor simulation
- ✅ Unity for visualization

**Next**: Continue to subsequent modules for advanced topics like computer vision, motion planning, and AI integration!

---

## Further Reading

- [Unity Robotics Hub](https://github.com/Unity-Technologies/Unity-Robotics-Hub)
- [Unity Learn](https://learn.unity.com/)
- [Unity ML-Agents](https://github.com/Unity-Technologies/ml-agents)
- [ROS-TCP-Connector](https://github.com/Unity-Technologies/ROS-TCP-Connector)

---

**Chapter 4 Complete! ✅**

**Weeks 6-7 Complete! 🎉**

You now have comprehensive skills in robot simulation using both Gazebo and Unity!
