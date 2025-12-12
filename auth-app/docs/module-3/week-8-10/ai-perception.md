

# Chapter 2: AI-Powered Perception and Manipulation

## Overview

This chapter covers AI-powered perception and manipulation in Isaac Sim, including object detection, pose estimation, semantic segmentation, and intelligent grasping using deep learning models.

:::info Learning Time
**Estimated Reading Time**: 60-70 minutes
**Hands-on Activities**: 60 minutes
**Total Chapter Time**: 2 hours
:::

---

## 2.1 Computer Vision in Robotics

### The Perception Challenge

**Traditional Approach:**
- Hand-crafted features
- Rule-based detection
- Limited to specific scenarios
- Brittle in real-world conditions

**AI Approach:**
- Learned features from data
- Robust to variations
- Generalizes to new scenarios
- Continuously improving

### Deep Learning for Perception

**Common Tasks:**
1. **Object Detection**: Where are objects?
2. **Pose Estimation**: What orientation?
3. **Semantic Segmentation**: What is each pixel?
4. **Instance Segmentation**: Which object is which?
5. **Depth Estimation**: How far away?

---

## 2.2 Object Detection with DOPE

### DOPE (Deep Object Pose Estimation)

**DOPE** estimates 6D pose (position + orientation) of known objects.

**Training DOPE:**
```python
# Generate synthetic training data in Isaac Sim
import omni.replicator.core as rep

# Load object model
object_usd = "omniverse://localhost/Objects/soup_can.usd"
obj = rep.create.from_usd(object_usd)

# Randomize pose
with obj:
    rep.modify.pose(
        position=rep.distribution.uniform((-0.5, -0.5, 0.1), (0.5, 0.5, 0.5)),
        rotation=rep.distribution.uniform((0, 0, 0), (360, 360, 360))
    )

# Randomize lighting
light = rep.create.light(
    light_type="Dome",
    intensity=rep.distribution.uniform(500, 2000),
    color=rep.distribution.uniform((0.8, 0.8, 0.8), (1.0, 1.0, 1.0))
)

# Setup camera
camera = rep.create.camera(
    position=rep.distribution.uniform((0.5, 0.5, 0.5), (1.5, 1.5, 1.5)),
    look_at=obj
)

# Generate 10,000 images
with rep.trigger.on_frame(num_frames=10000):
    rep.randomizer.randomize()

rep.orchestrator.run()
```

**Using DOPE for Inference:**
```python
import cv2
import numpy as np
from isaac_ros_dope import DOPEDecoder

# Initialize DOPE
dope = DOPEDecoder(
    model_path="/path/to/dope_model.pth",
    object_name="soup_can"
)

# Get camera image
image = get_camera_rgb()

# Run inference
detections = dope.infer(image)

# Process results
for detection in detections:
    # 3D position
    x, y, z = detection['location']

    # Orientation (quaternion)
    qx, qy, qz, qw = detection['quaternion']

    # Confidence
    confidence = detection['score']

    if confidence > 0.8:
        print(f"Object detected at ({x:.2f}, {y:.2f}, {z:.2f})")
        print(f"Orientation: ({qx:.2f}, {qy:.2f}, {qz:.2f}, {qw:.2f})")
```

---

## 2.3 Semantic Segmentation

### Understanding Scene Layout

**Semantic segmentation** assigns a class label to every pixel.

**Generating Training Data:**
```python
import omni.replicator.core as rep

# Create scene with multiple objects
objects = rep.create.from_usd(
    "omniverse://localhost/Objects/*.usd",
    count=20
)

# Assign semantic labels
with objects:
    rep.modify.semantics([
        ("class", "object"),
        ("id", rep.distribution.sequence(0, 19))
    ])

# Setup camera
camera = rep.create.camera()
render_product = rep.create.render_product(camera, (512, 512))

# Attach semantic segmentation writer
writer = rep.WriterRegistry.get("BasicWriter")
writer.initialize(
    output_dir="_segmentation_output",
    rgb=True,
    semantic_segmentation=True,
    instance_segmentation=True
)
writer.attach([render_product])

# Generate data
with rep.trigger.on_frame(num_frames=5000):
    rep.randomizer.randomize()

rep.orchestrator.run()
```

**Training a Segmentation Model:**
```python
import torch
import torch.nn as nn
from torchvision.models.segmentation import deeplabv3_resnet50

# Load pre-trained model
model = deeplabv3_resnet50(pretrained=True)

# Modify for your classes
num_classes = 10  # Your object classes
model.classifier[4] = nn.Conv2d(256, num_classes, kernel_size=1)

# Training loop
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss()

for epoch in range(100):
    for images, masks in dataloader:
        optimizer.zero_grad()

        # Forward pass
        outputs = model(images)['out']
        loss = criterion(outputs, masks)

        # Backward pass
        loss.backward()
        optimizer.step()

    print(f"Epoch {epoch}, Loss: {loss.item():.4f}")

# Save model
torch.save(model.state_dict(), "segmentation_model.pth")
```

---

## 2.4 Depth Estimation

### Monocular Depth Prediction

**Depth from a single camera** using deep learning.

**Using Pre-trained Models:**
```python
import torch
from torchvision import transforms
from PIL import Image

# Load MiDaS depth estimation model
model = torch.hub.load("intel-isl/MiDaS", "MiDaS_small")
model.eval()

# Prepare transforms
transform = torch.hub.load("intel-isl/MiDaS", "transforms").small_transform

# Get image
image = Image.open("robot_view.jpg")
input_batch = transform(image).unsqueeze(0)

# Predict depth
with torch.no_grad():
    prediction = model(input_batch)
    prediction = torch.nn.functional.interpolate(
        prediction.unsqueeze(1),
        size=image.size[::-1],
        mode="bicubic",
        align_corners=False,
    ).squeeze()

# Convert to numpy
depth_map = prediction.cpu().numpy()

# Visualize
import matplotlib.pyplot as plt
plt.imshow(depth_map, cmap='plasma')
plt.colorbar()
plt.show()
```

---

## 2.5 Grasp Planning with AI

### Learning to Grasp

**GraspNet** predicts grasp poses from point clouds.

**Generating Grasp Training Data:**
```python
from omni.isaac.core import World
from omni.isaac.core.objects import DynamicCuboid
from omni.isaac.manipulators import SingleManipulator
from omni.isaac.manipulators.grippers import ParallelGripper

# Create world
world = World()

# Add robot
robot = SingleManipulator(prim_path="/World/Franka")
gripper = ParallelGripper(end_effector_prim_path="/World/Franka/panda_hand")

# Add objects
for i in range(100):
    obj = DynamicCuboid(
        prim_path=f"/World/Object_{i}",
        position=(np.random.uniform(-0.3, 0.3),
                 np.random.uniform(-0.3, 0.3),
                 0.5),
        size=np.random.uniform(0.02, 0.1),
        color=np.random.rand(3)
    )
    world.scene.add(obj)

# Simulate grasps
successful_grasps = []
failed_grasps = []

for i in range(1000):
    # Random grasp pose
    grasp_position = np.random.uniform((-0.3, -0.3, 0.3), (0.3, 0.3, 0.6))
    grasp_orientation = np.random.uniform((0, 0, 0), (2*np.pi, 2*np.pi, 2*np.pi))

    # Attempt grasp
    robot.set_end_effector_pose(grasp_position, grasp_orientation)
    gripper.close()

    # Check success
    if gripper.is_grasping():
        successful_grasps.append({
            'position': grasp_position,
            'orientation': grasp_orientation,
            'object_id': current_object_id
        })
    else:
        failed_grasps.append({
            'position': grasp_position,
            'orientation': grasp_orientation
        })

# Save dataset
import pickle
with open('grasp_dataset.pkl', 'wb') as f:
    pickle.dump({
        'successful': successful_grasps,
        'failed': failed_grasps
    }, f)
```

**Training Grasp Network:**
```python
import torch
import torch.nn as nn

class GraspNet(nn.Module):
    def __init__(self):
        super().__init__()

        # Point cloud encoder
        self.encoder = nn.Sequential(
            nn.Conv1d(3, 64, 1),
            nn.ReLU(),
            nn.Conv1d(64, 128, 1),
            nn.ReLU(),
            nn.Conv1d(128, 256, 1),
            nn.ReLU()
        )

        # Grasp predictor
        self.predictor = nn.Sequential(
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 7)  # x, y, z, qx, qy, qz, qw
        )

    def forward(self, point_cloud):
        # point_cloud: (batch, 3, num_points)
        features = self.encoder(point_cloud)
        global_features = torch.max(features, dim=2)[0]
        grasp_pose = self.predictor(global_features)
        return grasp_pose

# Training
model = GraspNet()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
criterion = nn.MSELoss()

for epoch in range(100):
    for point_clouds, grasp_poses in dataloader:
        optimizer.zero_grad()

        predicted_grasps = model(point_clouds)
        loss = criterion(predicted_grasps, grasp_poses)

        loss.backward()
        optimizer.step()

    print(f"Epoch {epoch}, Loss: {loss.item():.4f}")
```

---

## 2.6 Vision-Language Models for Robotics

### Using CLIP for Zero-Shot Detection

**CLIP** (Contrastive Language-Image Pre-training) enables natural language object queries.

**Example:**
```python
import torch
import clip
from PIL import Image

# Load CLIP
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# Get robot camera image
image = Image.open("robot_view.jpg")
image_input = preprocess(image).unsqueeze(0).to(device)

# Define text queries
text_queries = [
    "a red cup",
    "a blue bottle",
    "a green box",
    "a yellow banana"
]
text_inputs = clip.tokenize(text_queries).to(device)

# Compute features
with torch.no_grad():
    image_features = model.encode_image(image_input)
    text_features = model.encode_text(text_inputs)

    # Normalize
    image_features /= image_features.norm(dim=-1, keepdim=True)
    text_features /= text_features.norm(dim=-1, keepdim=True)

    # Compute similarity
    similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)

# Get best match
best_match_idx = similarity.argmax().item()
best_match = text_queries[best_match_idx]
confidence = similarity[0, best_match_idx].item()

print(f"Detected: {best_match} (confidence: {confidence:.2%})")
```

---

## 2.7 Multi-Modal Perception

### Fusing Vision and Touch

**Combining camera and force sensors:**
```python
import numpy as np

class MultiModalPerception:
    def __init__(self):
        self.vision_model = load_vision_model()
        self.force_threshold = 5.0  # Newtons

    def detect_and_grasp(self, rgb_image, depth_image, force_reading):
        # Visual detection
        objects = self.vision_model.detect(rgb_image)

        # Depth-based filtering
        valid_objects = []
        for obj in objects:
            x, y = obj['center']
            depth = depth_image[y, x]

            if 0.3 < depth < 1.0:  # Reachable range
                obj['depth'] = depth
                valid_objects.append(obj)

        # Sort by confidence
        valid_objects.sort(key=lambda x: x['confidence'], reverse=True)

        # Attempt grasp with force feedback
        for obj in valid_objects:
            grasp_pose = self.compute_grasp_pose(obj)

            # Move to pre-grasp
            move_to_pose(grasp_pose)

            # Close gripper with force monitoring
            while not gripper_closed():
                close_gripper(speed=0.1)

                if force_reading > self.force_threshold:
                    # Object grasped!
                    return {
                        'success': True,
                        'object': obj,
                        'force': force_reading
                    }

        return {'success': False}
```

---

## 2.8 Real-Time Perception Pipeline

### Optimized Inference

**GPU-accelerated pipeline:**
```python
import tensorrt as trt
import pycuda.driver as cuda
import pycuda.autoinit

class TensorRTInference:
    def __init__(self, engine_path):
        # Load TensorRT engine
        with open(engine_path, 'rb') as f:
            self.engine = trt.Runtime(trt.Logger(trt.Logger.WARNING)).deserialize_cuda_engine(f.read())

        self.context = self.engine.create_execution_context()

        # Allocate buffers
        self.inputs = []
        self.outputs = []
        self.bindings = []

        for binding in self.engine:
            size = trt.volume(self.engine.get_binding_shape(binding))
            dtype = trt.nptype(self.engine.get_binding_dtype(binding))

            # Allocate host and device buffers
            host_mem = cuda.pagelocked_empty(size, dtype)
            device_mem = cuda.mem_alloc(host_mem.nbytes)

            self.bindings.append(int(device_mem))

            if self.engine.binding_is_input(binding):
                self.inputs.append({'host': host_mem, 'device': device_mem})
            else:
                self.outputs.append({'host': host_mem, 'device': device_mem})

    def infer(self, input_data):
        # Copy input to device
        np.copyto(self.inputs[0]['host'], input_data.ravel())
        cuda.memcpy_htod(self.inputs[0]['device'], self.inputs[0]['host'])

        # Run inference
        self.context.execute_v2(bindings=self.bindings)

        # Copy output to host
        cuda.memcpy_dtoh(self.outputs[0]['host'], self.outputs[0]['device'])

        return self.outputs[0]['host']

# Usage
engine = TensorRTInference("model.trt")

while True:
    image = get_camera_image()
    detections = engine.infer(image)
    process_detections(detections)
```

---

## 2.9 Learning Objectives

By completing this chapter, you should be able to:

### Knowledge Objectives
- [ ] **Explain** different perception tasks (detection, segmentation, pose estimation)
- [ ] **Describe** how to generate synthetic training data
- [ ] **List** AI models for robot perception

### Application Objectives
- [ ] **Train** object detection models using synthetic data
- [ ] **Implement** grasp planning with deep learning
- [ ] **Deploy** real-time perception pipelines
- [ ] **Use** vision-language models for robotics

---

## 2.10 Key Takeaways

:::tip Essential Concepts
1. **Synthetic data** from Isaac Sim trains AI models without real-world collection

2. **DOPE** estimates 6D object pose for manipulation

3. **Semantic segmentation** understands scene layout

4. **Grasp planning** can be learned from simulation

5. **TensorRT** optimizes models for real-time inference

6. **Multi-modal perception** combines vision, depth, and force
:::

---

## Next Steps

In the next chapter, we'll explore **Reinforcement Learning for Robot Control** - teaching robots through trial and error!

---

**Chapter 2 Complete! ✅**
