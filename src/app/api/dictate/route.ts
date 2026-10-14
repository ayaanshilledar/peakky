import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log("[api/dictate] 📨 Incoming voice dictation request");
    const formData = await req.formData();
    const audioFile = formData.get("file") as Blob | null;

    if (!audioFile) {
      console.warn("[api/dictate] ⚠️ No audio file in FormData");
      return NextResponse.json(
        { error: "No audio file provided in request" },
        { status: 400 }
      );
    }

    console.log(`[api/dictate] Received audio blob: type=${audioFile.type}, size=${audioFile.size} bytes`);

    const apiKey = (
      process.env.GROQ_API_KEY ||
      process.env.OPENAI_API_KEY ||
      ""
    ).trim();

    if (!apiKey) {
      console.error("[api/dictate] ❌ No GROQ_API_KEY or OPENAI_API_KEY configured");
      return NextResponse.json(
        { error: "No API Key configured for transcription" },
        { status: 500 }
      );
    }

    // Determine target Whisper endpoint
    const isGroq = apiKey.startsWith("gsk_") || Boolean(process.env.GROQ_API_KEY);
    const targetUrl = isGroq
      ? "https://api.groq.com/openai/v1/audio/transcriptions"
      : "https://api.openai.com/v1/audio/transcriptions";

    const targetModel = isGroq ? "whisper-large-v3" : "whisper-1";

    console.log(`[api/dictate] Forwarding to ${isGroq ? "Groq" : "OpenAI"} (${targetModel})`);

    const groqFormData = new FormData();
    groqFormData.append("file", audioFile, "audio.webm");
    groqFormData.append("model", targetModel);
    groqFormData.append("response_format", "json");
    groqFormData.append("temperature", "0.2");
    groqFormData.append("language", "en");
    // Priming prompt directs Whisper decoder to expect developer speech/notes rather than video credits
    groqFormData.append("prompt", "Transcribe clear spoken notes, developer thoughts, commands, and tasks without video credits.");

    // Debug: in development, save audio buffer to disk to verify microphone captured audible speech
    if (process.env.NODE_ENV !== "production") {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const arrayBuf = await audioFile.arrayBuffer();
        const debugPath = path.resolve(process.cwd(), ".last_dictation.webm");
        fs.writeFileSync(debugPath, Buffer.from(arrayBuf));
        console.log(`[api/dictate] 💾 Debug audio saved to ${debugPath} (${arrayBuf.byteLength} bytes)`);
      } catch (saveErr) {
        console.warn("[api/dictate] Debug audio save warning:", saveErr);
      }
    }

    const startTime = Date.now();
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqFormData,
    });

    const elapsedMs = Date.now() - startTime;
    console.log(`[api/dictate] Upstream response: status=${response.status} in ${elapsedMs}ms`);

    if (!response.ok) {
      const errText = await response.text();
      console.error("[api/dictate] ❌ Upstream transcription error body:", errText);
      return NextResponse.json(
        { error: "Transcription service error", details: errText },
        { status: response.status }
      );
    }

    const data = await response.json();
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
      console.warn(`[api/dictate] ⚠️ Filtered out known Whisper silence hallucination: "${text}"`);
      text = "";
    }

    console.log(`[api/dictate] ✅ Transcribed text (${text.length} chars): "${text}"`);

    return NextResponse.json({ text });
  } catch (err: unknown) {
    console.error("[api/dictate] ❌ Unhandled route exception:", err);
    return NextResponse.json(
      { error: "Failed to transcribe audio", details: String(err) },
      { status: 500 }
    );
  }
}
