import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("file") as Blob | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided in request" },
        { status: 400 }
      );
    }

    const apiKey = (
      process.env.GROQ_API_KEY ||
      process.env.OPENAI_API_KEY ||
      ""
    ).trim();

    if (!apiKey) {
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

    const groqFormData = new FormData();
    groqFormData.append("file", audioFile, "audio.webm");
    groqFormData.append("model", targetModel);
    groqFormData.append("response_format", "json");
    groqFormData.append("temperature", "0");

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Whisper transcription error:", errText);
      return NextResponse.json(
        { error: "Transcription service error", details: errText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = (data.text || "").trim();

    return NextResponse.json({ text });
  } catch (err: unknown) {
    console.error("Voice dictation error:", err);
    return NextResponse.json(
      { error: "Failed to transcribe audio", details: String(err) },
      { status: 500 }
    );
  }
}
