// voice-call.ts
// Handles real-time WebRTC connection to Lyzr Voice Agent via LiveKit Client SDK.

import { Room, RoomEvent, Track } from "livekit-client";

export function initVoiceCall(): void {
  // DOM Elements
  const floatingToggle = document.getElementById("voice-call-toggle");
  const overlay = document.getElementById("voice-call-overlay");
  const closeBtn = document.getElementById("voice-call-close");
  const statusEl = document.getElementById("voice-call-status");
  const waveContainer = document.getElementById("voice-call-waves");
  const muteBtn = document.getElementById("voice-call-mute");

  if (!floatingToggle || !overlay || !closeBtn || !statusEl || !waveContainer || !muteBtn) {
    console.warn("Voice call elements not found in DOM. Skipping voice call initialization.");
    return;
  }

  // Audio & LiveKit state variables
  let room: Room | null = null;
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let microphone: MediaStreamAudioSourceNode | null = null;

  let isCallActive = false;
  let isMuted = false;
  let isSpeaking = false; // AI is speaking (from active speakers)
  let animationFrameId = 0;

  // Visualizer bars
  const waveBars: HTMLElement[] = [];
  const totalBars = 15;
  waveContainer.innerHTML = "";
  for (let i = 0; i < totalBars; i++) {
    const bar = document.createElement("div");
    bar.className = "voice-wave-bar";
    waveContainer.appendChild(bar);
    waveBars.push(bar);
  }

  // Setup click triggers
  floatingToggle.addEventListener("click", () => startCall());
  closeBtn.addEventListener("click", () => endCall());

  // Inject CTA trigger button
  const ctaContainer = document.querySelector(".social-links");
  if (ctaContainer && !document.getElementById("cta-voice-call")) {
    const newCtaBtn = document.createElement("button");
    newCtaBtn.id = "cta-voice-call";
    newCtaBtn.className = "social-btn is-button";
    newCtaBtn.style.background = "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)";
    newCtaBtn.innerHTML = `<span class="social-icon">📞</span> Start AI Voice Call`;
    newCtaBtn.addEventListener("click", () => startCall());
    ctaContainer.insertBefore(newCtaBtn, ctaContainer.firstChild);
  }

  muteBtn.addEventListener("click", () => toggleMute());

  // Center mic icon toggles mute as well
  const pulseRing = document.querySelector(".pulse-ring-container");
  pulseRing?.addEventListener("click", () => {
    if (isCallActive) {
      toggleMute();
    }
  });

  // Main status update helper
  function updateStatus(text: string, stateClass: string = "") {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = "voice-call-status " + stateClass;

    // Pulse animation based on status
    const ring = document.querySelector(".pulse-ring-outer");
    if (ring) {
      ring.className = "pulse-ring-outer " + (stateClass || "idle");
    }
  }

  // Toggle local participant mute status
  async function toggleMute() {
    if (!room || !isCallActive) return;
    try {
      isMuted = !isMuted;
      await room.localParticipant.setMicrophoneEnabled(!isMuted);
      muteBtn.classList.toggle("muted", isMuted);
      muteBtn.innerHTML = isMuted ? "🔇 Unmute" : "🎙️ Mute";
      updateStatus(isMuted ? "Microphone Muted" : "Listening...", isMuted ? "muted" : "listening");
    } catch (err) {
      console.error("Error toggling mute status:", err);
    }
  }

  // Connect to LiveKit room via Vite secure proxy
  async function startCall() {
    if (isCallActive) return;

    isCallActive = true;
    overlay?.classList.remove("hidden");
    updateStatus("Connecting to Sahyog...", "connecting");

    try {
      // 1. Request room credentials from Vite proxy
      const response = await fetch("/api/voice-call/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to start Lyzr voice session");
      }

      const data = await response.json() as {
        userToken: string;
        roomName: string;
        sessionId: string;
        livekitUrl: string;
      };

      console.log("[VoiceCall] Received LiveKit session credentials", {
        roomName: data.roomName,
        sessionId: data.sessionId,
        livekitUrl: data.livekitUrl
      });

      // 2. Initialize the LiveKit Room
      room = new Room();

      // Handle remote tracks subscribed (AI voice agent audio stream)
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          audioElement.id = "lyzr-voice-audio";
          document.body.appendChild(audioElement);
          console.log("[VoiceCall] Attached remote AI audio stream successfully");
        }
      });

      // Handle track unsubscribed cleanup
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          track.detach();
          const el = document.getElementById("lyzr-voice-audio");
          if (el) el.remove();
          console.log("[VoiceCall] Detached remote AI audio stream");
        }
      });

      // Handle active speaker changes to update status and visualizer mode
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        if (!room) return;
        const remoteSpeaker = speakers.some(s => s !== room.localParticipant);
        isSpeaking = remoteSpeaker;
        if (isSpeaking) {
          updateStatus("Sahyog Speaking...", "speaking");
        } else if (!isMuted) {
          updateStatus("Listening...", "listening");
        }
      });

      // 3. Connect client to LiveKit WebRTC server
      await room.connect(data.livekitUrl, data.userToken);
      console.log("[VoiceCall] Connected to LiveKit room successfully");

      // 4. Enable local microphone
      await room.localParticipant.setMicrophoneEnabled(true);
      console.log("[VoiceCall] Local microphone track published");

      isMuted = false;
      muteBtn.classList.remove("muted");
      muteBtn.innerHTML = "🎙️ Mute";
      updateStatus("Connected! I am listening...", "listening");

      // 5. Connect local mic to Web Audio context for local volume visualizer
      setupLocalAnalyser();

      // 6. Start the drawing visualizer loop
      startVisualizer();

    } catch (err: any) {
      console.error("Error starting Lyzr voice session:", err);
      updateStatus(err.message || "Failed to connect. Please check settings.", "error");
      isCallActive = false;
      setTimeout(() => endCall(), 4000);
    }
  }

  // Bind local mic track to Web Audio Analyser
  function setupLocalAnalyser() {
    if (!room) return;
    try {
      const micTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone)?.track;
      if (micTrack && micTrack.mediaStreamTrack) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        const micStream = new MediaStream([micTrack.mediaStreamTrack]);
        microphone = audioContext.createMediaStreamSource(micStream);
        microphone.connect(analyser);
        console.log("[VoiceCall] Web Audio Analyser successfully bound to local mic track");
      }
    } catch (err) {
      console.warn("Failed to set up Web Audio Analyser for local mic:", err);
    }
  }

  // Visualizer loop (updates height of visualizer bars)
  function startVisualizer() {
    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      if (!isCallActive) return;

      animationFrameId = requestAnimationFrame(draw);

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      const rawValues = Array.from(dataArray);
      const step = Math.max(1, Math.floor(rawValues.length / totalBars));

      waveBars.forEach((bar, index) => {
        let value = analyser ? (rawValues[index * step] || 0) : 0;

        // If AI is speaking or muted, suppress mic visualizer
        if (isSpeaking) {
          // Simulate dynamic AI talking waves
          value = Math.sin(Date.now() * 0.015 + index) * 35 + 45;
        } else if (isMuted) {
          value = 0;
        }

        const heightPercentage = Math.min(Math.max((value / 255) * 100, 8), 100);
        bar.style.height = `${heightPercentage}%`;
      });
    }

    draw();
  }

  // Terminate room session and clean up resources
  function endCall() {
    isCallActive = false;
    isSpeaking = false;

    // Disconnect from LiveKit room
    if (room) {
      try {
        room.disconnect();
      } catch (err) {
        console.warn("Error disconnecting LiveKit room:", err);
      }
      room = null;
    }

    // Cancel animation frame
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }

    // Clean up Web Audio context
    if (audioContext && audioContext.state !== "closed") {
      try {
        audioContext.close();
      } catch (err) {
        console.warn("Error closing audio context:", err);
      }
      audioContext = null;
    }

    analyser = null;
    microphone = null;

    // Detach and remove remote audio element
    const el = document.getElementById("lyzr-voice-audio");
    if (el) el.remove();

    overlay?.classList.add("hidden");
    updateStatus("Call Ended", "idle");
  }
}
