

# Chapter 4: Launch Files and Parameter Management

## Overview

Launch files are the orchestration layer of ROS 2 systems, allowing you to start multiple nodes, set parameters, and configure complex robot applications with a single command. This chapter teaches you to create powerful, flexible launch configurations.

:::info Learning Time
**Estimated Reading Time**: 50-60 minutes
**Hands-on Activities**: 40 minutes
**Total Chapter Time**: 1.5-2 hours
:::

---

## 4.1 Why Launch Files?

### The Problem

Without launch files:
```bash
# Terminal 1
ros2 run my_robot_package robot_controller --ros-args -p max_speed:=1.0

# Terminal 2
ros2 run my_robot_package sensor_processor --ros-args -p rate:=10.0

# Terminal 3
ros2 run my_robot_package path_planner

# Terminal 4
ros2 run my_robot_package state_publisher

# ... and many more!
```

**Issues:**
- ❌ Tedious to start manually
- ❌ Error-prone (typos, forgotten parameters)
- ❌ Hard to reproduce configurations
- ❌ Difficult to share with team

### The Solution

With launch files:
```bash
# One command starts everything!
ros2 launch my_robot_package robot_bringup.launch.py
```

**Benefits:**
- ✅ Start entire system with one command
- ✅ Consistent, reproducible configurations
- ✅ Easy to share and version control
- ✅ Conditional logic and dynamic configuration

---

## 4.2 Launch File Basics

### Creating Your First Launch File

**launch/simple_launch.py**:
```python
from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    """
    Launch file that starts a single node.
    """
    return LaunchDescription([
        Node(
            package='my_robot_package',
            executable='robot_controller',
            name='robot_controller',
            output='screen',
            parameters=[{
                'max_linear_speed': 0.5,
                'max_angular_speed': 1.0,
                'safety_distance': 0.5
            }]
        )
    ])
```

### Running the Launch File

```bash
# Make sure package is built
colcon build --packages-select my_robot_package

# Source workspace
source install/setup.bash

# Run launch file
ros2 launch my_robot_package simple_launch.py
```

### Launch File Structure

```python
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    # This function MUST return a LaunchDescription
    return LaunchDescription([
        # List of actions (nodes, includes, etc.)
        Node(...),
        Node(...),
    ])
```

---

## 4.3 Node Configuration

### Basic Node Declaration

```python
Node(
    package='my_robot_package',      # Package name
    executable='robot_controller',   # Executable name (from setup.py)
    name='robot_controller',         # Node name (can differ from executable)
    namespace='robot1',              # Optional namespace
    output='screen',                 # 'screen' or 'log'
    parameters=[{...}],              # Parameters
    remappings=[...],                # Topic remappings
    arguments=[...],                 # Command-line arguments
)
```

### Multiple Nodes

**launch/multi_node_launch.py**:
```python
from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    """Launch multiple nodes."""

    # Controller node
    controller_node = Node(
        package='my_robot_package',
        executable='robot_controller',
        name='robot_controller',
        output='screen',
        parameters=[{
            'max_linear_speed': 0.5,
            'safety_distance': 0.5
        }]
    )

    # Sensor processor node
    sensor_node = Node(
        package='my_robot_package',
        executable='sensor_processor',
        name='sensor_processor',
        output='screen',
        parameters=[{
            'update_rate': 10.0,
            'filter_size': 5
        }]
    )

    # Path planner node
    planner_node = Node(
        package='my_robot_package',
        executable='path_planner',
        name='path_planner',
        output='screen'
    )

    return LaunchDescription([
        controller_node,
        sensor_node,
        planner_node,
    ])
```

---

## 4.4 Parameter Management

### Method 1: Inline Parameters

```python
Node(
    package='my_robot_package',
    executable='robot_controller',
    parameters=[{
        'max_speed': 1.0,
        'robot_name': 'atlas',
        'debug_mode': True,
        'waypoints': [1.0, 2.0, 3.0]  # Arrays supported
    }]
)
```

### Method 2: YAML Parameter Files

**config/robot_params.yaml**:
```yaml
robot_controller:
  ros__parameters:
    max_linear_speed: 0.5
    max_angular_speed: 1.0
    safety_distance: 0.5
    robot_name: "atlas"
    debug_mode: false

sensor_processor:
  ros__parameters:
    update_rate: 10.0
    filter_size: 5
    sensor_topics:
      - "/scan"
      - "/camera/image_raw"
      - "/imu/data"
```

**Using YAML in launch file**:
```python
import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    # Get package directory
    pkg_dir = get_package_share_directory('my_robot_package')

    # Path to parameter file
    params_file = os.path.join(pkg_dir, 'config', 'robot_params.yaml')

    controller_node = Node(
        package='my_robot_package',
        executable='robot_controller',
        name='robot_controller',
        parameters=[params_file]  # Load from YAML
    )

    return LaunchDescription([controller_node])
```

### Method 3: Combining YAML and Inline

```python
Node(
    package='my_robot_package',
    executable='robot_controller',
    parameters=[
        params_file,  # Load from YAML
        {
            'max_speed': 2.0,  # Override specific parameters
            'debug_mode': True
        }
    ]
)
```

---

## 4.5 Launch Arguments

### Declaring Launch Arguments

```python
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    # Declare arguments
    use_sim_time_arg = DeclareLaunchArgument(
        'use_sim_time',
        default_value='false',
        description='Use simulation time'
    )

    robot_name_arg = DeclareLaunchArgument(
        'robot_name',
        default_value='atlas',
        description='Name of the robot'
    )

    max_speed_arg = DeclareLaunchArgument(
        'max_speed',
        default_value='0.5',
        description='Maximum robot speed (m/s)'
    )

    # Use arguments
    controller_node = Node(
        package='my_robot_package',
        executable='robot_controller',
        parameters=[{
            'use_sim_time': LaunchConfiguration('use_sim_time'),
            'robot_name': LaunchConfiguration('robot_name'),
            'max_speed': LaunchConfiguration('max_speed'),
        }]
    )

    return LaunchDescription([
        use_sim_time_arg,
        robot_name_arg,
        max_speed_arg,
        controller_node,
    ])
```

### Using Launch Arguments

```bash
# Use defaults
ros2 launch my_robot_package robot_launch.py

# Override arguments
ros2 launch my_robot_package robot_launch.py use_sim_time:=true

# Multiple arguments
ros2 launch my_robot_package robot_launch.py \
  robot_name:=optimus \
  max_speed:=1.5 \
  use_sim_time:=true
```

---

## 4.6 Conditional Execution

### If/Unless Conditions

```python
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.conditions import IfCondition, UnlessCondition
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    # Declare argument
    use_rviz_arg = DeclareLaunchArgument(
        'use_rviz',
        default_value='true',
        description='Start RViz for visualization'
    )

    # Node that runs only if use_rviz is true
    rviz_node = Node(
        package='rviz2',
        executable='rviz2',
        name='rviz2',
        condition=IfCondition(LaunchConfiguration('use_rviz'))
    )

    # Node that runs only if use_rviz is false
    headless_node = Node(
        package='my_robot_package',
        executable='headless_mode',
        name='headless',
        condition=UnlessCondition(LaunchConfiguration('use_rviz'))
    )

    return LaunchDescription([
        use_rviz_arg,
        rviz_node,
        headless_node,
    ])
```

---

## 4.7 Topic Remapping

### Basic Remapping

```python
Node(
    package='my_robot_package',
    executable='sensor_processor',
    remappings=[
        ('/input_scan', '/robot1/scan'),
        ('/output_points', '/robot1/processed_points'),
    ]
)
```

### Namespace + Remapping

```python
# Robot 1
robot1_controller = Node(
    package='my_robot_package',
    executable='robot_controller',
    name='controller',
    namespace='robot1',
    remappings=[
        ('scan', '/robot1/lidar/scan'),
        ('cmd_vel', '/robot1/cmd_vel'),
    ]
)

# Robot 2
robot2_controller = Node(
    package='my_robot_package',
    executable='robot_controller',
    name='controller',
    namespace='robot2',
    remappings=[
        ('scan', '/robot2/lidar/scan'),
        ('cmd_vel', '/robot2/cmd_vel'),
    ]
)
```

---

## 4.8 Including Other Launch Files

### Basic Include

```python
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from ament_index_python.packages import get_package_share_directory
import os


def generate_launch_description():
    # Get package directory
    pkg_dir = get_package_share_directory('my_robot_package')

    # Include another launch file
    sensors_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_dir, 'launch', 'sensors.launch.py')
        )
    )

    navigation_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_dir, 'launch', 'navigation.launch.py')
        )
    )

    return LaunchDescription([
        sensors_launch,
        navigation_launch,
    ])
```

### Include with Arguments

```python
sensors_launch = IncludeLaunchDescription(
    PythonLaunchDescriptionSource(
        os.path.join(pkg_dir, 'launch', 'sensors.launch.py')
    ),
    launch_arguments={
        'use_sim_time': 'true',
        'sensor_rate': '20.0',
    }.items()
)
```

---

## 4.9 Advanced Launch Techniques

### Group Actions

```python
from launch.actions import GroupAction
from launch_ros.actions import PushRosNamespace


def generate_launch_description():
    # Group nodes under a namespace
    robot1_group = GroupAction([
        PushRosNamespace('robot1'),
        Node(package='my_robot_package', executable='controller'),
        Node(package='my_robot_package', executable='sensor_processor'),
        Node(package='my_robot_package', executable='path_planner'),
    ])

    robot2_group = GroupAction([
        PushRosNamespace('robot2'),
        Node(package='my_robot_package', executable='controller'),
        Node(package='my_robot_package', executable='sensor_processor'),
        Node(package='my_robot_package', executable='path_planner'),
    ])

    return LaunchDescription([
        robot1_group,
        robot2_group,
    ])
```

### Event Handlers

```python
from launch import LaunchDescription
from launch.actions import RegisterEventHandler, LogInfo
from launch.event_handlers import OnProcessStart, OnProcessExit
from launch_ros.actions import Node


def generate_launch_description():
    controller_node = Node(
        package='my_robot_package',
        executable='robot_controller',
        name='controller'
    )

    # Log when controller starts
    on_start_handler = RegisterEventHandler(
        OnProcessStart(
            target_action=controller_node,
            on_start=[
                LogInfo(msg='Robot controller has started!')
            ]
        )
    )

    # Start another node when controller exits
    on_exit_handler = RegisterEventHandler(
        OnProcessExit(
            target_action=controller_node,
            on_exit=[
                LogInfo(msg='Robot controller has exited!'),
                Node(
                    package='my_robot_package',
                    executable='emergency_stop'
                )
            ]
        )
    )

    return LaunchDescription([
        controller_node,
        on_start_handler,
        on_exit_handler,
    ])
```

### Timed Actions

```python
from launch import LaunchDescription
from launch.actions import TimerAction
from launch_ros.actions import Node


def generate_launch_description():
    # Start controller immediately
    controller_node = Node(
        package='my_robot_package',
        executable='robot_controller'
    )

    # Start planner after 5 seconds
    delayed_planner = TimerAction(
        period=5.0,
        actions=[
            Node(
                package='my_robot_package',
                executable='path_planner'
            )
        ]
    )

    return LaunchDescription([
        controller_node,
        delayed_planner,
    ])
```

---

## 4.10 Complete Example: Robot Bringup

**launch/robot_bringup.launch.py**:
```python
#!/usr/bin/env python3
"""
Complete robot bringup launch file.

Starts all necessary nodes for robot operation with configurable parameters.
"""

import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import (
    DeclareLaunchArgument,
    IncludeLaunchDescription,
    LogInfo,
)
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    # Get package directories
    pkg_dir = get_package_share_directory('my_robot_package')

    # Paths
    params_file = os.path.join(pkg_dir, 'config', 'robot_params.yaml')
    rviz_config = os.path.join(pkg_dir, 'config', 'robot.rviz')

    # Declare arguments
    use_sim_time_arg = DeclareLaunchArgument(
        'use_sim_time',
        default_value='false',
        description='Use simulation time'
    )

    robot_name_arg = DeclareLaunchArgument(
        'robot_name',
        default_value='atlas',
        description='Robot name'
    )

    use_rviz_arg = DeclareLaunchArgument(
        'use_rviz',
        default_value='true',
        description='Start RViz'
    )

    params_file_arg = DeclareLaunchArgument(
        'params_file',
        default_value=params_file,
        description='Path to parameter file'
    )

    # Nodes
    robot_controller = Node(
        package='my_robot_package',
        executable='robot_controller',
        name='robot_controller',
        output='screen',
        parameters=[
            LaunchConfiguration('params_file'),
            {
                'use_sim_time': LaunchConfiguration('use_sim_time'),
                'robot_name': LaunchConfiguration('robot_name'),
            }
        ]
    )

    sensor_processor = Node(
        package='my_robot_package',
        executable='sensor_processor',
        name='sensor_processor',
        output='screen',
        parameters=[LaunchConfiguration('params_file')]
    )

    path_planner = Node(
        package='my_robot_package',
        executable='path_planner',
        name='path_planner',
        output='screen',
        parameters=[LaunchConfiguration('params_file')]
    )

    state_publisher = Node(
        package='my_robot_package',
        executable='state_publisher',
        name='state_publisher',
        output='screen'
    )

    # RViz (conditional)
    rviz_node = Node(
        package='rviz2',
        executable='rviz2',
        name='rviz2',
        arguments=['-d', rviz_config],
        condition=IfCondition(LaunchConfiguration('use_rviz'))
    )

    # Log info
    startup_log = LogInfo(
        msg=[
            'Starting robot: ',
            LaunchConfiguration('robot_name'),
            ' with sim_time=',
            LaunchConfiguration('use_sim_time')
        ]
    )

    return LaunchDescription([
        # Arguments
        use_sim_time_arg,
        robot_name_arg,
        use_rviz_arg,
        params_file_arg,

        # Log
        startup_log,

        # Nodes
        robot_controller,
        sensor_processor,
        path_planner,
        state_publisher,
        rviz_node,
    ])
```

**Usage**:
```bash
# Default configuration
ros2 launch my_robot_package robot_bringup.launch.py

# With custom arguments
ros2 launch my_robot_package robot_bringup.launch.py \
  robot_name:=optimus \
  use_sim_time:=true \
  use_rviz:=false

# With custom parameter file
ros2 launch my_robot_package robot_bringup.launch.py \
  params_file:=/path/to/custom_params.yaml
```

---

## 4.11 Parameter File Best Practices

### Organized YAML Structure

**config/complete_params.yaml**:
```yaml
# Robot Controller Parameters
robot_controller:
  ros__parameters:
    # Motion limits
    max_linear_speed: 0.5      # m/s
    max_angular_speed: 1.0     # rad/s
    acceleration_limit: 0.5    # m/s²

    # Safety
    safety_distance: 0.5       # meters
    emergency_stop_distance: 0.2

    # Control gains
    kp_linear: 1.0
    kp_angular: 2.0

    # Robot info
    robot_name: "atlas"
    robot_type: "humanoid"

# Sensor Processor Parameters
sensor_processor:
  ros__parameters:
    # Update rates
    lidar_rate: 10.0           # Hz
    camera_rate: 30.0          # Hz
    imu_rate: 100.0            # Hz

    # Filtering
    filter_size: 5
    outlier_threshold: 0.1

    # Topic names
    lidar_topic: "/scan"
    camera_topic: "/camera/image_raw"
    imu_topic: "/imu/data"

# Path Planner Parameters
path_planner:
  ros__parameters:
    # Planning
    planning_frequency: 1.0    # Hz
    goal_tolerance: 0.1        # meters

    # Algorithms
    planner_type: "A*"
    cost_function: "euclidean"

    # Constraints
    max_planning_time: 5.0     # seconds
    path_resolution: 0.05      # meters
```

### Environment-Specific Parameters

**config/simulation_params.yaml**:
```yaml
/**:
  ros__parameters:
    use_sim_time: true

robot_controller:
  ros__parameters:
    max_linear_speed: 2.0      # Faster in simulation
    safety_distance: 0.3       # Less conservative
```

**config/real_robot_params.yaml**:
```yaml
/**:
  ros__parameters:
    use_sim_time: false

robot_controller:
  ros__parameters:
    max_linear_speed: 0.5      # Slower on real hardware
    safety_distance: 0.8       # More conservative
```

---

## 4.12 Debugging Launch Files

### Common Issues and Solutions

**Issue 1: Node not found**
```
Error: Package 'my_robot_package' not found
```
**Solution**: Build and source workspace
```bash
colcon build --packages-select my_robot_package
source install/setup.bash
```

**Issue 2: Parameter file not found**
```
Error: Could not find parameter file
```
**Solution**: Check path and use `get_package_share_directory`
```python
pkg_dir = get_package_share_directory('my_robot_package')
params_file = os.path.join(pkg_dir, 'config', 'params.yaml')
```

**Issue 3: Parameters not loading**
```
Warning: Parameter 'max_speed' not declared
```
**Solution**: Declare parameter in node before using
```python
self.declare_parameter('max_speed', 0.5)
```

### Debugging Commands

```bash
# List all nodes
ros2 node list

# Check node parameters
ros2 param list /robot_controller

# Get parameter value
ros2 param get /robot_controller max_speed

# Check topics
ros2 topic list

# View launch file without running
ros2 launch --show-args my_robot_package robot_bringup.launch.py

# Print launch description
ros2 launch --print-description my_robot_package robot_bringup.launch.py
```

---

## 4.13 Learning Objectives

By completing this chapter, you should be able to:

### Knowledge Objectives
- [ ] **Explain** the purpose and benefits of launch files
- [ ] **Describe** different methods of parameter configuration
- [ ] **List** common launch file actions and conditions

### Comprehension Objectives
- [ ] **Understand** when to use YAML vs inline parameters
- [ ] **Compare** different launch file organization strategies
- [ ] **Explain** how launch arguments enable flexibility

### Application Objectives
- [ ] **Create** launch files for multi-node systems
- [ ] **Configure** parameters using YAML files
- [ ] **Implement** conditional node execution
- [ ] **Debug** launch file issues

---

## 4.14 Key Takeaways

:::tip Essential Concepts
1. **Launch files** orchestrate complex multi-node systems with a single command

2. **Parameters** can be set inline, from YAML files, or via launch arguments

3. **Launch arguments** make launch files flexible and reusable

4. **Conditional execution** allows different configurations for different scenarios

5. **Including launch files** enables modular system composition

6. **YAML parameter files** are the preferred method for complex configurations
:::

:::warning Best Practices
- ✅ Use YAML files for parameters (easier to maintain)
- ✅ Declare launch arguments with descriptions
- ✅ Organize parameters by node
- ✅ Use meaningful names for nodes and parameters
- ✅ Include comments in YAML files
- ❌ Don't hardcode values that might change
- ❌ Don't create monolithic launch files
:::

---

## 4.15 Hands-On Project

### Project: Complete Robot Launch System

Create a comprehensive launch system:

**1. Parameter Files**
- `config/robot_params.yaml` - Main parameters
- `config/simulation_params.yaml` - Simulation overrides
- `config/real_robot_params.yaml` - Real robot overrides

**2. Launch Files**
- `launch/sensors.launch.py` - All sensor nodes
- `launch/control.launch.py` - Control nodes
- `launch/navigation.launch.py` - Navigation stack
- `launch/robot_bringup.launch.py` - Complete system

**3. Features**
- Launch arguments for configuration
- Conditional RViz launching
- Environment-specific parameters
- Proper namespacing for multi-robot

**4. Documentation**
- README explaining all launch files
- Parameter documentation
- Usage examples

---

## Next Steps

**Congratulations!** You've completed Weeks 3-5: ROS 2 Fundamentals.

**You've learned**:
- ✅ ROS 2 architecture and DDS foundation
- ✅ Creating nodes, publishers, subscribers, services
- ✅ Building professional ROS 2 packages
- ✅ Launch files and parameter management

**Next**: In **Weeks 6-7**, we'll explore **Simulation with Gazebo and Unity** - creating digital twins of robots!

---

## Further Reading

- [ROS 2 Launch Documentation](https://docs.ros.org/en/humble/Tutorials/Intermediate/Launch/Launch-Main.html)
- [Launch File Architecture](https://design.ros2.org/articles/roslaunch.html)
- [Parameter YAML Format](https://docs.ros.org/en/humble/Concepts/About-ROS-2-Parameters.html)

---

**Chapter 4 Complete! ✅**

**Weeks 3-5 Complete! 🎉**

You now have a solid foundation in ROS 2 and can build, configure, and launch complex robotic systems!
