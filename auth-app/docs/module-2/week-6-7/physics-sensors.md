

# Chapter 3: Physics and Sensor Simulation

## Overview

Accurate physics and sensor simulation are crucial for developing robust robot algorithms. This chapter covers physics engines, contact dynamics, and simulating various sensors (cameras, LiDAR, IMU, force sensors) in Gazebo.

:::info Learning Time
**Estimated Reading Time**: 60-70 minutes
**Hands-on Activities**: 50 minutes
**Total Chapter Time**: 2 hours
:::

---

## 3.1 Physics Simulation Fundamentals

### Physics Engine Selection

Gazebo supports multiple physics engines, each with trade-offs:

**ODE (Open Dynamics Engine)**
- ✅ Fast, stable
- ✅ Good for most robotics
- ❌ Less accurate for complex contacts
- **Use for**: General mobile robots, manipulation

**Bullet**
- ✅ Excellent collision detection
- ✅ Good performance
- ❌ Can be unstable with small objects
- **Use for**: Complex environments, many objects

**Simbody**
- ✅ Very accurate
- ✅ Excellent for biomechanics
- ❌ Slower than ODE/Bullet
- **Use for**: Humanoid robots, precise dynamics

**DART**
- ✅ Fast and accurate
- ✅ Good constraint handling
- ❌ Newer, less documentation
- **Use for**: Advanced research, complex mechanisms

### Configuring Physics

**In world file:**
```xml
<physics type="ode">
  <!-- Simulation step -->
  <max_step_size>0.001</max_step_size>

  <!-- Real-time factor -->
  <real_time_factor>1.0</real_time_factor>
  <real_time_update_rate>1000</real_time_update_rate>

  <!-- Gravity -->
  <gravity>0 0 -9.81</gravity>

  <!-- ODE-specific -->
  <ode>
    <solver>
      <type>quick</type>
      <iters>50</iters>
      <sor>1.3</sor>
    </solver>

    <constraints>
      <cfm>0.0</cfm>
      <erp>0.2</erp>
      <contact_max_correcting_vel>100.0</contact_max_correcting_vel>
      <contact_surface_layer>0.001</contact_surface_layer>
    </constraints>
  </ode>
</physics>
```

**Key Parameters:**

| Parameter | Description | Typical Value |
|-----------|-------------|---------------|
| `max_step_size` | Time step (seconds) | 0.001 - 0.01 |
| `real_time_factor` | Speed multiplier | 1.0 (real-time) |
| `iters` | Solver iterations | 20-100 |
| `erp` | Error reduction parameter | 0.1-0.8 |
| `cfm` | Constraint force mixing | 0.0-0.01 |

---

## 3.2 Contact and Collision

### Contact Properties

**Surface friction:**
```xml
<gazebo reference="wheel_link">
  <mu1>1.0</mu1>  <!-- Friction coefficient (direction 1) -->
  <mu2>1.0</mu2>  <!-- Friction coefficient (direction 2) -->
  <kp>1000000.0</kp>  <!-- Contact stiffness -->
  <kd>1.0</kd>  <!-- Contact damping -->
  <minDepth>0.001</minDepth>  <!-- Minimum penetration -->
</gazebo>
```

**Material-specific friction:**
```xml
<gazebo reference="rubber_wheel">
  <mu1>1.5</mu1>  <!-- High friction (rubber) -->
  <mu2>1.5</mu2>
</gazebo>

<gazebo reference="ice_surface">
  <mu1>0.1</mu1>  <!-- Low friction (ice) -->
  <mu2>0.1</mu2>
</gazebo>
```

### Collision Detection

**Optimizing collision geometry:**
```xml
<link name="complex_body">
  <!-- High-detail visual -->
  <visual>
    <geometry>
      <mesh filename="package://my_robot/meshes/body_visual.dae"/>
    </geometry>
  </visual>

  <!-- Simplified collision -->
  <collision>
    <geometry>
      <!-- Use primitive shapes or simplified mesh -->
      <box size="0.5 0.3 0.2"/>
    </geometry>
  </collision>
</link>
```

**Best practices:**
- ✅ Use primitive shapes (box, cylinder, sphere) when possible
- ✅ Decompose complex shapes into convex hulls
- ✅ Keep collision meshes under 1000 triangles
- ❌ Avoid concave collision meshes

---

## 3.3 Camera Simulation

### RGB Camera

**URDF/Gazebo plugin:**
```xml
<gazebo reference="camera_link">
  <sensor type="camera" name="camera1">
    <update_rate>30.0</update_rate>

    <camera name="head">
      <horizontal_fov>1.3962634</horizontal_fov>  <!-- 80 degrees -->
      <image>
        <width>800</width>
        <height>600</height>
        <format>R8G8B8</format>
      </image>
      <clip>
        <near>0.02</near>
        <far>300</far>
      </clip>
      <noise>
        <type>gaussian</type>
        <mean>0.0</mean>
        <stddev>0.007</stddev>
      </noise>
    </camera>

    <plugin name="camera_controller" filename="libgazebo_ros_camera.so">
      <ros>
        <namespace>/robot</namespace>
        <remapping>image_raw:=camera/image_raw</remapping>
        <remapping>camera_info:=camera/camera_info</remapping>
      </ros>
      <camera_name>camera</camera_name>
      <frame_name>camera_link</frame_name>
      <hack_baseline>0.07</hack_baseline>
    </plugin>
  </sensor>
</gazebo>
```

**Viewing camera output:**
```bash
# View image in RViz
ros2 run rviz2 rviz2

# Or view with rqt
ros2 run rqt_image_view rqt_image_view /robot/camera/image_raw
```

### Depth Camera

**Intel RealSense-like depth camera:**
```xml
<gazebo reference="depth_camera_link">
  <sensor type="depth" name="depth_camera">
    <update_rate>20.0</update_rate>

    <camera>
      <horizontal_fov>1.047198</horizontal_fov>  <!-- 60 degrees -->
      <image>
        <width>640</width>
        <height>480</height>
        <format>R8G8B8</format>
      </image>
      <clip>
        <near>0.3</near>
        <far>10.0</far>
      </clip>
    </camera>

    <plugin name="depth_camera_controller" filename="libgazebo_ros_camera.so">
      <ros>
        <namespace>/robot</namespace>
      </ros>
      <camera_name>depth_camera</camera_name>
      <frame_name>depth_camera_link</frame_name>
      <hack_baseline>0.07</hack_baseline>
      <min_depth>0.3</min_depth>
      <max_depth>10.0</max_depth>
    </plugin>
  </sensor>
</gazebo>
```

**Topics published:**
- `/robot/depth_camera/image_raw` - RGB image
- `/robot/depth_camera/depth/image_raw` - Depth image
- `/robot/depth_camera/points` - Point cloud

---

## 3.4 LiDAR Simulation

### 2D LiDAR (Laser Scanner)

**Hokuyo-like 2D LiDAR:**
```xml
<gazebo reference="lidar_link">
  <sensor type="ray" name="lidar">
    <pose>0 0 0 0 0 0</pose>
    <visualize>true</visualize>
    <update_rate>10</update_rate>

    <ray>
      <scan>
        <horizontal>
          <samples>720</samples>
          <resolution>1</resolution>
          <min_angle>-3.14159</min_angle>  <!-- -180 degrees -->
          <max_angle>3.14159</max_angle>   <!-- +180 degrees -->
        </horizontal>
      </scan>

      <range>
        <min>0.10</min>
        <max>30.0</max>
        <resolution>0.01</resolution>
      </range>

      <noise>
        <type>gaussian</type>
        <mean>0.0</mean>
        <stddev>0.01</stddev>
      </noise>
    </ray>

    <plugin name="gazebo_ros_lidar" filename="libgazebo_ros_ray_sensor.so">
      <ros>
        <namespace>/robot</namespace>
        <remapping>~/out:=scan</remapping>
      </ros>
      <output_type>sensor_msgs/LaserScan</output_type>
      <frame_name>lidar_link</frame_name>
    </plugin>
  </sensor>
</gazebo>
```

### 3D LiDAR

**Velodyne-like 3D LiDAR:**
```xml
<gazebo reference="lidar_3d_link">
  <sensor type="ray" name="lidar_3d">
    <update_rate>10</update_rate>

    <ray>
      <scan>
        <horizontal>
          <samples>1024</samples>
          <resolution>1</resolution>
          <min_angle>-3.14159</min_angle>
          <max_angle>3.14159</max_angle>
        </horizontal>
        <vertical>
          <samples>16</samples>
          <resolution>1</resolution>
          <min_angle>-0.2618</min_angle>  <!-- -15 degrees -->
          <max_angle>0.2618</max_angle>   <!-- +15 degrees -->
        </vertical>
      </scan>

      <range>
        <min>0.5</min>
        <max>100.0</max>
        <resolution>0.01</resolution>
      </range>
    </ray>

    <plugin name="gazebo_ros_lidar_3d" filename="libgazebo_ros_ray_sensor.so">
      <ros>
        <namespace>/robot</namespace>
        <remapping>~/out:=points</remapping>
      </ros>
      <output_type>sensor_msgs/PointCloud2</output_type>
      <frame_name>lidar_3d_link</frame_name>
    </plugin>
  </sensor>
</gazebo>
```

---

## 3.5 IMU Simulation

### Inertial Measurement Unit

**IMU plugin:**
```xml
<gazebo reference="imu_link">
  <sensor name="imu_sensor" type="imu">
    <always_on>true</always_on>
    <update_rate>100</update_rate>

    <plugin name="imu_plugin" filename="libgazebo_ros_imu_sensor.so">
      <ros>
        <namespace>/robot</namespace>
        <remapping>~/out:=imu/data</remapping>
      </ros>
      <frame_name>imu_link</frame_name>

      <!-- Noise parameters -->
      <initial_orientation_as_reference>false</initial_orientation_as_reference>

      <!-- Accelerometer noise -->
      <gaussian_noise>0.01</gaussian_noise>

      <!-- Gyroscope noise -->
      <angular_velocity_stdev>0.001</angular_velocity_stdev>

      <!-- Orientation noise -->
      <orientation_stdev>0.01</orientation_stdev>
    </plugin>
  </sensor>
</gazebo>
```

**IMU data includes:**
- Orientation (quaternion)
- Angular velocity (rad/s)
- Linear acceleration (m/s²)

**Using IMU data:**
```python
#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Imu
import numpy as np


class IMUProcessor(Node):
    def __init__(self):
        super().__init__('imu_processor')

        self.subscription = self.create_subscription(
            Imu,
            '/robot/imu/data',
            self.imu_callback,
            10
        )

    def imu_callback(self, msg):
        # Extract orientation (quaternion)
        qx = msg.orientation.x
        qy = msg.orientation.y
        qz = msg.orientation.z
        qw = msg.orientation.w

        # Convert to Euler angles
        roll, pitch, yaw = self.quaternion_to_euler(qx, qy, qz, qw)

        # Extract angular velocity
        wx = msg.angular_velocity.x
        wy = msg.angular_velocity.y
        wz = msg.angular_velocity.z

        # Extract linear acceleration
        ax = msg.linear_acceleration.x
        ay = msg.linear_acceleration.y
        az = msg.linear_acceleration.z

        self.get_logger().info(
            f'Roll: {np.degrees(roll):.2f}°, '
            f'Pitch: {np.degrees(pitch):.2f}°, '
            f'Yaw: {np.degrees(yaw):.2f}°'
        )

    def quaternion_to_euler(self, x, y, z, w):
        """Convert quaternion to Euler angles (roll, pitch, yaw)."""
        # Roll (x-axis rotation)
        sinr_cosp = 2 * (w * x + y * z)
        cosr_cosp = 1 - 2 * (x * x + y * y)
        roll = np.arctan2(sinr_cosp, cosr_cosp)

        # Pitch (y-axis rotation)
        sinp = 2 * (w * y - z * x)
        if abs(sinp) >= 1:
            pitch = np.copysign(np.pi / 2, sinp)
        else:
            pitch = np.arcsin(sinp)

        # Yaw (z-axis rotation)
        siny_cosp = 2 * (w * z + x * y)
        cosy_cosp = 1 - 2 * (y * y + z * z)
        yaw = np.arctan2(siny_cosp, cosy_cosp)

        return roll, pitch, yaw


def main():
    rclpy.init()
    node = IMUProcessor()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
```

---

## 3.6 Force/Torque Sensors

### Contact Sensor

**Bumper/contact sensor:**
```xml
<gazebo reference="bumper_link">
  <sensor name="bumper" type="contact">
    <contact>
      <collision>bumper_collision</collision>
    </contact>
    <update_rate>10</update_rate>

    <plugin name="gazebo_ros_bumper" filename="libgazebo_ros_bumper.so">
      <ros>
        <namespace>/robot</namespace>
        <remapping>bumper_states:=bumper</remapping>
      </ros>
      <frame_name>bumper_link</frame_name>
    </plugin>
  </sensor>
</gazebo>
```

### Force/Torque Sensor

**6-axis F/T sensor:**
```xml
<gazebo reference="wrist_link">
  <sensor name="force_torque" type="force_torque">
    <update_rate>100</update_rate>

    <plugin name="gazebo_ros_ft" filename="libgazebo_ros_ft_sensor.so">
      <ros>
        <namespace>/robot</namespace>
        <remapping>~/out:=wrist_ft</remapping>
      </ros>
      <frame_name>wrist_link</frame_name>
    </plugin>
  </sensor>
</gazebo>
```

---

## 3.7 GPS Simulation

### GPS Sensor

**GPS plugin:**
```xml
<gazebo>
  <plugin name="gazebo_ros_gps" filename="libgazebo_ros_gps_sensor.so">
    <ros>
      <namespace>/robot</namespace>
      <remapping>~/out:=gps/fix</remapping>
    </ros>

    <update_rate>10</update_rate>
    <frame_name>base_link</frame_name>

    <!-- Reference coordinates (latitude, longitude) -->
    <reference_latitude>37.4275</reference_latitude>
    <reference_longitude>-122.1697</reference_longitude>
    <reference_altitude>0.0</reference_altitude>

    <!-- Noise -->
    <gaussian_noise>0.00001</gaussian_noise>
  </plugin>
</gazebo>
```

---

## 3.8 Sensor Noise Modeling

### Why Add Noise?

Real sensors are noisy. Simulation should reflect this:
- Test algorithm robustness
- Realistic performance expectations
- Better sim-to-real transfer

### Noise Types

**Gaussian Noise:**
```xml
<noise>
  <type>gaussian</type>
  <mean>0.0</mean>
  <stddev>0.01</stddev>  <!-- Standard deviation -->
</noise>
```

**Example noise levels:**

| Sensor | Typical Noise (stddev) |
|--------|------------------------|
| Camera | 0.007 (pixel intensity) |
| LiDAR | 0.01 m |
| IMU (accel) | 0.01 m/s² |
| IMU (gyro) | 0.001 rad/s |
| GPS | 0.00001° (lat/lon) |

---

## 3.9 Complete Sensor Suite Example

**Humanoid robot with full sensors:**
```xml
<?xml version="1.0"?>
<robot name="humanoid_robot">

  <!-- Base link and body structure -->
  <link name="base_link">
    <!-- ... -->
  </link>

  <!-- Head with cameras -->
  <link name="head">
    <!-- ... -->
  </link>

  <!-- Stereo cameras (eyes) -->
  <gazebo reference="left_eye">
    <sensor type="camera" name="left_camera">
      <update_rate>30</update_rate>
      <camera>
        <horizontal_fov>1.3962634</horizontal_fov>
        <image>
          <width>640</width>
          <height>480</height>
        </image>
        <clip>
          <near>0.02</near>
          <far>300</far>
        </clip>
      </camera>
      <plugin name="left_camera_controller" filename="libgazebo_ros_camera.so">
        <ros>
          <namespace>/robot</namespace>
          <remapping>image_raw:=left_camera/image_raw</remapping>
        </ros>
        <frame_name>left_eye</frame_name>
      </plugin>
    </sensor>
  </gazebo>

  <!-- LiDAR on head -->
  <gazebo reference="lidar_link">
    <sensor type="ray" name="head_lidar">
      <update_rate>10</update_rate>
      <ray>
        <scan>
          <horizontal>
            <samples>720</samples>
            <min_angle>-3.14159</min_angle>
            <max_angle>3.14159</max_angle>
          </horizontal>
        </scan>
        <range>
          <min>0.1</min>
          <max>30.0</max>
        </range>
      </ray>
      <plugin name="lidar_controller" filename="libgazebo_ros_ray_sensor.so">
        <ros>
          <namespace>/robot</namespace>
          <remapping>~/out:=scan</remapping>
        </ros>
        <output_type>sensor_msgs/LaserScan</output_type>
      </plugin>
    </sensor>
  </gazebo>

  <!-- IMU in torso -->
  <gazebo reference="torso">
    <sensor name="imu" type="imu">
      <always_on>true</always_on>
      <update_rate>100</update_rate>
      <plugin name="imu_plugin" filename="libgazebo_ros_imu_sensor.so">
        <ros>
          <namespace>/robot</namespace>
          <remapping>~/out:=imu/data</remapping>
        </ros>
        <frame_name>torso</frame_name>
      </plugin>
    </sensor>
  </gazebo>

  <!-- Force sensors in feet -->
  <gazebo reference="left_foot">
    <sensor name="left_foot_contact" type="contact">
      <contact>
        <collision>left_foot_collision</collision>
      </contact>
      <plugin name="left_foot_bumper" filename="libgazebo_ros_bumper.so">
        <ros>
          <namespace>/robot</namespace>
          <remapping>bumper_states:=left_foot/contact</remapping>
        </ros>
      </plugin>
    </sensor>
  </gazebo>

</robot>
```

---

## 3.10 Performance Optimization

### Sensor Optimization Tips

**1. Reduce update rates**
```xml
<!-- Instead of 30 Hz -->
<update_rate>30.0</update_rate>

<!-- Use 10 Hz if sufficient -->
<update_rate>10.0</update_rate>
```

**2. Lower camera resolution**
```xml
<!-- High resolution (slow) -->
<width>1920</width>
<height>1080</height>

<!-- Lower resolution (faster) -->
<width>640</width>
<height>480</height>
```

**3. Reduce LiDAR samples**
```xml
<!-- High density (slow) -->
<samples>1440</samples>

<!-- Lower density (faster) -->
<samples>360</samples>
```

**4. Disable visualization**
```xml
<visualize>false</visualize>  <!-- Don't show rays in GUI -->
```

---

## 3.11 Learning Objectives

By completing this chapter, you should be able to:

### Knowledge Objectives
- [ ] **Explain** different physics engines and their trade-offs
- [ ] **List** common sensor types and their properties
- [ ] **Describe** the importance of sensor noise

### Comprehension Objectives
- [ ] **Understand** contact and friction parameters
- [ ] **Compare** different sensor configurations
- [ ] **Explain** how to optimize sensor performance

### Application Objectives
- [ ] **Configure** physics parameters for realistic simulation
- [ ] **Add** cameras, LiDAR, and IMU to robots
- [ ] **Process** sensor data in ROS 2 nodes
- [ ] **Optimize** simulation performance

---

## 3.12 Key Takeaways

:::tip Essential Concepts
1. **Physics engines** balance accuracy and speed

2. **Contact parameters** (friction, stiffness) affect realism

3. **Sensors** should match real hardware specifications

4. **Noise modeling** improves sim-to-real transfer

5. **Update rates** significantly impact performance

6. **Simplified collision** geometry improves speed
:::

---

## 3.13 Hands-On Project

### Project: Sensor-Equipped Robot

**Create a robot with:**
1. RGB camera (front-facing)
2. 2D LiDAR (360° scan)
3. IMU (in torso)
4. Contact sensors (feet/bumpers)

**Implement:**
- ROS 2 nodes to process each sensor
- Visualization in RViz
- Data logging for analysis

**Test:**
- Navigate through obstacles
- Detect collisions
- Monitor orientation

---

## Next Steps

In the next chapter, we'll explore **Unity for robot visualization** - creating stunning 3D visualizations and alternative simulation environments!

---

## Further Reading

- [Gazebo Sensors](http://gazebosim.org/tutorials?cat=sensors)
- [Gazebo Physics](http://gazebosim.org/tutorials?cat=physics)
- [ROS 2 Sensor Drivers](https://index.ros.org/packages/)

---

**Chapter 3 Complete! ✅**

You can now create realistic physics simulations with comprehensive sensor suites!
