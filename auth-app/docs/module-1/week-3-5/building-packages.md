

# Chapter 3: Building ROS 2 Packages with Python

## Overview

A well-structured ROS 2 package is the foundation of maintainable robot software. This chapter teaches you how to create professional-quality ROS 2 packages with proper organization, dependencies, custom messages, and testing.

:::info Learning Time
**Estimated Reading Time**: 50-60 minutes
**Hands-on Activities**: 45 minutes
**Total Chapter Time**: 1.5-2 hours
:::

---

## 3.1 Package Structure Deep Dive

### Anatomy of a ROS 2 Python Package

```
my_robot_package/
├── my_robot_package/          # Python module (same name as package)
│   ├── __init__.py           # Makes it a Python package
│   ├── node1.py              # Node implementations
│   ├── node2.py
│   ├── utils/                # Utility modules
│   │   ├── __init__.py
│   │   ├── math_utils.py
│   │   └── robot_utils.py
│   └── config/               # Configuration files
│       └── default_params.yaml
├── launch/                    # Launch files
│   ├── robot_bringup.launch.py
│   └── simulation.launch.py
├── config/                    # Parameter files
│   ├── robot_params.yaml
│   └── controller_params.yaml
├── test/                      # Unit tests
│   ├── test_node1.py
│   └── test_utils.py
├── resource/                  # Package marker
│   └── my_robot_package
├── package.xml               # Package metadata
├── setup.py                  # Python package setup
├── setup.cfg                 # Setup configuration
└── README.md                 # Documentation
```

### File Purposes

| File/Directory | Purpose |
|----------------|---------|
| `package.xml` | ROS package metadata, dependencies |
| `setup.py` | Python package configuration, entry points |
| `setup.cfg` | Install directories configuration |
| `resource/` | Package marker for ROS 2 tools |
| `my_robot_package/` | Python module with node code |
| `launch/` | Launch file scripts |
| `config/` | Parameter YAML files |
| `test/` | Unit and integration tests |

---

## 3.2 Creating a Package from Scratch

### Step 1: Create Package

```bash
# Navigate to workspace src directory
cd ~/ros2_ws/src

# Create package with dependencies
ros2 pkg create --build-type ament_python my_robot_package \
  --dependencies rclpy std_msgs geometry_msgs sensor_msgs tf2_ros

# Package structure is created automatically
```

### Step 2: Configure package.xml

**package.xml** - Complete example:

```xml
<?xml version="1.0"?>
<?xml-model href="http://download.ros.org/schema/package_format3.xsd"
  schematypens="http://www.w3.org/2001/XMLSchema"?>
<package format="3">
  <name>my_robot_package</name>
  <version>1.0.0</version>
  <description>
    A comprehensive robot control package with navigation and manipulation
  </description>

  <maintainer email="your.email@example.com">Your Name</maintainer>
  <license>Apache-2.0</license>

  <url type="website">https://github.com/yourusername/my_robot_package</url>
  <url type="bugtracker">https://github.com/yourusername/my_robot_package/issues</url>
  <url type="repository">https://github.com/yourusername/my_robot_package</url>

  <author email="your.email@example.com">Your Name</author>

  <!-- Build tool -->
  <buildtool_depend>ament_python</buildtool_depend>

  <!-- Runtime dependencies -->
  <depend>rclpy</depend>
  <depend>std_msgs</depend>
  <depend>geometry_msgs</depend>
  <depend>sensor_msgs</depend>
  <depend>tf2_ros</depend>
  <depend>nav_msgs</depend>

  <!-- Execution dependencies (Python packages) -->
  <exec_depend>python3-numpy</exec_depend>
  <exec_depend>python3-opencv</exec_depend>

  <!-- Test dependencies -->
  <test_depend>ament_copyright</test_depend>
  <test_depend>ament_flake8</test_depend>
  <test_depend>ament_pep257</test_depend>
  <test_depend>python3-pytest</test_depend>

  <export>
    <build_type>ament_python</build_type>
  </export>
</package>
```

**Dependency Types:**
- `<buildtool_depend>`: Tools needed to build (e.g., `ament_python`)
- `<depend>`: Both build and runtime dependencies
- `<build_depend>`: Only needed during build
- `<exec_depend>`: Only needed at runtime
- `<test_depend>`: Only needed for testing

### Step 3: Configure setup.py

**setup.py** - Complete example:

```python
from setuptools import setup
from glob import glob
import os

package_name = 'my_robot_package'

setup(
    name=package_name,
    version='1.0.0',
    packages=[package_name, f'{package_name}.utils'],
    data_files=[
        # Package marker
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),

        # Package.xml
        ('share/' + package_name, ['package.xml']),

        # Launch files
        (os.path.join('share', package_name, 'launch'),
            glob('launch/*.launch.py')),

        # Config files
        (os.path.join('share', package_name, 'config'),
            glob('config/*.yaml')),

        # URDF files (if any)
        (os.path.join('share', package_name, 'urdf'),
            glob('urdf/*.urdf')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='Your Name',
    maintainer_email='your.email@example.com',
    description='A comprehensive robot control package',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            # Format: 'executable_name = package.module:function'
            'robot_controller = my_robot_package.robot_controller:main',
            'sensor_processor = my_robot_package.sensor_processor:main',
            'path_planner = my_robot_package.path_planner:main',
            'state_publisher = my_robot_package.state_publisher:main',
        ],
    },
)
```

**Key Points:**
- `packages`: List all Python packages to install
- `data_files`: Non-Python files (launch, config, URDF)
- `entry_points`: Executable scripts (what you run with `ros2 run`)

### Step 4: Configure setup.cfg

**setup.cfg**:

```ini
[develop]
script_dir=$base/lib/my_robot_package

[install]
install_scripts=$base/lib/my_robot_package
```

This ensures executables are installed in the correct location.

---

## 3.3 Organizing Code Effectively

### Multi-File Package Structure

**my_robot_package/__init__.py**:
```python
"""
My Robot Package - A comprehensive robot control system.

This package provides nodes for:
- Robot control and navigation
- Sensor data processing
- Path planning
- State management
"""

__version__ = '1.0.0'
__author__ = 'Your Name'
```

**my_robot_package/robot_controller.py**:
```python
#!/usr/bin/env python3
"""
Robot Controller Node

Subscribes to sensor data and publishes velocity commands.
"""

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan
from my_robot_package.utils.robot_utils import calculate_safe_velocity


class RobotController(Node):
    """Main robot controller node."""

    def __init__(self):
        super().__init__('robot_controller')

        # Declare parameters
        self.declare_parameter('max_linear_speed', 0.5)
        self.declare_parameter('max_angular_speed', 1.0)
        self.declare_parameter('safety_distance', 0.5)

        # Get parameters
        self.max_linear = self.get_parameter('max_linear_speed').value
        self.max_angular = self.get_parameter('max_angular_speed').value
        self.safety_dist = self.get_parameter('safety_distance').value

        # Publishers
        self.cmd_vel_pub = self.create_publisher(
            Twist, 'cmd_vel', 10
        )

        # Subscribers
        self.scan_sub = self.create_subscription(
            LaserScan, 'scan', self.scan_callback, 10
        )

        self.get_logger().info('Robot Controller initialized')

    def scan_callback(self, msg):
        """Process laser scan and publish velocity commands."""
        # Use utility function
        velocity = calculate_safe_velocity(
            msg, self.safety_dist, self.max_linear
        )

        cmd = Twist()
        cmd.linear.x = velocity
        self.cmd_vel_pub.publish(cmd)


def main(args=None):
    rclpy.init(args=args)
    node = RobotController()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
```

**my_robot_package/utils/robot_utils.py**:
```python
"""
Robot utility functions.
"""

import numpy as np
from sensor_msgs.msg import LaserScan


def calculate_safe_velocity(scan: LaserScan, safety_distance: float,
                            max_velocity: float) -> float:
    """
    Calculate safe forward velocity based on laser scan.

    Args:
        scan: LaserScan message
        safety_distance: Minimum safe distance (meters)
        max_velocity: Maximum allowed velocity (m/s)

    Returns:
        Safe velocity (m/s)
    """
    # Get minimum distance in front
    ranges = np.array(scan.ranges)
    ranges = ranges[np.isfinite(ranges)]  # Remove inf/nan

    if len(ranges) == 0:
        return 0.0

    min_distance = np.min(ranges)

    # Linear scaling: full speed at 2x safety distance, zero at safety distance
    if min_distance < safety_distance:
        return 0.0
    elif min_distance > 2 * safety_distance:
        return max_velocity
    else:
        # Linear interpolation
        ratio = (min_distance - safety_distance) / safety_distance
        return max_velocity * ratio


def normalize_angle(angle: float) -> float:
    """
    Normalize angle to [-pi, pi].

    Args:
        angle: Angle in radians

    Returns:
        Normalized angle
    """
    while angle > np.pi:
        angle -= 2 * np.pi
    while angle < -np.pi:
        angle += 2 * np.pi
    return angle
```

---

## 3.4 Custom Messages and Services

### Creating Custom Message Definitions

**Step 1: Create a separate interface package**

```bash
ros2 pkg create --build-type ament_cmake my_robot_interfaces
```

**Step 2: Create message files**

**my_robot_interfaces/msg/RobotStatus.msg**:
```
# Robot status message

# Header with timestamp
std_msgs/Header header

# Robot state
string robot_name
uint8 battery_level        # 0-100%
float32 temperature        # Celsius
bool is_moving
geometry_msgs/Pose current_pose

# Constants for status
uint8 STATUS_IDLE = 0
uint8 STATUS_MOVING = 1
uint8 STATUS_ERROR = 2
uint8 status
```

**my_robot_interfaces/msg/SensorData.msg**:
```
# Aggregated sensor data

std_msgs/Header header

# LiDAR data
float32[] laser_ranges
float32 laser_min_angle
float32 laser_max_angle

# Camera data
sensor_msgs/Image camera_image
bool camera_available

# IMU data
geometry_msgs/Vector3 linear_acceleration
geometry_msgs/Vector3 angular_velocity
```

**Step 3: Create service definitions**

**my_robot_interfaces/srv/SetRobotMode.srv**:
```
# Request
string mode  # "idle", "autonomous", "manual"
---
# Response
bool success
string message
```

**Step 4: Configure CMakeLists.txt**

```cmake
cmake_minimum_required(VERSION 3.8)
project(my_robot_interfaces)

# Find dependencies
find_package(ament_cmake REQUIRED)
find_package(rosidl_default_generators REQUIRED)
find_package(std_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(sensor_msgs REQUIRED)

# Generate interfaces
rosidl_generate_interfaces(${PROJECT_NAME}
  "msg/RobotStatus.msg"
  "msg/SensorData.msg"
  "srv/SetRobotMode.srv"
  DEPENDENCIES std_msgs geometry_msgs sensor_msgs
)

ament_package()
```

**Step 5: Configure package.xml**

```xml
<buildtool_depend>ament_cmake</buildtool_depend>
<buildtool_depend>rosidl_default_generators</buildtool_depend>

<depend>std_msgs</depend>
<depend>geometry_msgs</depend>
<depend>sensor_msgs</depend>

<member_of_group>rosidl_interface_packages</member_of_group>

<exec_depend>rosidl_default_runtime</exec_depend>
```

**Step 6: Build and use**

```bash
# Build the interface package
colcon build --packages-select my_robot_interfaces

# Source the workspace
source install/setup.bash

# Use in your Python code
from my_robot_interfaces.msg import RobotStatus
from my_robot_interfaces.srv import SetRobotMode
```

---

## 3.5 Workspace Management

### Multi-Package Workspace

```
ros2_ws/
├── src/
│   ├── my_robot_interfaces/    # Custom messages/services
│   ├── my_robot_driver/         # Hardware drivers
│   ├── my_robot_control/        # Control algorithms
│   ├── my_robot_navigation/     # Navigation stack
│   └── my_robot_simulation/     # Gazebo simulation
├── build/
├── install/
└── log/
```

### Building Strategies

```bash
# Build all packages
colcon build

# Build specific packages
colcon build --packages-select my_robot_control

# Build package and dependencies
colcon build --packages-up-to my_robot_navigation

# Build with symlink install (for Python development)
colcon build --symlink-install

# Build with debug symbols
colcon build --cmake-args -DCMAKE_BUILD_TYPE=Debug

# Parallel build (faster)
colcon build --parallel-workers 4

# Clean build
rm -rf build install log
colcon build
```

### Workspace Overlays

```bash
# Underlay workspace (e.g., ROS 2 installation)
source /opt/ros/humble/setup.bash

# Overlay workspace (your workspace)
source ~/ros2_ws/install/setup.bash

# Check which packages are in overlay
ros2 pkg list | grep my_robot
```

---

## 3.6 Testing Your Package

### Unit Tests with pytest

**test/test_robot_utils.py**:
```python
"""
Unit tests for robot_utils module.
"""

import pytest
import numpy as np
from sensor_msgs.msg import LaserScan
from my_robot_package.utils.robot_utils import (
    calculate_safe_velocity,
    normalize_angle
)


def test_normalize_angle():
    """Test angle normalization."""
    assert abs(normalize_angle(0.0)) < 1e-6
    assert abs(normalize_angle(np.pi) - np.pi) < 1e-6
    assert abs(normalize_angle(-np.pi) - (-np.pi)) < 1e-6
    assert abs(normalize_angle(3 * np.pi) - np.pi) < 1e-6
    assert abs(normalize_angle(-3 * np.pi) - (-np.pi)) < 1e-6


def test_calculate_safe_velocity():
    """Test safe velocity calculation."""
    # Create mock laser scan
    scan = LaserScan()
    scan.ranges = [1.0] * 360  # All ranges at 1.0m

    # Test case 1: Safe distance
    velocity = calculate_safe_velocity(scan, 0.5, 1.0)
    assert velocity == 1.0  # Should be max velocity

    # Test case 2: Too close
    scan.ranges = [0.3] * 360
    velocity = calculate_safe_velocity(scan, 0.5, 1.0)
    assert velocity == 0.0  # Should stop

    # Test case 3: Intermediate distance
    scan.ranges = [0.75] * 360
    velocity = calculate_safe_velocity(scan, 0.5, 1.0)
    assert 0.0 < velocity < 1.0  # Should be scaled


def test_calculate_safe_velocity_with_inf():
    """Test handling of infinite ranges."""
    scan = LaserScan()
    scan.ranges = [float('inf')] * 360

    velocity = calculate_safe_velocity(scan, 0.5, 1.0)
    assert velocity == 0.0  # Should handle gracefully
```

### Integration Tests

**test/test_robot_controller.py**:
```python
"""
Integration tests for RobotController node.
"""

import pytest
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan
from my_robot_package.robot_controller import RobotController


@pytest.fixture
def robot_controller():
    """Create a RobotController node for testing."""
    rclpy.init()
    node = RobotController()
    yield node
    node.destroy_node()
    rclpy.shutdown()


def test_node_creation(robot_controller):
    """Test that node is created successfully."""
    assert robot_controller.get_name() == 'robot_controller'


def test_publishers_created(robot_controller):
    """Test that publishers are created."""
    publishers = robot_controller.get_publisher_names_and_types_by_node(
        'robot_controller', ''
    )
    assert any('cmd_vel' in pub for pub in publishers)


def test_parameters_declared(robot_controller):
    """Test that parameters are declared."""
    params = robot_controller.get_parameters([
        'max_linear_speed',
        'max_angular_speed',
        'safety_distance'
    ])
    assert len(params) == 3
    assert all(p.value is not None for p in params)
```

### Running Tests

```bash
# Run all tests
colcon test --packages-select my_robot_package

# View test results
colcon test-result --verbose

# Run specific test file
pytest test/test_robot_utils.py

# Run with coverage
pytest --cov=my_robot_package test/
```

---

## 3.7 Documentation Best Practices

### README.md Template

```markdown
# My Robot Package

A comprehensive ROS 2 package for robot control and navigation.

## Features

- Autonomous navigation
- Sensor data processing
- Safety monitoring
- Configurable parameters

## Dependencies

- ROS 2 Humble or later
- Python 3.8+
- NumPy
- OpenCV

## Installation

```bash
cd ~/ros2_ws/src
git clone https://github.com/yourusername/my_robot_package.git
cd ~/ros2_ws
rosdep install --from-paths src --ignore-src -r -y
colcon build --packages-select my_robot_package
```

## Usage

### Basic Usage

```bash
# Run robot controller
ros2 run my_robot_package robot_controller

# With custom parameters
ros2 run my_robot_package robot_controller --ros-args \
  -p max_linear_speed:=1.0 \
  -p safety_distance:=0.8
```

### Launch Files

```bash
# Launch complete system
ros2 launch my_robot_package robot_bringup.launch.py
```

## Configuration

Parameters can be set in `config/robot_params.yaml`:

```yaml
robot_controller:
  ros__parameters:
    max_linear_speed: 0.5
    max_angular_speed: 1.0
    safety_distance: 0.5
```

## Nodes

### robot_controller

**Subscribed Topics:**
- `/scan` (sensor_msgs/LaserScan): Laser scan data

**Published Topics:**
- `/cmd_vel` (geometry_msgs/Twist): Velocity commands

**Parameters:**
- `max_linear_speed` (double, default: 0.5): Maximum forward speed
- `max_angular_speed` (double, default: 1.0): Maximum turning speed
- `safety_distance` (double, default: 0.5): Minimum safe distance

## Testing

```bash
colcon test --packages-select my_robot_package
colcon test-result --verbose
```

## License

Apache 2.0

## Maintainer

Your Name (your.email@example.com)
```

### Inline Documentation

```python
def complex_function(param1: float, param2: str, param3: bool = False) -> dict:
    """
    Brief description of what the function does.

    Longer description with more details about the algorithm,
    edge cases, and important notes.

    Args:
        param1: Description of param1 (units if applicable)
        param2: Description of param2
        param3: Description of param3 (default: False)

    Returns:
        Dictionary containing:
            - 'result': The computed result
            - 'status': Success status (bool)
            - 'message': Status message (str)

    Raises:
        ValueError: If param1 is negative
        RuntimeError: If computation fails

    Example:
        >>> result = complex_function(1.5, "test", True)
        >>> print(result['status'])
        True
    """
    pass
```

---

## 3.8 Best Practices

### Code Organization

**✅ DO:**
- One node per file
- Group related utilities in modules
- Use meaningful names
- Keep files under 500 lines

**❌ DON'T:**
- Put multiple nodes in one file
- Mix unrelated functionality
- Use cryptic abbreviations
- Create monolithic files

### Dependency Management

**✅ DO:**
- Declare all dependencies in `package.xml`
- Use specific version ranges when needed
- Document external Python dependencies
- Use `rosdep` for system dependencies

**❌ DON'T:**
- Forget to declare dependencies
- Use undeclared packages
- Hard-code paths to other packages

### Parameter Management

**✅ DO:**
- Declare all parameters with defaults
- Use descriptive parameter names
- Group related parameters
- Document parameter units and ranges

**❌ DON'T:**
- Use magic numbers in code
- Change parameters without declaring
- Use inconsistent naming

---

## 3.9 Learning Objectives

By completing this chapter, you should be able to:

### Knowledge Objectives
- [ ] **Understand** ROS 2 package structure
- [ ] **Explain** the purpose of package.xml and setup.py
- [ ] **Describe** how to create custom messages and services
- [ ] **List** best practices for package organization

### Comprehension Objectives
- [ ] **Compare** different dependency types
- [ ] **Understand** workspace overlays
- [ ] **Explain** the build process with colcon

### Application Objectives
- [ ] **Create** a well-structured ROS 2 package
- [ ] **Implement** custom messages and services
- [ ] **Write** unit and integration tests
- [ ] **Document** packages professionally

---

## 3.10 Key Takeaways

:::tip Essential Concepts
1. **Package structure** follows a standard layout with clear separation of code, config, and tests

2. **package.xml** declares metadata and dependencies; **setup.py** configures Python installation

3. **Custom messages** require a separate CMake package with rosidl

4. **Workspace overlays** allow you to extend and override packages

5. **Testing** is essential - use pytest for unit tests and integration tests

6. **Documentation** should include README, inline comments, and docstrings
:::

:::warning Common Mistakes
- ❌ Forgetting to add entry_points in setup.py
- ❌ Not declaring dependencies in package.xml
- ❌ Mixing interface definitions with implementation
- ❌ Not using --symlink-install during development
- ❌ Skipping tests and documentation
:::

---

## 3.11 Hands-On Project

### Project: Complete Robot Package

Create a complete package with:

**1. Package Structure**
- Main controller node
- Sensor processing node
- Utility modules
- Custom messages
- Launch files
- Tests

**2. Custom Interface Package**
- `RobotStatus` message
- `SetMode` service
- `NavigateToGoal` action

**3. Documentation**
- Complete README
- Inline documentation
- Parameter documentation

**4. Testing**
- Unit tests for utilities
- Integration tests for nodes
- 80%+ code coverage

---

## Next Steps

In the next chapter, we'll learn about **Launch Files and Parameter Management** to orchestrate complex multi-node systems.

---

## Further Reading

- [ROS 2 Package Creation](https://docs.ros.org/en/humble/Tutorials/Beginner-Client-Libraries/Creating-Your-First-ROS2-Package.html)
- [Custom Interfaces](https://docs.ros.org/en/humble/Tutorials/Beginner-Client-Libraries/Custom-ROS2-Interfaces.html)
- [Python Testing](https://docs.pytest.org/)
- [Colcon Documentation](https://colcon.readthedocs.io/)

---

**Chapter 3 Complete! ✅**

You now know how to create professional, well-structured ROS 2 packages with proper organization, testing, and documentation.
