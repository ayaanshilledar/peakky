"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceDictationState {
  isRecording: boolean;
  isTranscribing: boolean;
  audioLevel: number; // 0 to 100 for live waveform visualization
  frequencies: number[]; // 11-bar symmetrical fluid audio soundwave stream
  liveInterimText: string; // real-time live interim words as spoken
  recordingDuration: number; // live recording elapsed seconds
  lastTranscribedText: string | null;
  latencyMs: number | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
}

export function useVoiceDictation(
  onTranscribeSuccess?: (text: string, latencyMs?: number) => void
): VoiceDictationState {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencies, setFrequencies] = useState<number[]>([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
  const [liveInterimText, setLiveInterimText] = useState<string>("");
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [lastTranscribedText, setLastTranscribedText] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const maxAudioLevelRef = useRef<number>(0);
  const speechDetectedRef = useRef<boolean>(false);
  const silenceStartRef = useRef<number | null>(null);
  const isStoppingRef = useRef<boolean>(false);

  const cleanupAudio = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setAudioLevel(0);
    setFrequencies([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
  }, []);

  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const freqCount = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(freqCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    const normalized = Math.min(100, Math.round((average / 128) * 100));
    setAudioLevel(normalized);

    // Compute symmetrical 11-bar frequency spectrum [b5, b4, b3, b2, b1, b0, b1, b2, b3, b4, b5]
    const b0 = Math.min(100, Math.round((dataArray[1] || 0) / 2.2));
    const b1 = Math.min(100, Math.round((dataArray[2] || 0) / 2.2));
    const b2 = Math.min(100, Math.round((dataArray[4] || 0) / 2.2));
    const b3 = Math.min(100, Math.round((dataArray[6] || 0) / 2.2));
    const b4 = Math.min(100, Math.round((dataArray[8] || 0) / 2.2));
    const b5 = Math.min(100, Math.round((dataArray[10] || 0) / 2.2));
    setFrequencies([b5, b4, b3, b2, b1, b0, b1, b2, b3, b4, b5]);

    if (normalized > maxAudioLevelRef.current) {
      maxAudioLevelRef.current = normalized;
    }

    // Voice Activity Detection (VAD)
    if (normalized > 14) {
      speechDetectedRef.current = true;
      silenceStartRef.current = null;
    } else if (speechDetectedRef.current && normalized < 8) {
      if (!silenceStartRef.current) {
        silenceStartRef.current = Date.now();
      }
    }

    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      console.log("[Dictation] 🎙️ Starting ultra-fast dictation stream...");
      setError(null);
      setLiveInterimText("");
      setRecordingDuration(0);
      audioChunksRef.current = [];
      maxAudioLevelRef.current = 0;
      speechDetectedRef.current = false;
      silenceStartRef.current = null;
      isStoppingRef.current = false;

      // 16kHz mono is native Whisper input format — avoids server-side resampling & reduces bandwidth 4x
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Setup audio analyzer for live waveform & VAD
      const visualizerStream = stream.clone();
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx({ sampleRate: 16000 });
        audioContextRef.current = audioCtx;

        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        const source = audioCtx.createMediaStreamSource(visualizerStream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        monitorAudioLevel();
      } catch (audioCtxErr) {
        console.warn("[Dictation] AudioContext visualizer init warning:", audioCtxErr);
      }

      // Configure MediaRecorder with lightweight Opus mono (32kbps)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000,
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      // 250ms timeslice: pre-encodes audio chunks in real-time as you speak
      mediaRecorder.start(250);
      setIsRecording(true);

      // Duration counter
      const startTimestamp = Date.now();
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimestamp) / 1000));
      }, 1000);

      // Optional live speech recognition for real-time live interim text stream
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          try {
            const recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onresult = (event: any) => {
              let text = "";
              for (let i = 0; i < event.results.length; i++) {
                text += event.results[i][0].transcript;
              }
              if (text) setLiveInterimText(text.trim());
            };
            recognition.onerror = () => {};
            recognition.start();
            recognitionRef.current = recognition;
          } catch (_) {}
        }
      }

      console.log("[Dictation] 🔴 Recording active with live stream");
    } catch (err: unknown) {
      console.error("[Dictation] ❌ Failed to start recording:", err);
      setError("Microphone permission denied or unavailable");
      cleanupAudio();
    }
  }, [cleanupAudio, monitorAudioLevel]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || !isRecording || isStoppingRef.current) {
      cleanupAudio();
      setIsRecording(false);
      return null;
    }

    isStoppingRef.current = true;
    console.log("[Dictation] 🛑 stopRecording triggered");

    return new Promise<string | null>((resolve) => {
      const recorder = mediaRecorderRef.current!;

      recorder.onstop = async () => {
        cleanupAudio();
        setIsRecording(false);
        isStoppingRef.current = false;

        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          console.warn("[Dictation] ⚠️ No audio chunks captured");
          resolve(null);
          return;
        }

        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        console.log(`[Dictation] Audio ready: ${audioBlob.size} bytes, peakLevel: ${maxAudioLevelRef.current}`);

        // Reject if less than 400 bytes or zero energy (avoids silence hallucinations)
        if (audioBlob.size < 400 || maxAudioLevelRef.current < 2) {
          console.warn("[Dictation] ⚠️ Silence / empty utterance detected; skipping transcription");
          resolve(null);
          return;
        }

        setIsTranscribing(true);
        const startTime = Date.now();

        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "dictation.webm");

          const res = await fetch("/api/dictate", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Server returned ${res.status}: ${errBody}`);
          }

          const data = await res.json();
          const transcribedText = (data.text || "").trim();
          const elapsed = data.latencyMs || Date.now() - startTime;
          setLatencyMs(elapsed);

          console.log(`[Dictation] ⚡ Transcribed in ${elapsed}ms: "${transcribedText}"`);

          if (transcribedText) {
            setLastTranscribedText(transcribedText);
            onTranscribeSuccess?.(transcribedText, elapsed);
            resolve(transcribedText);
          } else {
            resolve(null);
          }
        } catch (err: unknown) {
          console.error("[Dictation] ❌ Transcription failed:", err);
          setError("Failed to transcribe audio.");
          resolve(null);
        } finally {
          setIsTranscribing(false);
        }
      };

      try {
        if (recorder.state === "recording") {
          recorder.requestData();
        }
      } catch (reqErr) {
        console.warn("[Dictation] requestData warning:", reqErr);
      }
      recorder.stop();
    });
  }, [cleanupAudio, isRecording, onTranscribeSuccess]);

  const cancelRecording = useCallback(() => {
    isStoppingRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    cleanupAudio();
    setIsRecording(false);
    setIsTranscribing(false);
    audioChunksRef.current = [];
  }, [cleanupAudio]);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    isRecording,
    isTranscribing,
    audioLevel,
    frequencies,
    liveInterimText,
    recordingDuration,
    lastTranscribedText,
    latencyMs,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}

