

# Chapter 2: Speech Recognition and Natural Language Understanding

## Overview

For a robot to be a true conversational partner, it must reliably convert audio to text (ASR) and extract meaning from that text (NLU). This chapter explores modern pipelines for speech processing in robotics, focusing on robustness against noise and intent classification.

:::info Learning Time
**Estimated Reading Time**: 45-55 minutes
**Hands-on Activities**: 40 minutes
**Total Chapter Time**: 1.5 hours
:::

---

## 2.1 The Audio Pipeline

### From Microphone to Meaning

1.  **Capture**: Microphone array captures sound.
2.  **Preprocessing**: Noise cancellation, beamforming (focusing on the speaker).
3.  **Wake Word Detection**: Low-power listening for "Hey Robot".
4.  **ASR (Automatic Speech Recognition)**: Audio → Text.
5.  **NLU (Natural Language Understanding)**: Text → Intent/Slots.

---

## 2.2 Wake Word Detection

### "Hey Robot!"

Running a full cloud ASR 24/7 is expensive and privacy-invasive. Robots use a small, local model to detect a specific trigger phrase.

**Tools:**
- **Porcupine (Picovoice)**: High accuracy, easy to use.
- **OpenWakeWord**: Open-source, runs on CPU.
- **Snowboy**: (Legacy, but concepts apply).

**Implementation Concept:**
```python
import porcupine
import pyaudio

def wake_word_listener():
    handle = porcupine.create(keywords=["jarvis"])
    stream = pyaudio.open(...)

    while True:
        pcm = stream.read(handle.frame_length)
        keyword_index = handle.process(pcm)
        if keyword_index >= 0:
            print("Wake word detected! Listening for command...")
            trigger_main_asr()
```

---

## 2.3 Automatic Speech Recognition (ASR)

### Whisper: The State of the Art

OpenAI's **Whisper** is a robust, open-source ASR model that handles accents and background noise exceptionally well.

**Running Whisper Locally:**
```python
import whisper

model = whisper.load_model("base")
result = model.transcribe("audio.mp3")
print(result["text"])
```

**Faster-Whisper:**
For real-time robotics, standard Whisper can be slow. `faster-whisper` uses CTranslate2 for up to 4x speedup.

**ROS 2 Integration:**
Create a node that publishes `std_msgs/String` whenever speech is transcribed.

```python
# ROS 2 Whisper Node (Conceptual)
class WhisperNode(Node):
    def __init__(self):
        self.model = whisper.load_model("small.en")
        self.publisher = self.create_publisher(String, 'speech_text', 10)

    def audio_callback(self, audio_data):
        text = self.model.transcribe(audio_data)
        msg = String()
        msg.data = text
        self.publisher.publish(msg)
```

---

## 2.4 Natural Language Understanding (NLU)

### Intents and Slots

Once we have text, we need structured data.
*   **Intent**: What does the user want? (e.g., `GetWeather`, `PickObject`)
*   **Slots (Entities)**: Parameters? (e.g., `location=London`, `object=cup`)

### Traditional NLU (Rasa / Snips)
Train a classifier on labeled sentences.
*   "Turn on the kitchen light" -> `Intent: TurnOn`, `Entity: Light`, `Location: Kitchen`

### LLM-based NLU
LLMs can perform "Zero-Shot NLU". You don't need to train a specific model; just describe the intents in the prompt (as seen in Chapter 1).

**Comparison:**
- **Traditional NLU**: Faster, cheaper, predictable, requires training data.
- **LLM NLU**: Flexible, no training data needed, slower, more expensive.

---

## 2.5 Handling Noise and Direction

### The Cocktail Party Problem
Robots often work in noisy environments (motors humming, fans, people talking).

**Hardware Solutions:**
- **Microphone Arrays**: ReSpeaker, Matrix Creator.
- **DOA (Direction of Arrival)**: The robot can determine *where* the sound is coming from and turn its head to face the speaker.

**Software Solutions:**
- **VAD (Voice Activity Detection)**: Only process audio when someone is actually speaking (e.g., WebRTC VAD, Silero VAD).
- **Noise Suppression**: Digital filtering to remove steady-state noise (fans).

---

## 2.6 Text-to-Speech (TTS)

### Giving the Robot a Voice

The interaction loop closes with the robot responding.

**Options:**
- **Cloud TTS**: Google Cloud TTS, Amazon Polly, OpenAI TTS (High quality, latency).
- **Local TTS**: Piper, Coqui TTS, eSpeak (Fast, privacy-friendly, robotic voice).

**Expressive TTS:**
Modern TTS can convey emotion (happy, sad, urgent), which is crucial for social robots.

---

## 2.7 Learning Objectives

By completing this chapter, you should be able to:

### Knowledge Objectives
- [ ] **Describe** the complete audio pipeline from wake word to NLU.
- [ ] **Compare** local vs. cloud ASR solutions.
- [ ] **Understand** the role of beamforming and noise suppression.

### Application Objectives
- [ ] **Implement** a wake-word detector using an open-source library.
- [ ] **Build** a speech-to-intent pipeline using Whisper and an LLM.
- [ ] **Create** a TTS node for robot feedback.

---

## 2.8 Key Takeaways

:::tip Essential Concepts
1.  **Wake Words** save power and privacy; don't stream everything to the cloud.
2.  **Whisper** is the current gold standard for robust ASR.
3.  **VAD** is critical to avoid processing silence or background noise.
4.  **Latency Matters**: For conversation, the total delay (ASR + LLM + TTS) should be under 1-2 seconds for a natural feel.
:::

---

## Next Steps

In the next chapter, we'll combine speech with vision and gestures in **Multi-modal Interaction**!
