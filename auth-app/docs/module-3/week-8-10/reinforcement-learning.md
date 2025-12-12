
# Chapter 3: Reinforcement Learning for Robot Control

## Overview

Reinforcement Learning (RL) enables robots to learn complex behaviors through trial and error. This chapter covers RL fundamentals, training robots in Isaac Sim, and deploying learned policies to real hardware.

:::info Learning Time
**Estimated Reading Time**: 60-70 minutes
**Hands-on Activities**: 60 minutes
**Total Chapter Time**: 2 hours
:::

---

## 3.1 Reinforcement Learning Basics

### What is Reinforcement Learning?

**RL Framework:**
```
Agent → Action → Environment
   ↑                 ↓
   └── Reward ←──────┘
```

**Key Components:**
- **Agent**: The robot/controller
- **Environment**: The world (Isaac Sim)
- **State**: Robot + world observations
- **Action**: Motor commands
- **Reward**: Feedback signal (success/failure)
- **Policy**: Mapping from states to actions

### RL vs. Traditional Control

| Approach | Traditional Control | Reinforcement Learning |
|----------|-------------------|----------------------|
| **Design** | Hand-crafted | Learned from data |
| **Adaptability** | Fixed | Adapts to changes |
| **Complexity** | Simple tasks | Complex behaviors |
| **Development** | Expert knowledge | Trial and error |
| **Optimization** | Manual tuning | Automatic |

---

## 3.2 RL Algorithms for Robotics

### Popular Algorithms

**1. PPO (Proximal Policy Optimization)**
- ✅ Stable and reliable
- ✅ Good for continuous control
- ✅ Sample efficient
- **Use for**: Locomotion, manipulation

**2. SAC (Soft Actor-Critic)**
- ✅ Very sample efficient
- ✅ Off-policy (reuses data)
- ✅ Handles stochastic environments
- **Use for**: Complex manipulation

**3. TD3 (Twin Delayed DDPG)**
- ✅ Deterministic policy
- ✅ Good performance
- ❌ Less stable than PPO
- **Use for**: Precise control tasks

---

## 3.3 Setting Up RL in Isaac Sim

### Isaac Gym Integration

**Isaac Gym** provides GPU-accelerated RL training.

**Installation:**
```bash
# Download Isaac Gym from NVIDIA
# https://developer.nvidia.com/isaac-gym

# Extract and install
cd isaacgym/python
pip install -e .

# Verify
python -c "import isaacgym; print('Success!')"
```

### Creating an RL Environment

**Basic Structure:**
```python
from isaacgym import gymapi
from isaacgym import gymutil
import numpy as np
import torch

class RobotEnv:
    def __init__(self, num_envs=1024):
        # Create gym
        self.gym = gymapi.acquire_gym()

        # Simulation parameters
        sim_params = gymapi.SimParams()
        sim_params.dt = 1.0 / 60.0
        sim_params.substeps = 2
        sim_params.up_axis = gymapi.UP_AXIS_Z
        sim_params.gravity = gymapi.Vec3(0.0, 0.0, -9.81)

        # Physics engine
        sim_params.physx.solver_type = 1
        sim_params.physx.num_position_iterations = 4
        sim_params.physx.num_velocity_iterations = 1

        # Create sim
        self.sim = self.gym.create_sim(
            0, 0, gymapi.SIM_PHYSX, sim_params
        )

        # Create environments
        self.num_envs = num_envs
        self.envs = []
        self.actors = []

        spacing = 2.0
        lower = gymapi.Vec3(-spacing, -spacing, 0.0)
        upper = gymapi.Vec3(spacing, spacing, spacing)

        for i in range(num_envs):
            env = self.gym.create_env(self.sim, lower, upper, int(np.sqrt(num_envs)))
            self.envs.append(env)

            # Add robot actor
            actor = self.create_robot(env)
            self.actors.append(actor)

    def create_robot(self, env):
        # Load robot asset
        asset_root = "assets"
        asset_file = "franka/franka.urdf"

        asset_options = gymapi.AssetOptions()
        asset_options.fix_base_link = True

        robot_asset = self.gym.load_asset(
            self.sim, asset_root, asset_file, asset_options
        )

        # Create actor
        pose = gymapi.Transform()
        pose.p = gymapi.Vec3(0, 0, 0)

        actor = self.gym.create_actor(
            env, robot_asset, pose, "robot", i, 1
        )

        return actor

    def reset(self):
        # Reset all environments
        for i, env in enumerate(self.envs):
            # Reset robot pose
            self.gym.set_actor_root_state_tensor(...)

        # Get observations
        obs = self.get_observations()
        return obs

    def step(self, actions):
        # Apply actions
        self.gym.set_dof_position_target_tensor(self.sim, actions)

        # Step simulation
        self.gym.simulate(self.sim)
        self.gym.fetch_results(self.sim, True)

        # Get observations, rewards, dones
        obs = self.get_observations()
        rewards = self.compute_rewards()
        dones = self.check_termination()

        return obs, rewards, dones, {}

    def get_observations(self):
        # Get robot state
        dof_states = self.gym.acquire_dof_state_tensor(self.sim)

        # Convert to torch tensor
        obs = torch.from_numpy(dof_states).float()
        return obs

    def compute_rewards(self):
        # Task-specific reward function
        # Example: reaching task
        end_effector_pos = self.get_end_effector_positions()
        target_pos = self.target_positions

        distance = torch.norm(end_effector_pos - target_pos, dim=-1)
        rewards = -distance  # Negative distance as reward

        return rewards

    def check_termination(self):
        # Check if episode should end
        # Example: success or timeout
        dones = torch.zeros(self.num_envs, dtype=torch.bool)

        # Success condition
        distance = self.compute_distance_to_goal()
        dones |= (distance < 0.05)  # Within 5cm

        # Timeout
        dones |= (self.progress_buf > self.max_episode_length)

        return dones
```

---

## 3.4 Training with PPO

### PPO Implementation

**Using Stable-Baselines3:**
```python
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv

# Create environment
env = RobotEnv(num_envs=1024)

# Wrap for Stable-Baselines3
vec_env = DummyVecEnv([lambda: env])

# Create PPO agent
model = PPO(
    "MlpPolicy",
    vec_env,
    learning_rate=3e-4,
    n_steps=2048,
    batch_size=64,
    n_epochs=10,
    gamma=0.99,
    gae_lambda=0.95,
    clip_range=0.2,
    verbose=1,
    tensorboard_log="./ppo_robot_tensorboard/"
)

# Train
model.learn(total_timesteps=10_000_000)

# Save model
model.save("ppo_robot_policy")
```

**Custom PPO Training Loop:**
```python
import torch
import torch.nn as nn
import torch.optim as optim

class ActorCritic(nn.Module):
    def __init__(self, obs_dim, action_dim):
        super().__init__()

        # Shared layers
        self.shared = nn.Sequential(
            nn.Linear(obs_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 256),
            nn.ReLU()
        )

        # Actor (policy)
        self.actor = nn.Sequential(
            nn.Linear(256, action_dim),
            nn.Tanh()
        )

        # Critic (value function)
        self.critic = nn.Linear(256, 1)

    def forward(self, obs):
        features = self.shared(obs)
        action = self.actor(features)
        value = self.critic(features)
        return action, value

# Training
env = RobotEnv(num_envs=1024)
policy = ActorCritic(obs_dim=13, action_dim=7)
optimizer = optim.Adam(policy.parameters(), lr=3e-4)

for iteration in range(1000):
    # Collect rollouts
    obs = env.reset()
    rollout_obs = []
    rollout_actions = []
    rollout_rewards = []
    rollout_values = []

    for step in range(2048):
        # Get action from policy
        with torch.no_grad():
            action, value = policy(obs)

        # Step environment
        next_obs, reward, done, _ = env.step(action)

        # Store
        rollout_obs.append(obs)
        rollout_actions.append(action)
        rollout_rewards.append(reward)
        rollout_values.append(value)

        obs = next_obs

    # Compute advantages
    advantages = compute_gae(rollout_rewards, rollout_values)

    # Update policy
    for epoch in range(10):
        # Sample mini-batches
        for batch in get_batches(rollout_obs, rollout_actions, advantages):
            # Compute loss
            actions, values = policy(batch['obs'])

            # Policy loss (clipped)
            ratio = torch.exp(log_prob(actions) - batch['old_log_prob'])
            surr1 = ratio * batch['advantages']
            surr2 = torch.clamp(ratio, 0.8, 1.2) * batch['advantages']
            policy_loss = -torch.min(surr1, surr2).mean()

            # Value loss
            value_loss = (values - batch['returns']).pow(2).mean()

            # Total loss
            loss = policy_loss + 0.5 * value_loss

            # Update
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

    print(f"Iteration {iteration}, Reward: {np.mean(rollout_rewards):.2f}")
```

---

## 3.5 Example: Training a Reaching Task

### Task Definition

**Goal**: Robot arm reaches target position

**State Space:**
- Joint positions (7 DOF)
- Joint velocities (7 DOF)
- End-effector position (3D)
- Target position (3D)
- **Total**: 20 dimensions

**Action Space:**
- Joint position targets (7 DOF)
- **Range**: [-1, 1] (normalized)

**Reward Function:**
```python
def compute_reward(self):
    # Distance to target
    ee_pos = self.get_end_effector_pos()
    target_pos = self.target_pos
    distance = torch.norm(ee_pos - target_pos, dim=-1)

    # Reward components
    distance_reward = -distance
    success_bonus = (distance < 0.05).float() * 10.0
    action_penalty = -0.01 * torch.norm(self.actions, dim=-1)

    total_reward = distance_reward + success_bonus + action_penalty
    return total_reward
```

**Complete Implementation:**
```python
class ReachingEnv(RobotEnv):
    def __init__(self, num_envs=1024):
        super().__init__(num_envs)

        # Task parameters
        self.max_episode_length = 500
        self.progress_buf = torch.zeros(num_envs, dtype=torch.long)

        # Target positions
        self.target_positions = self.sample_targets()

    def sample_targets(self):
        # Random targets in workspace
        targets = torch.rand(self.num_envs, 3) * 0.4 - 0.2
        targets[:, 2] += 0.5  # Height offset
        return targets

    def reset(self):
        # Reset robot
        super().reset()

        # New targets
        self.target_positions = self.sample_targets()

        # Reset progress
        self.progress_buf.zero_()

        return self.get_observations()

    def get_observations(self):
        # Joint states
        dof_pos = self.get_dof_positions()
        dof_vel = self.get_dof_velocities()

        # End-effector position
        ee_pos = self.get_end_effector_positions()

        # Relative target position
        target_rel = self.target_positions - ee_pos

        # Concatenate
        obs = torch.cat([dof_pos, dof_vel, ee_pos, target_rel], dim=-1)
        return obs

    def step(self, actions):
        # Apply actions
        self.apply_actions(actions)

        # Simulate
        self.gym.simulate(self.sim)
        self.gym.fetch_results(self.sim, True)

        # Update progress
        self.progress_buf += 1

        # Compute rewards
        rewards = self.compute_reward()

        # Check termination
        dones = self.check_termination()

        # Reset finished environments
        if dones.any():
            self.reset_envs(dones)

        obs = self.get_observations()
        return obs, rewards, dones, {}

# Train
env = ReachingEnv(num_envs=2048)
model = PPO("MlpPolicy", env, verbose=1)
model.learn(total_timesteps=5_000_000)
model.save("reaching_policy")
```

---

## 3.6 Curriculum Learning

### Progressive Difficulty

**Start easy, increase difficulty:**
```python
class CurriculumEnv(ReachingEnv):
    def __init__(self, num_envs=1024):
        super().__init__(num_envs)

        self.difficulty = 0.0  # 0 = easy, 1 = hard
        self.success_rate = 0.0

    def sample_targets(self):
        # Easy: close targets
        # Hard: far targets

        if self.difficulty < 0.3:
            # Easy: within 20cm
            radius = 0.2
        elif self.difficulty < 0.7:
            # Medium: within 40cm
            radius = 0.4
        else:
            # Hard: full workspace
            radius = 0.6

        targets = torch.rand(self.num_envs, 3) * radius - radius/2
        targets[:, 2] += 0.5
        return targets

    def update_difficulty(self, success_rate):
        # Increase difficulty if doing well
        if success_rate > 0.8:
            self.difficulty = min(1.0, self.difficulty + 0.1)
        elif success_rate < 0.5:
            self.difficulty = max(0.0, self.difficulty - 0.05)

        print(f"Difficulty: {self.difficulty:.2f}, Success Rate: {success_rate:.2%}")
```

---

## 3.7 Multi-Task Learning

### Training One Policy for Multiple Tasks

**Shared policy with task conditioning:**
```python
class MultiTaskPolicy(nn.Module):
    def __init__(self, obs_dim, action_dim, num_tasks):
        super().__init__()

        # Task embedding
        self.task_embedding = nn.Embedding(num_tasks, 64)

        # Policy network
        self.policy = nn.Sequential(
            nn.Linear(obs_dim + 64, 256),
            nn.ReLU(),
            nn.Linear(256, 256),
            nn.ReLU(),
            nn.Linear(256, action_dim),
            nn.Tanh()
        )

    def forward(self, obs, task_id):
        # Get task embedding
        task_emb = self.task_embedding(task_id)

        # Concatenate with observation
        combined = torch.cat([obs, task_emb], dim=-1)

        # Compute action
        action = self.policy(combined)
        return action

# Training
tasks = ['reach', 'push', 'pick', 'place']
policy = MultiTaskPolicy(obs_dim=20, action_dim=7, num_tasks=len(tasks))

for iteration in range(1000):
    # Sample task
    task_id = np.random.randint(0, len(tasks))

    # Train on that task
    train_on_task(policy, task_id)
```

---

## 3.8 Deploying RL Policies

### From Simulation to Real Robot

**Export trained policy:**
```python
# Save as TorchScript for deployment
policy = torch.jit.script(trained_model)
policy.save("policy.pt")
```

**Load on robot:**
```python
import torch

# Load policy
policy = torch.jit.load("policy.pt")
policy.eval()

# Control loop
while True:
    # Get observation
    obs = get_robot_state()
    obs_tensor = torch.tensor(obs).float()

    # Compute action
    with torch.no_grad():
        action = policy(obs_tensor)

    # Apply to robot
    robot.set_joint_targets(action.numpy())

    time.sleep(0.01)  # 100 Hz
```

---

## 3.9 Learning Objectives

By completing this chapter, you should be able to:

### Knowledge Objectives
- [ ] **Explain** reinforcement learning fundamentals
- [ ] **Describe** PPO, SAC, and TD3 algorithms
- [ ] **List** components of an RL environment

### Application Objectives
- [ ] **Create** RL environments in Isaac Gym
- [ ] **Train** robot policies with PPO
- [ ] **Implement** curriculum learning
- [ ] **Deploy** learned policies to real robots

---

## 3.10 Key Takeaways

:::tip Essential Concepts
1. **RL** learns through trial and error in simulation

2. **PPO** is stable and reliable for robot control

3. **Isaac Gym** provides GPU-accelerated training (1000x faster)

4. **Curriculum learning** starts easy and increases difficulty

5. **Multi-task learning** trains one policy for multiple tasks

6. **Sim-to-real** requires careful domain randomization
:::

---

## Next Steps

In the next chapter, we'll explore **Sim-to-Real Transfer** - bridging the gap between simulation and reality!

---

**Chapter 3 Complete! ✅**
