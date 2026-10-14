"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceDictationState {
  isRecording: boolean;
  isTranscribing: boolean;
  audioLevel: number; // 0 to 100 for live waveform visualization
  lastTranscribedText: string | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
}

export function useVoiceDictation(onTranscribeSuccess?: (text: string) => void): VoiceDictationState {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [lastTranscribedText, setLastTranscribedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupAudio = useCallback(() => {
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
    setAudioLevel(0);
  }, []);

  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    // Normalize roughly to 0 - 100 with sensitivity curve
    const normalized = Math.min(100, Math.round((average / 128) * 100));
    setAudioLevel(normalized);

    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Setup audio analysis for live waveform animation
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      monitorAudioLevel();

      // Configure MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100); // 100ms chunks
      setIsRecording(true);
    } catch (err: unknown) {
      console.error("Failed to start voice recording:", err);
      setError("Microphone permission denied or unavailable");
      cleanupAudio();
    }
  }, [cleanupAudio, monitorAudioLevel]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      cleanupAudio();
      setIsRecording(false);
      return null;
    }

    return new Promise<string | null>((resolve) => {
      const recorder = mediaRecorderRef.current!;

      recorder.onstop = async () => {
        cleanupAudio();
        setIsRecording(false);

        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          resolve(null);
          return;
        }

        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        if (audioBlob.size < 1000) {
          // Extremely small audio (silence or accidental quick tap)
          resolve(null);
          return;
        }

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "dictation.webm");

          const res = await fetch("/api/dictate", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`Server returned ${res.status}`);
          }

          const data = await res.json();
          const transcribedText = (data.text || "").trim();

          if (transcribedText) {
            setLastTranscribedText(transcribedText);
            onTranscribeSuccess?.(transcribedText);
            resolve(transcribedText);
          } else {
            resolve(null);
          }
        } catch (err: unknown) {
          console.error("Transcription failed:", err);
          setError("Failed to transcribe audio.");
          resolve(null);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.stop();
    });
  }, [cleanupAudio, isRecording, onTranscribeSuccess]);

  const cancelRecording = useCallback(() => {
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
    lastTranscribedText,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
