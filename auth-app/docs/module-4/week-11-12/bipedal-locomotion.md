

# Chapter 2: Bipedal Locomotion and Balance Control

## Overview

Bipedal locomotion is one of robotics' greatest challenges. This chapter covers walking gaits, balance control, Zero Moment Point (ZMP), Model Predictive Control (MPC), and state-of-the-art locomotion techniques for humanoid robots.

:::info Learning Time
**Estimated Reading Time**: 70-80 minutes
**Hands-on Activities**: 60 minutes
**Total Chapter Time**: 2-2.5 hours
:::

---

## 2.1 The Challenge of Bipedal Walking

### Why is Walking Hard?

**Humans make it look easy, but:**
- Inherently unstable (inverted pendulum)
- Underactuated system (can't directly control CoM)
- Hybrid dynamics (discrete contact events)
- High-dimensional state space
- Real-time requirements

**Walking vs. Wheeled Robots:**

| Aspect | Wheeled | Bipedal |
|--------|---------|---------|
| **Stability** | Statically stable | Dynamically stable |
| **Terrain** | Flat surfaces | Stairs, uneven ground |
| **Energy** | Efficient | Less efficient |
| **Complexity** | Low | Very high |
| **Human Spaces** | Limited | Full access |

---

## 2.2 Gait Phases

### Walking Cycle

```mermaid
graph LR
    A[Double Support] --> B[Single Support Left]
    B --> C[Double Support]
    C --> D[Single Support Right]
    D --> A
```

**Phases:**
1. **Double Support**: Both feet on ground (~20% of cycle)
2. **Single Support**: One foot on ground (~80% of cycle)
3. **Swing Phase**: Foot in air, moving forward
4. **Stance Phase**: Foot on ground, supporting weight

**Gait Parameters:**
- **Step length**: Distance between feet
- **Step height**: Maximum foot clearance
- **Step frequency**: Steps per second
- **Stride**: Full cycle (left + right step)

---

## 2.3 Zero Moment Point (ZMP)

### Balance Criterion

**ZMP Definition**: Point on the ground where net moment is zero.

**ZMP Stability:**
- ZMP inside support polygon → Stable
- ZMP on edge → Marginally stable
- ZMP outside → Falling

```python
import numpy as np

def compute_zmp(com_position, com_acceleration, height, g=9.81):
    """
    Compute Zero Moment Point

    Args:
        com_position: [x, y, z] CoM position
        com_acceleration: [ax, ay, az] CoM acceleration
        height: CoM height above ground
        g: gravity constant

    Returns:
        [x_zmp, y_zmp] ZMP position
    """
    x_com, y_com, z_com = com_position
    ax, ay, az = com_acceleration

    # ZMP equations
    x_zmp = x_com - (z_com / (az + g)) * ax
    y_zmp = y_com - (z_com / (az + g)) * ay

    return np.array([x_zmp, y_zmp])

# Example
com_pos = np.array([0.0, 0.0, 0.8])  # 80cm height
com_acc = np.array([0.5, 0.0, 0.0])  # Accelerating forward

zmp = compute_zmp(com_pos, com_acc, com_pos[2])
print(f"ZMP: {zmp}")
```

### Support Polygon

**Convex hull of contact points:**
```python
from scipy.spatial import ConvexHull

def compute_support_polygon(foot_contacts):
    """
    Compute support polygon from foot contact points

    Args:
        foot_contacts: List of [x, y] contact points

    Returns:
        ConvexHull object
    """
    points = np.array(foot_contacts)
    hull = ConvexHull(points)
    return hull

def is_zmp_stable(zmp, support_polygon):
    """
    Check if ZMP is inside support polygon
    """
    # Simple point-in-polygon test
    from matplotlib.path import Path

    polygon = Path(support_polygon.points[support_polygon.vertices])
    return polygon.contains_point(zmp)

# Example: Double support
left_foot = [
    [-0.05, 0.1],   # Left front
    [0.05, 0.1],    # Right front
    [0.05, -0.1],   # Right back
    [-0.05, -0.1]   # Left back
]

right_foot = [
    [-0.05, -0.1],
    [0.05, -0.1],
    [0.05, -0.3],
    [-0.05, -0.3]
]

all_contacts = left_foot + right_foot
support_poly = compute_support_polygon(all_contacts)

zmp = np.array([0.0, 0.0])
stable = is_zmp_stable(zmp, support_poly)
print(f"Stable: {stable}")
```

---

## 2.4 Linear Inverted Pendulum Model (LIPM)

### Simplified Walking Model

**Assumptions:**
- CoM at constant height
- Point mass at CoM
- Massless legs

**Dynamics:**
```
ẍ = (g/h) * (x - x_zmp)
ÿ = (g/h) * (y - y_zmp)

where:
  h = CoM height
  g = gravity
  x, y = CoM position
  x_zmp, y_zmp = ZMP position
```

**Python Implementation:**
```python
class LIPM:
    def __init__(self, com_height=0.8, g=9.81):
        self.h = com_height
        self.g = g
        self.omega = np.sqrt(g / com_height)

    def dynamics(self, state, zmp):
        """
        LIPM dynamics

        Args:
            state: [x, vx, y, vy] CoM state
            zmp: [x_zmp, y_zmp] ZMP position

        Returns:
            state_dot: time derivative of state
        """
        x, vx, y, vy = state
        x_zmp, y_zmp = zmp

        # Accelerations
        ax = self.omega**2 * (x - x_zmp)
        ay = self.omega**2 * (y - y_zmp)

        return np.array([vx, ax, vy, ay])

    def simulate_step(self, state, zmp, dt=0.01):
        """
        Simulate one time step (Euler integration)
        """
        state_dot = self.dynamics(state, zmp)
        new_state = state + state_dot * dt
        return new_state

    def simulate(self, initial_state, zmp_trajectory, dt=0.01):
        """
        Simulate full trajectory
        """
        states = [initial_state]

        for zmp in zmp_trajectory:
            new_state = self.simulate_step(states[-1], zmp, dt)
            states.append(new_state)

        return np.array(states)

# Usage
lipm = LIPM(com_height=0.8)

# Initial state: [x, vx, y, vy]
initial_state = np.array([0.0, 0.0, 0.0, 0.0])

# ZMP trajectory (moving forward)
t = np.linspace(0, 2, 200)
zmp_traj = np.column_stack([
    0.1 * np.sin(2*np.pi*t),  # x_zmp
    0.05 * np.ones_like(t)     # y_zmp
])

# Simulate
states = lipm.simulate(initial_state, zmp_traj)

# Plot
import matplotlib.pyplot as plt
plt.figure(figsize=(10, 4))
plt.plot(states[:, 0], label='CoM x')
plt.plot(zmp_traj[:, 0], label='ZMP x')
plt.legend()
plt.xlabel('Time step')
plt.ylabel('Position (m)')
plt.title('LIPM Simulation')
plt.show()
```

---

## 2.5 Footstep Planning

### Discrete Footstep Selection

**Goal**: Plan sequence of footsteps to reach target.

```python
class FootstepPlanner:
    def __init__(self, step_length=0.2, step_width=0.15):
        self.step_length = step_length
        self.step_width = step_width

    def plan_straight_walk(self, distance, num_steps):
        """
        Plan footsteps for straight-line walking

        Returns:
            List of (x, y, foot) tuples
        """
        footsteps = []
        step_dist = distance / num_steps

        for i in range(num_steps):
            x = i * step_dist

            # Alternate feet
            if i % 2 == 0:
                y = self.step_width / 2  # Left foot
                foot = 'left'
            else:
                y = -self.step_width / 2  # Right foot
                foot = 'right'

            footsteps.append((x, y, foot))

        return footsteps

    def plan_turn(self, angle_degrees, num_steps):
        """
        Plan footsteps for turning
        """
        footsteps = []
        angle_per_step = np.deg2rad(angle_degrees) / num_steps

        for i in range(num_steps):
            angle = i * angle_per_step

            # Circular arc
            radius = 0.3
            x = radius * np.sin(angle)
            y = radius * (1 - np.cos(angle))

            # Alternate feet
            foot = 'left' if i % 2 == 0 else 'right'

            footsteps.append((x, y, foot))

        return footsteps

# Usage
planner = FootstepPlanner()

# Plan 10 steps forward
footsteps = planner.plan_straight_walk(distance=2.0, num_steps=10)

for i, (x, y, foot) in enumerate(footsteps):
    print(f"Step {i}: {foot} foot at ({x:.2f}, {y:.2f})")
```

---

## 2.6 Model Predictive Control (MPC)

### Optimal Control for Walking

**MPC** optimizes future trajectory over prediction horizon.

**Objective:**
```
minimize: Σ ||x(t) - x_ref(t)||² + ||u(t)||²
subject to: dynamics, ZMP constraints, joint limits
```

**Python Implementation (Simplified):**
```python
from scipy.optimize import minimize

class WalkingMPC:
    def __init__(self, horizon=10, dt=0.1):
        self.horizon = horizon
        self.dt = dt
        self.lipm = LIPM()

    def optimize(self, current_state, reference_trajectory):
        """
        Solve MPC optimization problem

        Args:
            current_state: [x, vx, y, vy]
            reference_trajectory: Desired CoM trajectory

        Returns:
            optimal_zmp_trajectory
        """
        # Decision variables: ZMP positions over horizon
        # u = [x_zmp_0, y_zmp_0, x_zmp_1, y_zmp_1, ...]
        n_vars = 2 * self.horizon

        def objective(u):
            # Reshape to ZMP trajectory
            zmp_traj = u.reshape(self.horizon, 2)

            # Simulate forward
            state = current_state.copy()
            cost = 0

            for i in range(self.horizon):
                # Simulate one step
                state = self.lipm.simulate_step(state, zmp_traj[i], self.dt)

                # Tracking cost
                ref = reference_trajectory[i]
                cost += np.sum((state[:2] - ref[:2])**2)  # Position error

                # Control effort
                cost += 0.01 * np.sum(zmp_traj[i]**2)

            return cost

        # Initial guess: constant ZMP
        u0 = np.zeros(n_vars)

        # Bounds (ZMP must be in support polygon)
        bounds = [(-0.1, 0.1)] * n_vars

        # Optimize
        result = minimize(objective, u0, bounds=bounds, method='SLSQP')

        # Extract optimal ZMP trajectory
        optimal_zmp = result.x.reshape(self.horizon, 2)

        return optimal_zmp

# Usage
mpc = WalkingMPC(horizon=20, dt=0.05)

current_state = np.array([0.0, 0.0, 0.0, 0.0])

# Reference: move forward
ref_traj = [np.array([0.01*i, 0.1, 0.0, 0.0]) for i in range(20)]

optimal_zmp = mpc.optimize(current_state, ref_traj)
print(f"Optimal ZMP trajectory:\n{optimal_zmp}")
```

---

## 2.7 Whole-Body Motion Generation

### From CoM to Joint Angles

**Pipeline:**
1. Plan CoM trajectory (MPC)
2. Plan footsteps
3. Compute IK for feet and CoM
4. Optimize joint trajectories

```python
class WholeBodyWalkingController:
    def __init__(self, robot):
        self.robot = robot
        self.mpc = WalkingMPC()
        self.planner = FootstepPlanner()

    def generate_walking_motion(self, target_position, duration):
        """
        Generate full-body joint trajectories for walking
        """
        # 1. Plan footsteps
        distance = np.linalg.norm(target_position[:2])
        num_steps = int(distance / 0.2)
        footsteps = self.planner.plan_straight_walk(distance, num_steps)

        # 2. Plan CoM trajectory with MPC
        current_com_state = self.robot.get_com_state()
        reference_traj = self.create_reference_trajectory(footsteps)
        zmp_trajectory = self.mpc.optimize(current_com_state, reference_traj)

        # 3. Inverse kinematics
        joint_trajectories = []

        for i, (foot_pos, zmp) in enumerate(zip(footsteps, zmp_trajectory)):
            # Desired robot configuration
            desired_com = reference_traj[i][:2]

            # IK for legs (feet positions + CoM height)
            joint_angles = self.solve_whole_body_ik(
                com_position=desired_com,
                left_foot=footsteps[i] if footsteps[i][2] == 'left' else None,
                right_foot=footsteps[i] if footsteps[i][2] == 'right' else None
            )

            joint_trajectories.append(joint_angles)

        return np.array(joint_trajectories)

    def solve_whole_body_ik(self, com_position, left_foot, right_foot):
        """
        Solve IK for entire body given CoM and foot positions
        """
        # Simplified: use optimization or analytical IK
        # In practice, use whole-body IK solvers

        q = np.zeros(self.robot.n_joints)

        # Set leg joints to achieve foot positions
        # Set torso to achieve CoM position
        # ...

        return q
```

---

## 2.8 Push Recovery

### Handling Disturbances

**Strategies:**
1. **Ankle Strategy**: Torque at ankles
2. **Hip Strategy**: Torque at hips
3. **Step Strategy**: Take a step

```python
class PushRecoveryController:
    def __init__(self, robot):
        self.robot = robot

    def detect_push(self, com_state, zmp):
        """
        Detect if robot is being pushed
        """
        # Check ZMP margin
        support_poly = self.robot.get_support_polygon()
        zmp_margin = self.compute_zmp_margin(zmp, support_poly)

        # Check CoM velocity
        com_velocity = com_state[1::2]  # Extract velocities

        # Threshold
        if zmp_margin < 0.02 or np.linalg.norm(com_velocity) > 0.5:
            return True
        return False

    def recover_from_push(self, com_state, push_direction):
        """
        Generate recovery motion
        """
        # Determine recovery strategy
        com_velocity = com_state[1::2]

        if np.linalg.norm(com_velocity) < 0.3:
            # Small disturbance: ankle strategy
            return self.ankle_strategy(com_state)
        elif np.linalg.norm(com_velocity) < 0.6:
            # Medium disturbance: hip strategy
            return self.hip_strategy(com_state)
        else:
            # Large disturbance: step strategy
            return self.step_strategy(com_state, push_direction)

    def step_strategy(self, com_state, push_direction):
        """
        Take a step to regain balance
        """
        # Compute capture point
        omega = np.sqrt(9.81 / 0.8)  # LIPM frequency
        com_pos = com_state[::2]
        com_vel = com_state[1::2]

        capture_point = com_pos + com_vel / omega

        # Plan step to capture point
        step_location = capture_point + 0.1 * push_direction

        return step_location
```

---

## 2.9 Learning-Based Locomotion

### Deep Reinforcement Learning

**Train walking policies in simulation:**

```python
import torch
import torch.nn as nn

class WalkingPolicyNetwork(nn.Module):
    def __init__(self, obs_dim, action_dim):
        super().__init__()

        self.network = nn.Sequential(
            nn.Linear(obs_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 256),
            nn.ReLU(),
            nn.Linear(256, action_dim),
            nn.Tanh()
        )

    def forward(self, obs):
        return self.network(obs)

# Observation: joint positions, velocities, IMU, target velocity
obs_dim = 30

# Action: joint position targets
action_dim = 12  # 6 per leg

policy = WalkingPolicyNetwork(obs_dim, action_dim)

# Training with PPO (see Chapter 3 of Module 3)
# ...

# Deployment
obs = get_robot_state()
action = policy(torch.tensor(obs))
robot.set_joint_targets(action.detach().numpy())
```

---

## 2.10 Learning Objectives

By completing this chapter, you should be able to:

### Knowledge Objectives
- [ ] **Explain** ZMP and its role in balance
- [ ] **Describe** LIPM dynamics
- [ ] **List** gait phases and parameters

### Application Objectives
- [ ] **Compute** ZMP from CoM state
- [ ] **Plan** footstep sequences
- [ ] **Implement** MPC for walking
- [ ] **Design** push recovery controllers

---

## 2.11 Key Takeaways

:::tip Essential Concepts
1. **ZMP inside support polygon** = stable walking

2. **LIPM** provides simplified walking dynamics

3. **MPC** optimizes future trajectory for stability

4. **Footstep planning** determines discrete foot placements

5. **Push recovery** uses ankle/hip/step strategies

6. **Learning-based** methods can discover robust gaits
:::

---

## Next Steps

In the next chapter, we'll explore **Manipulation and Grasping with Humanoid Hands**!

---

## Further Reading

- [Humanoid Robotics: A Reference (Goswami & Vadakkepat)](https://link.springer.com/book/10.1007/978-94-007-6046-2)
- [Introduction to Humanoid Robotics (Kajita et al.)](https://link.springer.com/book/10.1007/978-3-642-54536-8)

---

**Chapter 2 Complete! ✅**
