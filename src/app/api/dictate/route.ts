import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const requestStart = Date.now();
  try {
    const formData = await req.formData();
    const audioFile = formData.get("file") as Blob | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided in request" },
        { status: 400 }
      );
    }

    const groqKey = (process.env.GROQ_API_KEY || "").trim();
    const openaiKey = (process.env.OPENAI_API_KEY || "").trim();
    const assemblyKey = (process.env.ASSEMBLYAI_API_KEY || "").trim();
    const elevenKey = (process.env.ELEVENLABS_API_KEY || "").trim();

    // 1. ELEVENLABS SCRIBE (If explicitly configured)
    if (elevenKey && process.env.DICTATION_PROVIDER === "elevenlabs") {
      console.log("[api/dictate] 🎙️ Using ElevenLabs Scribe API");
      const elevenFormData = new FormData();
      elevenFormData.append("file", audioFile, "audio.webm");
      elevenFormData.append("model_id", "scribe_v1");

      const elevenRes = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": elevenKey },
        body: elevenFormData,
      });

      if (elevenRes.ok) {
        const elevenData = await elevenRes.json();
        const text = (elevenData.text || "").trim();
        return NextResponse.json({
          text,
          provider: "elevenlabs",
          latencyMs: Date.now() - requestStart,
        });
      }
      console.warn("[api/dictate] ElevenLabs failed, falling back to Groq/Whisper");
    }

    // 2. ASSEMBLYAI (If explicitly configured)
    if (assemblyKey && process.env.DICTATION_PROVIDER === "assemblyai") {
      console.log("[api/dictate] 🎙️ Using AssemblyAI Universal-1");
      const arrayBuffer = await audioFile.arrayBuffer();
      const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: {
          authorization: assemblyKey,
          "content-type": "application/octet-stream",
        },
        body: arrayBuffer,
      });

      if (uploadRes.ok) {
        const { upload_url } = await uploadRes.json();
        const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
          method: "POST",
          headers: {
            authorization: assemblyKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            audio_url: upload_url,
            speech_model: "nano", // Nano model for fast sub-second turnaround
          }),
        });

        if (transcriptRes.ok) {
          const { id } = await transcriptRes.json();
          // Poll for completion (nano model completes in 500-1000ms)
          let completed = false;
          let transcriptText = "";
          for (let i = 0; i < 15; i++) {
            await new Promise((r) => setTimeout(r, 250));
            const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
              headers: { authorization: assemblyKey },
            });
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.status === "completed") {
                transcriptText = pollData.text || "";
                completed = true;
                break;
              } else if (pollData.status === "error") {
                break;
              }
            }
          }

          if (completed) {
            return NextResponse.json({
              text: transcriptText.trim(),
              provider: "assemblyai",
              latencyMs: Date.now() - requestStart,
            });
          }
        }
      }
      console.warn("[api/dictate] AssemblyAI failed, falling back to Groq/Whisper");
    }

    // 3. GROQ WHISPER TURBO (FASTEST IN THE WORLD - SUB-200ms)
    // Default to Groq LPU if Groq key or OpenAI key starting with 'gsk_' is present
    const isGroq = groqKey.length > 0 || openaiKey.startsWith("gsk_");
    const apiKey = isGroq ? (groqKey || openaiKey) : openaiKey;

    if (!apiKey) {
      console.error("[api/dictate] ❌ No GROQ_API_KEY or OPENAI_API_KEY configured");
      return NextResponse.json(
        { error: "No API Key configured for transcription" },
        { status: 500 }
      );
    }

    const targetUrl = isGroq
      ? "https://api.groq.com/openai/v1/audio/transcriptions"
      : "https://api.openai.com/v1/audio/transcriptions";

    // whisper-large-v3-turbo is ~8x faster than whisper-large-v3, completing in ~120-200ms on Groq LPUs
    const targetModel = isGroq ? "whisper-large-v3-turbo" : "whisper-1";

    const upstreamFormData = new FormData();
    upstreamFormData.append("file", audioFile, "audio.webm");
    upstreamFormData.append("model", targetModel);
    upstreamFormData.append("response_format", "json");
    // Greedy decoding (temperature 0) eliminates sampling cycles for maximum speed
    upstreamFormData.append("temperature", "0");
    upstreamFormData.append("language", "en");
    upstreamFormData.append(
      "prompt",
      "Developer notes, code commands, dictation thoughts, clear punctuation."
    );

    const upstreamResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstreamFormData,
    });

    const elapsedMs = Date.now() - requestStart;
    console.log(`[api/dictate] ⚡ ${isGroq ? "Groq Turbo" : "OpenAI"} responded in ${elapsedMs}ms (HTTP ${upstreamResponse.status})`);

    if (!upstreamResponse.ok) {
      const errText = await upstreamResponse.text();
      console.error("[api/dictate] ❌ Upstream transcription error:", errText);
      return NextResponse.json(
        { error: "Transcription service error", details: errText },
        { status: upstreamResponse.status }
      );
    }

    const data = await upstreamResponse.json();
    let text = (data.text || "").trim();

    // Blacklist filter against known Whisper silence / YouTube dataset hallucinations
    const SILENCE_HALLUCINATIONS = [
      "thank you.",
      "thank you",
      "thanks for watching.",
      "thanks for watching",
      "thank you for watching.",
      "thank you for watching",
      "subtitles by",
      "bye.",
      "bye",
      "you",
      ".",
    ];

    if (SILENCE_HALLUCINATIONS.includes(text.toLowerCase())) {
      text = "";
    }

    return NextResponse.json({
      text,
      provider: isGroq ? "groq-whisper-turbo" : "openai",
      latencyMs: elapsedMs,
    });
  } catch (err: unknown) {
    console.error("[api/dictate] ❌ Unhandled route exception:", err);
    return NextResponse.json(
      { error: "Failed to transcribe audio", details: String(err) },
      { status: 500 }
    );
  }
}

