
# Chapter 2: URDF and SDF Robot Description

## Overview

URDF (Unified Robot Description Format) and SDF (Simulation Description Format) are XML-based formats for describing robot structure, kinematics, dynamics, and sensors. This chapter teaches you to create accurate robot models for simulation.

:::info Learning Time
**Estimated Reading Time**: 70-80 minutes
**Hands-on Activities**: 60 minutes
**Total Chapter Time**: 2-2.5 hours
:::

---

## 2.1 URDF vs. SDF

### Format Comparison

| Feature | URDF | SDF |
|---------|------|-----|
| **Primary Use** | ROS robots | Gazebo simulation |
| **Complexity** | Simpler | More comprehensive |
| **Physics** | Basic | Advanced |
| **Multiple Robots** | No | Yes |
| **Closed Loops** | No | Yes |
| **Plugins** | ROS-specific | Gazebo-specific |
| **Standard** | ROS | Open Robotics |

:::tip Recommendation
- Use **URDF** for ROS 2 robots (RViz, MoveIt)
- Convert URDF to SDF for Gazebo
- Use **SDF** directly for complex simulations
:::

---

## 2.2 URDF Fundamentals

### Basic URDF Structure

```xml
<?xml version="1.0"?>
<robot name="my_robot">

  <!-- Links (rigid bodies) -->
  <link name="base_link">
    <!-- Visual representation -->
    <visual>
      <geometry>
        <box size="0.6 0.4 0.2"/>
      </geometry>
      <material name="blue">
        <color rgba="0 0 0.8 1"/>
      </material>
    </visual>

    <!-- Collision geometry -->
    <collision>
      <geometry>
        <box size="0.6 0.4 0.2"/>
      </geometry>
    </collision>

    <!-- Inertial properties -->
    <inertial>
      <mass value="10.0"/>
      <inertia ixx="0.4" ixy="0.0" ixz="0.0"
               iyy="0.6" iyz="0.0"
               izz="0.8"/>
    </inertial>
  </link>

  <!-- Joints (connections between links) -->
  <joint name="base_to_wheel" type="continuous">
    <parent link="base_link"/>
    <child link="wheel_link"/>
    <origin xyz="0.2 0 -0.1" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <link name="wheel_link">
    <!-- Wheel definition... -->
  </link>

</robot>
```

### URDF Elements

**1. Links**
- Represent rigid bodies
- Define visual appearance
- Specify collision geometry
- Include inertial properties

**2. Joints**
- Connect links
- Define motion constraints
- Set limits and dynamics

**3. Materials**
- Visual appearance
- Colors and textures

---

## 2.3 Creating a Simple Robot

### Example: Mobile Robot Base

**robot.urdf**:
```xml
<?xml version="1.0"?>
<robot name="simple_mobile_robot">

  <!-- Base Link -->
  <link name="base_link">
    <visual>
      <geometry>
        <box size="0.6 0.4 0.2"/>
      </geometry>
      <material name="blue">
        <color rgba="0 0 0.8 1"/>
      </material>
    </visual>

    <collision>
      <geometry>
        <box size="0.6 0.4 0.2"/>
      </geometry>
    </collision>

    <inertial>
      <mass value="5.0"/>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <inertia ixx="0.0833" ixy="0.0" ixz="0.0"
               iyy="0.1667" iyz="0.0"
               izz="0.2167"/>
    </inertial>
  </link>

  <!-- Left Wheel -->
  <link name="left_wheel">
    <visual>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
      <origin xyz="0 0 0" rpy="1.5708 0 0"/>
      <material name="black">
        <color rgba="0 0 0 1"/>
      </material>
    </visual>

    <collision>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
      <origin xyz="0 0 0" rpy="1.5708 0 0"/>
    </collision>

    <inertial>
      <mass value="0.5"/>
      <origin xyz="0 0 0" rpy="1.5708 0 0"/>
      <inertia ixx="0.00125" ixy="0.0" ixz="0.0"
               iyy="0.00125" iyz="0.0"
               izz="0.0025"/>
    </inertial>
  </link>

  <!-- Left Wheel Joint -->
  <joint name="left_wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="left_wheel"/>
    <origin xyz="0.15 0.225 -0.1" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
    <dynamics damping="0.1" friction="0.1"/>
  </joint>

  <!-- Right Wheel (similar to left) -->
  <link name="right_wheel">
    <visual>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
      <origin xyz="0 0 0" rpy="1.5708 0 0"/>
      <material name="black">
        <color rgba="0 0 0 1"/>
      </material>
    </visual>

    <collision>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
      <origin xyz="0 0 0" rpy="1.5708 0 0"/>
    </collision>

    <inertial>
      <mass value="0.5"/>
      <origin xyz="0 0 0" rpy="1.5708 0 0"/>
      <inertia ixx="0.00125" ixy="0.0" ixz="0.0"
               iyy="0.00125" iyz="0.0"
               izz="0.0025"/>
    </inertial>
  </link>

  <joint name="right_wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="right_wheel"/>
    <origin xyz="0.15 -0.225 -0.1" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
    <dynamics damping="0.1" friction="0.1"/>
  </joint>

  <!-- Caster Wheel -->
  <link name="caster">
    <visual>
      <geometry>
        <sphere radius="0.05"/>
      </geometry>
      <material name="gray">
        <color rgba="0.5 0.5 0.5 1"/>
      </material>
    </visual>

    <collision>
      <geometry>
        <sphere radius="0.05"/>
      </geometry>
    </collision>

    <inertial>
      <mass value="0.1"/>
      <inertia ixx="0.0001" ixy="0.0" ixz="0.0"
               iyy="0.0001" iyz="0.0"
               izz="0.0001"/>
    </inertial>
  </link>

  <joint name="caster_joint" type="fixed">
    <parent link="base_link"/>
    <child link="caster"/>
    <origin xyz="-0.2 0 -0.15" rpy="0 0 0"/>
  </joint>

</robot>
```

### Visualizing in RViz

**launch/view_robot.launch.py**:
```python
from launch import LaunchDescription
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue
from launch.substitutions import Command
import os
from ament_index_python.packages import get_package_share_directory


def generate_launch_description():
    pkg_dir = get_package_share_directory('my_robot_description')
    urdf_file = os.path.join(pkg_dir, 'urdf', 'robot.urdf')

    # Robot State Publisher
    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        parameters=[{
            'robot_description': ParameterValue(
                Command(['cat ', urdf_file]),
                value_type=str
            )
        }]
    )

    # Joint State Publisher GUI
    joint_state_publisher_gui = Node(
        package='joint_state_publisher_gui',
        executable='joint_state_publisher_gui'
    )

    # RViz
    rviz = Node(
        package='rviz2',
        executable='rviz2',
        arguments=['-d', os.path.join(pkg_dir, 'rviz', 'robot.rviz')]
    )

    return LaunchDescription([
        robot_state_publisher,
        joint_state_publisher_gui,
        rviz,
    ])
```

---

## 2.4 Joint Types

### Available Joint Types

**1. Fixed**
```xml
<joint name="camera_joint" type="fixed">
  <parent link="base_link"/>
  <child link="camera_link"/>
  <origin xyz="0.3 0 0.2" rpy="0 0 0"/>
</joint>
```
- No movement
- Rigidly connects links

**2. Revolute (Hinge)**
```xml
<joint name="elbow_joint" type="revolute">
  <parent link="upper_arm"/>
  <child link="forearm"/>
  <origin xyz="0 0 0.3" rpy="0 0 0"/>
  <axis xyz="0 1 0"/>
  <limit lower="-2.0" upper="2.0" effort="10.0" velocity="1.0"/>
</joint>
```
- Rotation around axis
- Limited range

**3. Continuous**
```xml
<joint name="wheel_joint" type="continuous">
  <parent link="base_link"/>
  <child link="wheel"/>
  <origin xyz="0.2 0 -0.1" rpy="0 0 0"/>
  <axis xyz="0 1 0"/>
</joint>
```
- Unlimited rotation
- Like revolute without limits

**4. Prismatic (Slider)**
```xml
<joint name="lift_joint" type="prismatic">
  <parent link="base_link"/>
  <child link="platform"/>
  <origin xyz="0 0 0.5" rpy="0 0 0"/>
  <axis xyz="0 0 1"/>
  <limit lower="0.0" upper="1.0" effort="100.0" velocity="0.5"/>
</joint>
```
- Linear motion along axis

**5. Floating**
```xml
<joint name="floating_joint" type="floating">
  <parent link="world"/>
  <child link="base_link"/>
</joint>
```
- 6 DOF (degrees of freedom)
- Unconstrained motion

**6. Planar**
```xml
<joint name="planar_joint" type="planar">
  <parent link="world"/>
  <child link="base_link"/>
  <axis xyz="0 0 1"/>
</joint>
```
- Motion in a plane
- 3 DOF (x, y, rotation)

---

## 2.5 Calculating Inertia

### Why Inertia Matters

Incorrect inertia causes:
- Unrealistic motion
- Simulation instability
- Poor controller performance

### Inertia Formulas

**Box (width w, height h, depth d):**
```
Ixx = (1/12) * m * (h² + d²)
Iyy = (1/12) * m * (w² + d²)
Izz = (1/12) * m * (w² + h²)
```

**Cylinder (radius r, height h, axis along z):**
```
Ixx = Iyy = (1/12) * m * (3r² + h²)
Izz = (1/2) * m * r²
```

**Sphere (radius r):**
```
Ixx = Iyy = Izz = (2/5) * m * r²
```

### Python Helper Script

```python
#!/usr/bin/env python3
"""Calculate inertia tensors for common shapes."""

import numpy as np


def box_inertia(mass, width, height, depth):
    """Calculate inertia for a box."""
    ixx = (1/12) * mass * (height**2 + depth**2)
    iyy = (1/12) * mass * (width**2 + depth**2)
    izz = (1/12) * mass * (width**2 + height**2)
    return ixx, iyy, izz


def cylinder_inertia(mass, radius, height):
    """Calculate inertia for a cylinder (axis along z)."""
    ixx = iyy = (1/12) * mass * (3 * radius**2 + height**2)
    izz = 0.5 * mass * radius**2
    return ixx, iyy, izz


def sphere_inertia(mass, radius):
    """Calculate inertia for a sphere."""
    i = (2/5) * mass * radius**2
    return i, i, i


# Example usage
if __name__ == '__main__':
    # Robot base (box: 0.6m x 0.4m x 0.2m, 5kg)
    ixx, iyy, izz = box_inertia(5.0, 0.6, 0.4, 0.2)
    print(f"Base inertia: ixx={ixx:.4f}, iyy={iyy:.4f}, izz={izz:.4f}")

    # Wheel (cylinder: r=0.1m, h=0.05m, 0.5kg)
    ixx, iyy, izz = cylinder_inertia(0.5, 0.1, 0.05)
    print(f"Wheel inertia: ixx={ixx:.4f}, iyy={iyy:.4f}, izz={izz:.4f}")
```

---

## 2.6 Using Meshes

### Mesh File Formats

Supported formats:
- **STL**: Simple, widely supported
- **DAE (Collada)**: Supports materials, textures
- **OBJ**: Common, good for complex models

### Adding Meshes to URDF

```xml
<link name="body">
  <visual>
    <geometry>
      <mesh filename="package://my_robot_description/meshes/body.dae" scale="1 1 1"/>
    </geometry>
  </visual>

  <collision>
    <!-- Use simplified collision mesh -->
    <geometry>
      <mesh filename="package://my_robot_description/meshes/body_collision.stl"/>
    </geometry>
  </collision>
</link>
```

### Best Practices for Meshes

**Visual Meshes:**
- ✅ High detail for appearance
- ✅ Include textures and materials
- ✅ Optimize polygon count (< 10k triangles)

**Collision Meshes:**
- ✅ Simplified geometry
- ✅ Convex shapes preferred
- ✅ Use primitive shapes when possible
- ❌ Avoid high polygon count

---

## 2.7 Gazebo-Specific URDF Extensions

### Adding Gazebo Tags

```xml
<?xml version="1.0"?>
<robot name="my_robot">

  <!-- Regular URDF links and joints -->
  <link name="base_link">
    <!-- ... -->
  </link>

  <!-- Gazebo-specific properties -->
  <gazebo reference="base_link">
    <material>Gazebo/Blue</material>
    <mu1>0.8</mu1>  <!-- Friction coefficient 1 -->
    <mu2>0.8</mu2>  <!-- Friction coefficient 2 -->
    <kp>1000000.0</kp>  <!-- Contact stiffness -->
    <kd>1.0</kd>  <!-- Contact damping -->
  </gazebo>

  <!-- Differential drive plugin -->
  <gazebo>
    <plugin name="differential_drive_controller" filename="libgazebo_ros_diff_drive.so">
      <ros>
        <namespace>/robot</namespace>
      </ros>

      <!-- Wheel joints -->
      <left_joint>left_wheel_joint</left_joint>
      <right_joint>right_wheel_joint</right_joint>

      <!-- Kinematics -->
      <wheel_separation>0.45</wheel_separation>
      <wheel_diameter>0.2</wheel_diameter>

      <!-- Limits -->
      <max_wheel_torque>20</max_wheel_torque>
      <max_wheel_acceleration>1.0</max_wheel_acceleration>

      <!-- Output -->
      <publish_odom>true</publish_odom>
      <publish_odom_tf>true</publish_odom_tf>
      <publish_wheel_tf>true</publish_wheel_tf>

      <odometry_frame>odom</odometry_frame>
      <robot_base_frame>base_link</robot_base_frame>
    </plugin>
  </gazebo>

</robot>
```

---

## 2.8 SDF Format

### SDF Structure

```xml
<?xml version="1.0"?>
<sdf version="1.6">
  <model name="my_robot">

    <!-- Links -->
    <link name="base_link">
      <pose>0 0 0.1 0 0 0</pose>

      <inertial>
        <mass>5.0</mass>
        <inertia>
          <ixx>0.0833</ixx>
          <iyy>0.1667</iyy>
          <izz>0.2167</izz>
          <ixy>0</ixy>
          <ixz>0</ixz>
          <iyz>0</iyz>
        </inertia>
      </inertial>

      <collision name="collision">
        <geometry>
          <box>
            <size>0.6 0.4 0.2</size>
          </box>
        </geometry>
        <surface>
          <friction>
            <ode>
              <mu>0.8</mu>
              <mu2>0.8</mu2>
            </ode>
          </friction>
        </surface>
      </collision>

      <visual name="visual">
        <geometry>
          <box>
            <size>0.6 0.4 0.2</size>
          </box>
        </geometry>
        <material>
          <ambient>0 0 0.8 1</ambient>
          <diffuse>0 0 0.8 1</diffuse>
        </material>
      </visual>
    </link>

    <!-- Joints -->
    <joint name="left_wheel_joint" type="revolute">
      <parent>base_link</parent>
      <child>left_wheel</child>
      <pose>0 0 0 0 0 0</pose>
      <axis>
        <xyz>0 1 0</xyz>
        <dynamics>
          <damping>0.1</damping>
          <friction>0.1</friction>
        </dynamics>
      </axis>
    </joint>

    <!-- Plugins -->
    <plugin name="diff_drive" filename="libgazebo_ros_diff_drive.so">
      <!-- Plugin configuration -->
    </plugin>

  </model>
</sdf>
```

### SDF Advantages

- **Multiple models** in one file
- **Closed kinematic loops**
- **Advanced physics** properties
- **Native Gazebo** format

---

## 2.9 URDF to SDF Conversion

### Automatic Conversion

Gazebo automatically converts URDF to SDF:

```bash
# Check conversion
gz sdf -p robot.urdf > robot.sdf
```

### Manual Conversion Tips

**URDF:**
```xml
<origin xyz="0.1 0 0" rpy="0 0 1.57"/>
```

**SDF:**
```xml
<pose>0.1 0 0 0 0 1.57</pose>
```

**URDF:**
```xml
<inertia ixx="0.1" ixy="0" ixz="0" iyy="0.1" iyz="0" izz="0.1"/>
```

**SDF:**
```xml
<inertia>
  <ixx>0.1</ixx>
  <iyy>0.1</iyy>
  <izz>0.1</izz>
  <ixy>0</ixy>
  <ixz>0</ixz>
  <iyz>0</iyz>
</inertia>
```

---

## 2.10 Xacro: URDF Macros

### Why Xacro?

URDF files get repetitive. **Xacro** adds:
- Variables
- Macros
- Math operations
- File includes

### Xacro Example

**robot.urdf.xacro**:
```xml
<?xml version="1.0"?>
<robot xmlns:xacro="http://www.ros.org/wiki/xacro" name="my_robot">

  <!-- Properties (variables) -->
  <xacro:property name="wheel_radius" value="0.1"/>
  <xacro:property name="wheel_width" value="0.05"/>
  <xacro:property name="wheel_mass" value="0.5"/>
  <xacro:property name="base_width" value="0.4"/>

  <!-- Macro for wheels -->
  <xacro:macro name="wheel" params="prefix reflect">
    <link name="${prefix}_wheel">
      <visual>
        <geometry>
          <cylinder radius="${wheel_radius}" length="${wheel_width}"/>
        </geometry>
        <origin xyz="0 0 0" rpy="${pi/2} 0 0"/>
        <material name="black">
          <color rgba="0 0 0 1"/>
        </material>
      </visual>

      <collision>
        <geometry>
          <cylinder radius="${wheel_radius}" length="${wheel_width}"/>
        </geometry>
        <origin xyz="0 0 0" rpy="${pi/2} 0 0"/>
      </collision>

      <inertial>
        <mass value="${wheel_mass}"/>
        <origin xyz="0 0 0" rpy="${pi/2} 0 0"/>
        <inertia ixx="${(1/12) * wheel_mass * (3*wheel_radius*wheel_radius + wheel_width*wheel_width)}"
                 iyy="${(1/12) * wheel_mass * (3*wheel_radius*wheel_radius + wheel_width*wheel_width)}"
                 izz="${(1/2) * wheel_mass * wheel_radius * wheel_radius}"
                 ixy="0" ixz="0" iyz="0"/>
      </inertial>
    </link>

    <joint name="${prefix}_wheel_joint" type="continuous">
      <parent link="base_link"/>
      <child link="${prefix}_wheel"/>
      <origin xyz="0.15 ${reflect * base_width/2} -0.1" rpy="0 0 0"/>
      <axis xyz="0 1 0"/>
    </joint>
  </xacro:macro>

  <!-- Base link -->
  <link name="base_link">
    <!-- ... -->
  </link>

  <!-- Instantiate wheels -->
  <xacro:wheel prefix="left" reflect="1"/>
  <xacro:wheel prefix="right" reflect="-1"/>

</robot>
```

### Converting Xacro to URDF

```bash
# Convert xacro to URDF
ros2 run xacro xacro robot.urdf.xacro > robot.urdf

# Or in launch file
robot_description = Command(['xacro ', urdf_xacro_file])
```

---

## 2.11 Learning Objectives

By completing this chapter, you should be able to:

### Knowledge Objectives
- [ ] **Explain** the difference between URDF and SDF
- [ ] **List** all joint types and their uses
- [ ] **Describe** the components of a link

### Comprehension Objectives
- [ ] **Understand** how to calculate inertia tensors
- [ ] **Compare** visual vs collision geometry
- [ ] **Explain** when to use Xacro

### Application Objectives
- [ ] **Create** a complete robot URDF
- [ ] **Calculate** correct inertial properties
- [ ] **Use** Xacro macros for reusable components
- [ ] **Visualize** robots in RViz

---

## 2.12 Key Takeaways

:::tip Essential Concepts
1. **URDF** describes robot structure for ROS; **SDF** for Gazebo

2. **Links** are rigid bodies; **joints** connect them

3. **Inertial properties** must be accurate for realistic simulation

4. **Collision geometry** should be simpler than visual geometry

5. **Xacro** reduces repetition with variables and macros

6. **Gazebo tags** add simulation-specific properties
:::

---

## 2.13 Hands-On Project

### Project: Create Your Own Robot

**Requirements**:
1. Mobile base with differential drive
2. At least 3 links
3. 2 continuous joints (wheels)
4. 1 revolute joint (sensor mount)
5. Proper inertial properties
6. Gazebo plugins for control

**Deliverables**:
- URDF file
- Launch file for RViz visualization
- Launch file for Gazebo simulation
- README with robot specifications

---

## Next Steps

In the next chapter, we'll add **sensors and physics simulation** to make our robots interact realistically with the environment!

---

## Further Reading

- [URDF Tutorials](http://wiki.ros.org/urdf/Tutorials)
- [SDF Specification](http://sdformat.org/spec)
- [Xacro Documentation](http://wiki.ros.org/xacro)
- [URDF in Gazebo](http://gazebosim.org/tutorials?tut=ros_urdf)

---

**Chapter 2 Complete! ✅**

You can now create detailed robot descriptions for simulation and visualization!
