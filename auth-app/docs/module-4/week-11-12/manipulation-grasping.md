

# Chapter 3: Manipulation and Grasping with Humanoid Hands

## Overview

Humanoid hands enable dexterous manipulation similar to humans. This chapter covers grasp types, force control, in-hand manipulation, tactile sensing, and AI-powered grasping for humanoid robots.

:::info Learning Time
**Estimated Reading Time**: 60-70 minutes
**Hands-on Activities**: 45 minutes
**Total Chapter Time**: 2 hours
:::

---

## 3.1 Humanoid Hand Design

### Anthropomorphic Hands

**Typical Configuration:**
- **5 fingers**: Thumb + 4 fingers
- **15-20 DOF total**
  - Thumb: 4-5 DOF
  - Index/Middle/Ring/Pinky: 3-4 DOF each
- **Sensors**: Force, tactile, position

**Examples:**
- **Shadow Dexterous Hand**: 20 DOF, pneumatic
- **Allegro Hand**: 16 DOF, electric motors
- **LEAP Hand**: Low-cost, 16 DOF
- **Tesla Optimus Hand**: 11 DOF per hand

---

## 3.2 Grasp Taxonomy

### Power vs. Precision Grasps

**Power Grasps** (whole hand):
- Cylindrical (holding bottle)
- Spherical (holding ball)
- Hook (carrying bag)

**Precision Grasps** (fingertips):
- Pinch (two-finger)
- Tripod (three-finger)
- Lateral (thumb-side of index)

```python
class GraspType:
    """Enumeration of grasp types"""
    POWER_CYLINDRICAL = "power_cylindrical"
    POWER_SPHERICAL = "power_spherical"
    PRECISION_PINCH = "precision_pinch"
    PRECISION_TRIPOD = "precision_tripod"
    LATERAL = "lateral"

def select_grasp_type(object_shape, object_size, task):
    """
    Select appropriate grasp based on object and task

    Args:
        object_shape: 'cylinder', 'sphere', 'box', etc.
        object_size: diameter/width in meters
        task: 'lift', 'manipulate', 'handover', etc.

    Returns:
        GraspType
    """
    if task == 'lift' and object_size > 0.05:
        # Large object, need power grasp
        if object_shape == 'cylinder':
            return GraspType.POWER_CYLINDRICAL
        elif object_shape == 'sphere':
            return GraspType.POWER_SPHERICAL

    elif task == 'manipulate' or object_size < 0.03:
        # Small object or dexterous task
        return GraspType.PRECISION_PINCH

    return GraspType.POWER_CYLINDRICAL  # Default
```

---

## 3.3 Grasp Planning

### Contact Point Selection

**Grasp Quality Metrics:**
1. **Force closure**: Can resist arbitrary forces
2. **Form closure**: Geometric constraint
3. **Grasp wrench space**: Set of achievable forces/torques

```python
import numpy as np

class GraspPlanner:
    def __init__(self, hand_model):
        self.hand = hand_model

    def plan_parallel_jaw_grasp(self, object_mesh):
        """
        Plan grasp for parallel-jaw gripper

        Returns:
            grasp_pose, grasp_width
        """
        # Find antipodal grasp points
        grasp_candidates = []

        for point1 in object_mesh.vertices:
            # Cast ray through object
            ray_direction = object_mesh.compute_normal(point1)

            # Find opposite point
            point2 = self.raycast(object_mesh, point1, ray_direction)

            if point2 is not None:
                # Compute grasp quality
                quality = self.evaluate_grasp_quality(point1, point2, object_mesh)

                grasp_candidates.append({
                    'point1': point1,
                    'point2': point2,
                    'quality': quality,
                    'width': np.linalg.norm(point2 - point1)
                })

        # Select best grasp
        best_grasp = max(grasp_candidates, key=lambda g: g['quality'])

        return best_grasp

    def plan_multi_finger_grasp(self, object_mesh, num_fingers=3):
        """
        Plan grasp for multi-fingered hand
        """
        # Sample contact points on object surface
        contact_candidates = self.sample_surface_points(object_mesh, n=1000)

        # Find best combination of contact points
        best_grasp = None
        best_quality = 0

        from itertools import combinations

        for contacts in combinations(contact_candidates, num_fingers):
            # Check force closure
            if self.is_force_closure(contacts, object_mesh):
                quality = self.compute_grasp_wrench_space(contacts)

                if quality > best_quality:
                    best_quality = quality
                    best_grasp = contacts

        return best_grasp, best_quality

    def is_force_closure(self, contacts, object_mesh):
        """
        Check if contact points provide force closure
        """
        # Simplified check: contacts should span 3D space
        if len(contacts) < 4:
            return False

        # Compute contact normals
        normals = [object_mesh.compute_normal(c) for c in contacts]

        # Check if normals span 3D space (rank = 3)
        normal_matrix = np.array(normals).T
        rank = np.linalg.matrix_rank(normal_matrix)

        return rank == 3

    def evaluate_grasp_quality(self, point1, point2, object_mesh):
        """
        Evaluate grasp quality (simplified)
        """
        # Factors:
        # 1. Distance from center of mass
        com = object_mesh.center_of_mass
        midpoint = (point1 + point2) / 2
        com_distance = np.linalg.norm(midpoint - com)

        # 2. Alignment with principal axes
        # 3. Friction cone constraints
        # ...

        # Simplified: prefer grasps near CoM
        quality = 1.0 / (1.0 + com_distance)

        return quality
```

---

## 3.4 Force Control

### Impedance Control

**Control both position and force:**

```python
class ImpedanceController:
    def __init__(self, K_p=100, K_d=20, K_f=0.1):
        """
        Impedance controller

        Args:
            K_p: Position stiffness
            K_d: Damping
            K_f: Force feedback gain
        """
        self.K_p = K_p
        self.K_d = K_d
        self.K_f = K_f

    def compute_torque(self, q, q_dot, q_desired, f_measured, f_desired):
        """
        Compute joint torques for impedance control

        Args:
            q: current joint positions
            q_dot: current joint velocities
            q_desired: desired joint positions
            f_measured: measured contact force
            f_desired: desired contact force

        Returns:
            tau: joint torques
        """
        # Position error
        pos_error = q_desired - q

        # Velocity (damping)
        vel_term = -self.K_d * q_dot

        # Force error
        force_error = f_desired - f_measured

        # Combined torque
        tau = self.K_p * pos_error + vel_term + self.K_f * force_error

        return tau

# Usage
controller = ImpedanceController(K_p=50, K_d=10, K_f=0.5)

# Grasp with 5N force
q_current = robot.get_joint_positions()
q_dot_current = robot.get_joint_velocities()
q_desired = np.array([0.5, 0.5, 0.5])  # Closed position
f_measured = robot.get_force_sensor()
f_desired = 5.0  # Newtons

tau = controller.compute_torque(
    q_current, q_dot_current, q_desired, f_measured, f_desired
)

robot.set_joint_torques(tau)
```

---

## 3.5 Tactile Sensing

### Fingertip Sensors

**Sensor Types:**
- **Force/Torque**: 6-axis load cells
- **Tactile Arrays**: Pressure distribution
- **Slip Detection**: Vibration sensors

```python
class TactileSensor:
    def __init__(self, resolution=(16, 16)):
        self.resolution = resolution
        self.tactile_image = np.zeros(resolution)

    def read_tactile_image(self):
        """
        Read tactile sensor array

        Returns:
            2D array of pressure values
        """
        # In real system, read from hardware
        # Here, simulated
        return self.tactile_image

    def detect_contact(self, threshold=0.1):
        """
        Detect if object is in contact
        """
        max_pressure = np.max(self.tactile_image)
        return max_pressure > threshold

    def detect_slip(self, previous_image, current_image):
        """
        Detect slip by comparing tactile images
        """
        # Compute optical flow or correlation
        diff = np.abs(current_image - previous_image)
        slip_magnitude = np.sum(diff)

        # Threshold
        is_slipping = slip_magnitude > 0.5

        return is_slipping, slip_magnitude

    def estimate_contact_force(self):
        """
        Estimate total contact force from tactile array
        """
        total_force = np.sum(self.tactile_image)
        return total_force

# Usage
sensor = TactileSensor()

# Grasp loop with slip detection
previous_tactile = sensor.read_tactile_image()

while True:
    current_tactile = sensor.read_tactile_image()

    # Check for slip
    is_slipping, slip_mag = sensor.detect_slip(previous_tactile, current_tactile)

    if is_slipping:
        print(f"Slip detected! Magnitude: {slip_mag:.2f}")
        # Increase grip force
        robot.increase_grip_force(delta=1.0)

    previous_tactile = current_tactile
    time.sleep(0.01)
```

---

## 3.6 In-Hand Manipulation

### Dexterous Reorientation

**Techniques:**
1. **Finger gaiting**: Move fingers sequentially
2. **Rolling**: Roll object on fingertips
3. **Pivoting**: Rotate around contact point

```python
class InHandManipulator:
    def __init__(self, hand):
        self.hand = hand

    def rotate_object(self, target_angle, axis='z'):
        """
        Rotate grasped object around axis

        Args:
            target_angle: desired rotation (radians)
            axis: 'x', 'y', or 'z'
        """
        current_angle = 0

        while abs(current_angle - target_angle) > 0.01:
            # Finger gaiting strategy
            # 1. Release one finger
            # 2. Move it to new position
            # 3. Re-grasp
            # 4. Repeat with other fingers

            for finger_id in range(self.hand.num_fingers):
                # Release finger
                self.hand.open_finger(finger_id, amount=0.1)

                # Compute new finger position
                rotation_increment = 0.1  # radians
                new_position = self.compute_rotated_position(
                    finger_id, rotation_increment, axis
                )

                # Move finger
                self.hand.move_finger(finger_id, new_position)

                # Re-grasp
                self.hand.close_finger(finger_id)

                current_angle += rotation_increment

                if abs(current_angle - target_angle) < 0.01:
                    break

    def compute_rotated_position(self, finger_id, angle, axis):
        """
        Compute new finger position after rotation
        """
        # Get current finger position
        current_pos = self.hand.get_finger_position(finger_id)

        # Rotation matrix
        if axis == 'z':
            R = np.array([
                [np.cos(angle), -np.sin(angle), 0],
                [np.sin(angle),  np.cos(angle), 0],
                [0,              0,             1]
            ])
        # ... other axes

        # Apply rotation
        new_pos = R @ current_pos

        return new_pos
```

---

## 3.7 Learning-Based Grasping

### Deep Learning for Grasp Prediction

**GraspNet Architecture:**
```python
import torch
import torch.nn as nn

class GraspNet(nn.Module):
    def __init__(self):
        super().__init__()

        # Point cloud encoder (PointNet-like)
        self.encoder = nn.Sequential(
            nn.Conv1d(3, 64, 1),
            nn.ReLU(),
            nn.Conv1d(64, 128, 1),
            nn.ReLU(),
            nn.Conv1d(128, 256, 1),
            nn.ReLU()
        )

        # Global feature
        self.global_pool = nn.AdaptiveMaxPool1d(1)

        # Grasp predictor
        self.grasp_head = nn.Sequential(
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 7)  # x, y, z, qx, qy, qz, qw
        )

        # Quality predictor
        self.quality_head = nn.Sequential(
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

    def forward(self, point_cloud):
        """
        Predict grasp pose and quality

        Args:
            point_cloud: (batch, 3, num_points)

        Returns:
            grasp_pose: (batch, 7) - position + quaternion
            quality: (batch, 1) - success probability
        """
        # Encode point cloud
        features = self.encoder(point_cloud)

        # Global feature
        global_feat = self.global_pool(features).squeeze(-1)

        # Predict grasp
        grasp_pose = self.grasp_head(global_feat)
        quality = self.quality_head(global_feat)

        return grasp_pose, quality

# Training
model = GraspNet()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

for epoch in range(100):
    for point_clouds, grasp_labels, success_labels in dataloader:
        # Forward pass
        predicted_grasps, predicted_quality = model(point_clouds)

        # Loss
        grasp_loss = nn.MSELoss()(predicted_grasps, grasp_labels)
        quality_loss = nn.BCELoss()(predicted_quality, success_labels)

        loss = grasp_loss + quality_loss

        # Backward pass
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    print(f"Epoch {epoch}, Loss: {loss.item():.4f}")

# Inference
point_cloud = get_object_point_cloud()
grasp_pose, quality = model(point_cloud)

if quality > 0.8:
    execute_grasp(grasp_pose)
```

---

## 3.8 Bimanual Manipulation

### Coordinating Two Hands

**Tasks:**
- Opening a bottle
- Folding cloth
- Assembling parts

```python
class BimanualController:
    def __init__(self, left_hand, right_hand):
        self.left = left_hand
        self.right = right_hand

    def open_bottle(self, bottle_pose):
        """
        Coordinate hands to open bottle
        """
        # Phase 1: Grasp bottle with left hand
        self.left.move_to_grasp(bottle_pose)
        self.left.close_gripper()

        # Phase 2: Grasp cap with right hand
        cap_pose = self.compute_cap_pose(bottle_pose)
        self.right.move_to_grasp(cap_pose)
        self.right.close_gripper()

        # Phase 3: Coordinate twist motion
        # Left hand: hold steady
        # Right hand: rotate

        for angle in np.linspace(0, np.pi, 50):
            # Right hand rotates
            self.right.rotate_wrist(angle)

            # Left hand compensates to keep bottle steady
            left_torque = self.compute_compensation_torque(angle)
            self.left.apply_torque(left_torque)

            time.sleep(0.02)

        # Phase 4: Release
        self.right.open_gripper()
        self.left.open_gripper()

    def fold_cloth(self, cloth_corners):
        """
        Fold cloth using both hands
        """
        # Grasp opposite corners
        self.left.move_to_grasp(cloth_corners[0])
        self.right.move_to_grasp(cloth_corners[2])

        self.left.close_gripper()
        self.right.close_gripper()

        # Bring hands together (fold)
        midpoint = (cloth_corners[0] + cloth_corners[2]) / 2

        # Synchronized motion
        for t in np.linspace(0, 1, 100):
            left_target = cloth_corners[0] + t * (midpoint - cloth_corners[0])
            right_target = cloth_corners[2] + t * (midpoint - cloth_corners[2])

            self.left.move_to(left_target)
            self.right.move_to(right_target)

            time.sleep(0.01)
```

---

## 3.9 Learning Objectives

By completing this chapter, you should be able to:

### Knowledge Objectives
- [ ] **Explain** power vs. precision grasps
- [ ] **Describe** grasp quality metrics
- [ ] **List** tactile sensing modalities

### Application Objectives
- [ ] **Plan** grasps for different objects
- [ ] **Implement** force control for grasping
- [ ] **Use** tactile feedback for slip detection
- [ ] **Train** deep learning models for grasping

---

## 3.10 Key Takeaways

:::tip Essential Concepts
1. **Grasp selection** depends on object shape, size, and task

2. **Force closure** ensures stable grasps

3. **Impedance control** regulates both position and force

4. **Tactile sensing** enables slip detection and force estimation

5. **In-hand manipulation** requires coordinated finger movements

6. **Learning-based methods** can predict grasps from point clouds

7. **Bimanual coordination** enables complex manipulation tasks
:::

---

## Next Steps

In the final chapter, we'll explore **Natural Human-Robot Interaction Design**!

---

## Further Reading

- [Robotics: Modelling, Planning and Control (Siciliano et al.)](https://www.springer.com/gp/book/9781846286414)
- [GraspNet-1Billion](https://graspnet.net/)
- [Contact-GraspNet](https://github.com/NVlabs/contact_graspnet)

---

**Chapter 3 Complete! ✅**
