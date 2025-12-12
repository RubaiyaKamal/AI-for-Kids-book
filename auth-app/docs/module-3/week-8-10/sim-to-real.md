
# Chapter 4: Sim-to-Real Transfer Techniques

## Overview

The "sim-to-real gap" is one of robotics' biggest challenges. Policies trained in simulation often fail on real robots due to differences in physics, sensors, and dynamics. This chapter covers techniques to bridge this gap and successfully deploy simulation-trained policies to physical robots.

:::info Learning Time
**Estimated Reading Time**: 60-70 minutes
**Hands-on Activities**: 45 minutes
**Total Chapter Time**: 2 hours
:::

---

## 4.1 The Sim-to-Real Gap

### Why Simulation ≠ Reality

**Common Discrepancies:**

| Aspect | Simulation | Reality |
|--------|------------|---------|
| **Physics** | Perfect, deterministic | Imperfect, noisy |
| **Sensors** | Noise-free, perfect | Noisy, biased, delayed |
| **Actuators** | Instant response | Delays, backlash, wear |
| **Objects** | Known properties | Unknown friction, mass |
| **Lighting** | Controlled | Variable, shadows |
| **Contacts** | Simplified | Complex, unpredictable |

**Example Failure:**
```python
# Works perfectly in simulation
policy_sim = train_in_simulation()

# Fails on real robot
success_rate_sim = 95%
success_rate_real = 20%  # ❌ Sim-to-real gap!
```

---

## 4.2 Domain Randomization

### Randomizing Simulation Parameters

**Idea**: Train on many variations so policy generalizes to reality.

**What to Randomize:**
1. **Physics**: Mass, friction, damping
2. **Visuals**: Lighting, textures, colors
3. **Sensors**: Noise, delays, failures
4. **Dynamics**: Joint stiffness, motor gains
5. **Environment**: Object positions, sizes

### Implementation

**Physics Randomization:**
```python
import numpy as np
from isaacgym import gymapi

class RandomizedEnv:
    def __init__(self):
        self.gym = gymapi.acquire_gym()
        self.sim = self.create_sim()

    def randomize_physics(self):
        # Randomize gravity (slight variations)
        gravity_z = np.random.uniform(-9.81, -9.81) * np.random.uniform(0.95, 1.05)
        self.gym.set_sim_params(self.sim, gravity=gymapi.Vec3(0, 0, gravity_z))

        # Randomize object properties
        for actor in self.actors:
            # Mass randomization (±20%)
            original_mass = self.get_actor_mass(actor)
            new_mass = original_mass * np.random.uniform(0.8, 1.2)
            self.set_actor_mass(actor, new_mass)

            # Friction randomization
            friction = np.random.uniform(0.5, 1.5)
            self.set_actor_friction(actor, friction)

            # Restitution (bounciness)
            restitution = np.random.uniform(0.0, 0.3)
            self.set_actor_restitution(actor, restitution)

    def randomize_visuals(self):
        # Lighting randomization
        light_intensity = np.random.uniform(500, 2000)
        light_color = np.random.uniform([0.8, 0.8, 0.8], [1.0, 1.0, 1.0])
        self.set_light_properties(light_intensity, light_color)

        # Texture randomization
        for actor in self.actors:
            # Random color
            color = np.random.uniform([0, 0, 0], [1, 1, 1])
            self.set_actor_color(actor, color)

    def randomize_sensors(self):
        # Camera noise
        self.camera_noise_std = np.random.uniform(0.0, 0.05)

        # IMU noise
        self.imu_accel_noise = np.random.uniform(0.0, 0.1)
        self.imu_gyro_noise = np.random.uniform(0.0, 0.01)

        # Force sensor noise
        self.force_noise_std = np.random.uniform(0.0, 1.0)

    def randomize_dynamics(self):
        # Joint damping
        for joint in self.joints:
            damping = np.random.uniform(0.1, 2.0)
            self.set_joint_damping(joint, damping)

            # Joint friction
            friction = np.random.uniform(0.0, 0.5)
            self.set_joint_friction(joint, friction)

            # Armature (rotor inertia)
            armature = np.random.uniform(0.0, 0.1)
            self.set_joint_armature(joint, armature)

    def reset(self):
        # Randomize everything on reset
        self.randomize_physics()
        self.randomize_visuals()
        self.randomize_sensors()
        self.randomize_dynamics()

        return self.get_observations()
```

**Visual Randomization in Isaac Sim:**
```python
import omni.replicator.core as rep

# Randomize lighting
def randomize_lighting():
    lights = rep.get.light()
    with lights:
        rep.modify.attribute(
            "intensity",
            rep.distribution.uniform(500, 3000)
        )
        rep.modify.attribute(
            "color",
            rep.distribution.uniform((0.8, 0.8, 0.8), (1.0, 1.0, 1.0))
        )

# Randomize materials
def randomize_materials():
    objects = rep.get.prims(semantics=[("class", "object")])
    with objects:
        rep.randomizer.color(
            colors=rep.distribution.uniform((0, 0, 0), (1, 1, 1))
        )
        rep.randomizer.texture(
            textures=rep.distribution.choice([
                "texture1.png",
                "texture2.png",
                "texture3.png"
            ])
        )

# Apply randomization
with rep.trigger.on_frame():
    randomize_lighting()
    randomize_materials()
```

---

## 4.3 System Identification

### Measuring Real Robot Parameters

**Goal**: Accurately model real robot in simulation.

**What to Measure:**
1. **Masses and inertias**: Weigh components, CAD models
2. **Friction coefficients**: Sliding tests
3. **Motor characteristics**: Torque-speed curves
4. **Sensor calibration**: Noise statistics, biases
5. **Delays**: Measure latency in control loop

**Example: Friction Identification:**
```python
import numpy as np
import matplotlib.pyplot as plt

def identify_friction():
    """
    Move joint at different velocities and measure torque
    """
    velocities = []
    torques = []

    # Sweep through velocities
    for target_vel in np.linspace(-1.0, 1.0, 50):
        # Command velocity
        robot.set_joint_velocity(joint_id=0, velocity=target_vel)
        time.sleep(0.5)  # Settle

        # Measure actual velocity and torque
        actual_vel = robot.get_joint_velocity(joint_id=0)
        torque = robot.get_joint_torque(joint_id=0)

        velocities.append(actual_vel)
        torques.append(torque)

    # Fit friction model: τ = τ_coulomb * sign(v) + b * v
    velocities = np.array(velocities)
    torques = np.array(torques)

    # Separate positive and negative velocities
    pos_mask = velocities > 0.01
    neg_mask = velocities < -0.01

    # Coulomb friction
    tau_coulomb_pos = np.mean(torques[pos_mask])
    tau_coulomb_neg = np.mean(torques[neg_mask])
    tau_coulomb = (tau_coulomb_pos - tau_coulomb_neg) / 2

    # Viscous friction
    b = np.polyfit(velocities, torques, 1)[0]

    print(f"Coulomb friction: {tau_coulomb:.4f} Nm")
    print(f"Viscous friction: {b:.4f} Nm/(rad/s)")

    # Plot
    plt.scatter(velocities, torques, label='Measured')
    plt.plot(velocities, tau_coulomb * np.sign(velocities) + b * velocities,
             'r-', label='Fitted model')
    plt.xlabel('Velocity (rad/s)')
    plt.ylabel('Torque (Nm)')
    plt.legend()
    plt.show()

    return tau_coulomb, b

# Use in simulation
tau_coulomb, b_viscous = identify_friction()
sim.set_joint_friction(joint_id=0, coulomb=tau_coulomb, viscous=b_viscous)
```

---

## 4.4 Robust Policy Learning

### Training for Robustness

**Techniques:**
1. **Observation noise**: Add noise to inputs
2. **Action noise**: Perturb outputs
3. **Delayed observations**: Simulate sensor lag
4. **Partial observability**: Hide some state info

**Implementation:**
```python
class RobustEnv(gym.Env):
    def __init__(self):
        super().__init__()

        # Noise parameters
        self.obs_noise_std = 0.05
        self.action_noise_std = 0.02
        self.obs_delay_steps = 2

        # Observation buffer for delays
        self.obs_buffer = []

    def get_observations(self):
        # Get true state
        true_obs = self.get_true_state()

        # Add noise
        noisy_obs = true_obs + np.random.normal(0, self.obs_noise_std, true_obs.shape)

        # Add to buffer
        self.obs_buffer.append(noisy_obs)

        # Return delayed observation
        if len(self.obs_buffer) > self.obs_delay_steps:
            delayed_obs = self.obs_buffer.pop(0)
        else:
            delayed_obs = noisy_obs

        return delayed_obs

    def step(self, action):
        # Add action noise
        noisy_action = action + np.random.normal(0, self.action_noise_std, action.shape)
        noisy_action = np.clip(noisy_action, -1, 1)

        # Apply to simulation
        return super().step(noisy_action)
```

---

## 4.5 Adaptive Control

### Online Adaptation

**Idea**: Adapt policy parameters based on real-world performance.

**Meta-Learning (MAML):**
```python
import torch
import torch.nn as nn
import torch.optim as optim

class AdaptivePolicy(nn.Module):
    def __init__(self, obs_dim, action_dim):
        super().__init__()

        self.policy = nn.Sequential(
            nn.Linear(obs_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 128),
            nn.ReLU(),
            nn.Linear(128, action_dim),
            nn.Tanh()
        )

    def forward(self, obs):
        return self.policy(obs)

    def adapt(self, obs, actions, rewards, lr=0.01):
        """
        Fast adaptation using few real-world samples
        """
        optimizer = optim.SGD(self.parameters(), lr=lr)

        # Compute loss on real data
        predicted_actions = self(obs)
        loss = -rewards.mean()  # Maximize reward

        # Update
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

# Usage on real robot
policy = AdaptivePolicy(obs_dim=20, action_dim=7)
policy.load_state_dict(torch.load("sim_trained_policy.pth"))

# Collect few real-world samples
real_obs, real_actions, real_rewards = collect_real_data(num_samples=10)

# Adapt policy
policy.adapt(real_obs, real_actions, real_rewards)

# Now use adapted policy
while True:
    obs = get_robot_state()
    action = policy(obs)
    execute_action(action)
```

---

## 4.6 Residual Learning

### Sim-to-Real Residual Policy

**Idea**: Learn a correction on top of sim-trained policy.

```
action_real = action_sim + residual(obs)
```

**Implementation:**
```python
class ResidualPolicy(nn.Module):
    def __init__(self, base_policy, obs_dim, action_dim):
        super().__init__()

        # Frozen base policy (from simulation)
        self.base_policy = base_policy
        for param in self.base_policy.parameters():
            param.requires_grad = False

        # Learnable residual
        self.residual = nn.Sequential(
            nn.Linear(obs_dim, 64),
            nn.ReLU(),
            nn.Linear(64, action_dim),
            nn.Tanh()
        )

        # Residual scale (small corrections)
        self.residual_scale = 0.1

    def forward(self, obs):
        # Base action from sim policy
        base_action = self.base_policy(obs)

        # Residual correction
        residual = self.residual(obs) * self.residual_scale

        # Combined action
        action = base_action + residual
        action = torch.clamp(action, -1, 1)

        return action

# Train residual on real robot
base_policy = torch.load("sim_policy.pth")
residual_policy = ResidualPolicy(base_policy, obs_dim=20, action_dim=7)

# Only train residual part
optimizer = optim.Adam(residual_policy.residual.parameters(), lr=0.001)

for epoch in range(100):
    # Collect real-world data
    obs, rewards = collect_real_rollout(residual_policy)

    # Optimize for reward
    loss = -rewards.mean()

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
```

---

## 4.7 Sim-to-Real Transfer Checklist

### Pre-Deployment Checklist

**✅ Simulation Fidelity:**
- [ ] Accurate robot URDF/SDF
- [ ] Measured mass and inertia
- [ ] Calibrated friction parameters
- [ ] Realistic sensor noise
- [ ] Actuator dynamics modeled

**✅ Domain Randomization:**
- [ ] Physics randomization enabled
- [ ] Visual randomization (lighting, textures)
- [ ] Sensor noise randomization
- [ ] Dynamics randomization (damping, friction)

**✅ Policy Robustness:**
- [ ] Trained with observation noise
- [ ] Trained with action noise
- [ ] Handles delayed observations
- [ ] Tested in diverse scenarios

**✅ Safety:**
- [ ] Joint limits enforced
- [ ] Velocity limits set
- [ ] Emergency stop implemented
- [ ] Collision detection active
- [ ] Workspace boundaries defined

**✅ Deployment:**
- [ ] Policy exported (TorchScript/ONNX)
- [ ] Real-time performance verified
- [ ] Gradual deployment (easy → hard tasks)
- [ ] Human supervision initially
- [ ] Logging and monitoring active

---

## 4.8 Case Study: Sim-to-Real Grasping

### Complete Workflow

**1. Train in Simulation:**
```python
# Domain randomized environment
env = RandomizedGraspingEnv(num_envs=2048)

# Train with PPO
model = PPO("MlpPolicy", env, verbose=1)
model.learn(total_timesteps=10_000_000)

# Save policy
model.save("grasping_policy_sim")
```

**2. System Identification:**
```python
# Measure real gripper parameters
gripper_mass = measure_mass()  # 0.73 kg
max_force = measure_max_force()  # 140 N
friction_coef = measure_friction()  # 0.85

# Update simulation
sim.set_gripper_properties(
    mass=gripper_mass,
    max_force=max_force,
    friction=friction_coef
)
```

**3. Fine-tune with Real Data:**
```python
# Collect 100 real grasps
real_data = collect_real_grasps(num_samples=100)

# Fine-tune policy
policy = torch.load("grasping_policy_sim.pth")
fine_tune(policy, real_data, epochs=10)

# Save fine-tuned policy
torch.save(policy.state_dict(), "grasping_policy_real.pth")
```

**4. Deploy:**
```python
# Load policy
policy = torch.jit.load("grasping_policy_real.pt")

# Control loop
while True:
    # Get observation
    obs = get_robot_state()

    # Compute action
    with torch.no_grad():
        action = policy(torch.tensor(obs))

    # Execute
    robot.set_gripper_position(action.item())

    time.sleep(0.01)
```

**Results:**
- Sim success rate: 92%
- Real success rate (no transfer): 45%
- Real success rate (with transfer techniques): 78%

---

## 4.9 Advanced Techniques

### Privileged Learning

**Train with extra info in sim, deploy without it:**
```python
class PrivilegedPolicy(nn.Module):
    def __init__(self):
        super().__init__()

        # Student policy (deployed)
        self.student = nn.Sequential(
            nn.Linear(obs_dim, 128),
            nn.ReLU(),
            nn.Linear(128, action_dim)
        )

        # Teacher policy (simulation only)
        self.teacher = nn.Sequential(
            nn.Linear(obs_dim + privileged_dim, 128),
            nn.ReLU(),
            nn.Linear(128, action_dim)
        )

    def forward(self, obs, privileged_info=None):
        if privileged_info is not None:
            # Training: use teacher
            combined = torch.cat([obs, privileged_info], dim=-1)
            return self.teacher(combined)
        else:
            # Deployment: use student
            return self.student(obs)

# Train teacher with privileged info (object mass, friction, etc.)
# Distill to student without privileged info
```

---

## 4.10 Learning Objectives

By completing this chapter, you should be able to:

### Knowledge Objectives
- [ ] **Explain** the sim-to-real gap
- [ ] **Describe** domain randomization techniques
- [ ] **List** system identification methods

### Application Objectives
- [ ] **Implement** domain randomization
- [ ] **Perform** system identification
- [ ] **Deploy** sim-trained policies to real robots
- [ ] **Use** residual learning for adaptation

---

## 4.11 Key Takeaways

:::tip Essential Concepts
1. **Sim-to-real gap** exists due to physics, sensor, and dynamics differences

2. **Domain randomization** trains policies robust to variations

3. **System identification** measures real robot parameters

4. **Robust training** adds noise and delays during training

5. **Residual learning** fine-tunes sim policies on real data

6. **Gradual deployment** starts with easy tasks and human supervision
:::

:::warning Critical Success Factors
- Accurate robot model (URDF, masses, inertias)
- Comprehensive domain randomization
- Safety mechanisms (limits, e-stop)
- Gradual deployment strategy
- Continuous monitoring and logging
:::

---

## 4.12 Hands-On Project

### Project: Sim-to-Real Object Pushing

**Goal**: Train a policy in Isaac Sim to push objects, deploy to real robot.

**Steps**:
1. Create pushing environment in Isaac Sim
2. Implement domain randomization (mass, friction, lighting)
3. Train PPO policy (5M timesteps)
4. Measure real robot/object parameters
5. Update simulation with real parameters
6. Fine-tune policy with 50 real pushes
7. Deploy and evaluate

**Success Metrics**:
- Sim success rate > 85%
- Real success rate > 70%

---

## Module 3 Complete! 🎉

**Congratulations!** You've completed Weeks 8-10: NVIDIA Isaac Platform.

**You've learned**:
- ✅ Isaac SDK and Isaac Sim
- ✅ AI-powered perception and manipulation
- ✅ Reinforcement learning for robot control
- ✅ Sim-to-real transfer techniques

**Next**: Continue to subsequent modules for advanced topics!

---

## Further Reading

- [Sim-to-Real Transfer in Robotics (Survey)](https://arxiv.org/abs/2009.13303)
- [Domain Randomization for Transferring Deep Neural Networks](https://arxiv.org/abs/1703.06907)
- [Learning Dexterous In-Hand Manipulation](https://arxiv.org/abs/1808.00177)
- [NVIDIA Isaac Gym](https://developer.nvidia.com/isaac-gym)

---

**Chapter 4 Complete! ✅**

**Module 3 Complete! 🎊**

You now have comprehensive knowledge of NVIDIA Isaac Platform and can train and deploy AI-powered robots!
