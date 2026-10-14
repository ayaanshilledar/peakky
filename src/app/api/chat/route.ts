import { NextResponse } from "next/server";
import { ChatApiRequestPayload, ChatApiResponsePayload, PeakyAppContext } from "../../types/chat";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body: ChatApiRequestPayload = await req.json();
    const { messages, apiKey, baseUrl, model, context, longTermMemories } = body;

    let rawKey = (
      apiKey ||
      process.env.OPENAI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.LLM_API_KEY ||
      ""
    ).trim();

    const userApiKey = rawKey;

    if (!userApiKey) {
      return NextResponse.json(
        {
          error: "No API Key configured. Please set your OpenAI or Groq API Key in Peaky Settings or .env.local file.",
        },
        { status: 400 }
      );
    }

    // Detect Provider & Base URL
    const isGroq = userApiKey.startsWith("gsk_") || Boolean(process.env.GROQ_API_KEY);
    const isOpenAI = userApiKey.startsWith("sk-") || Boolean(process.env.OPENAI_API_KEY);

    const targetBaseUrl = (
      process.env.LLM_BASE_URL ||
      (isGroq ? process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1" : "") ||
      (isOpenAI ? process.env.OPENAI_BASE_URL || "https://api.openai.com/v1" : "") ||
      baseUrl ||
      "https://api.openai.com/v1"
    ).trim().replace(/\/+$/, "");

    // Automatic Model Resolution: matching model to active API Key Provider
    let targetModel = (
      process.env.LLM_MODEL ||
      (isGroq ? process.env.GROQ_MODEL : "") ||
      (isOpenAI ? process.env.OPENAI_MODEL : "") ||
      model ||
      ""
    ).trim();

    if (!targetModel || targetModel === "auto") {
      targetModel = isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";
    } else {
      // Cross-provider auto correction: prevent 404 model_not_found errors
      if (isOpenAI && targetModel.includes("llama")) {
        targetModel = "gpt-4o-mini";
      } else if (isGroq && targetModel.includes("gpt")) {
        targetModel = "llama-3.3-70b-versatile";
      }
    }

    const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";

    // Assemble Real-Time Context Summary
    const contextSummaryLines = [
      `=== REAL-TIME PEAKY APP CONTEXT ===`,
      `[Focus Timer]: ${context.timer.isRunning ? "RUNNING ⏱️" : "PAUSED ⏸️"} (${context.timer.formattedTime} remaining)`,
      `[Active Tasks (${context.tasks.activeCount})]: ${context.tasks.activeTitles.length > 0 ? context.tasks.activeTitles.join("; ") : "None"}`,
      `[Calendar Events]: ${context.calendar.currentOrNextEventTitle ? `Next: "${context.calendar.currentOrNextEventTitle}" at ${context.calendar.currentOrNextEventTime || "soon"}` : "No upcoming meetings"}`,
      `[Recent Clipboard Items (${context.clips.totalClips})]: ${context.clips.recentClips.map((c) => `"${c.text.slice(0, 60)}..."`).join(" | ") || "None"}`,
      context.profileName ? `[User Name]: ${context.profileName}` : "",
    ].filter(Boolean).join("\n");

    // Assemble Long-Term Memories Summary
    const memorySummary = longTermMemories && longTermMemories.length > 0
      ? `=== LONG-TERM MEMORIES (REMEMBERED FACTS ABOUT USER) ===\n${longTermMemories.map((m, idx) => `${idx + 1}. ${m}`).join("\n")}`
      : "=== LONG-TERM MEMORIES ===\nNo saved facts yet.";

    const systemPrompt = `You are Peaky AI, a sharp, ultra-helpful, and concise desktop assistant integrated directly into Peaky's Dynamic Island notch.

${contextSummaryLines}

${memorySummary}

INSTRUCTIONS:
1. CROSS-VERIFY REAL-TIME CONTEXT: When the user asks about their tasks, schedule, timer, or clipboard, ALWAYS cross-reference the REAL-TIME PEAKY APP CONTEXT above and cite relevant details accurately.
2. FUNCTION TOOLS & ACTIONS: You have tools to manage tasks (create_task, complete_task, delete_task, clear_completed_tasks), control the focus timer (start_focus_timer, pause_focus_timer, reset_focus_timer), and remember facts (save_memory). Use these tools proactively whenever the user requests an action!
3. LONG-TERM MEMORY: Respect all saved facts about the user's habits, preferences, tech stacks, and project details.
4. CONCISE & TACTILE: Keep responses succinct, clear, and direct, ideally within 2-4 sentences unless detailed code or step-by-step guidance is requested.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "create_task",
          description: "Create a new task in the user's Peaky task list.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "The title or description of the task to add" },
            },
            required: ["title"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "complete_task",
          description: "Mark an existing active task as completed.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "The title or keyword of the task to complete" },
            },
            required: ["title"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "delete_task",
          description: "Delete a task from the user's task list.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "The title or keyword of the task to delete" },
            },
            required: ["title"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "clear_completed_tasks",
          description: "Remove all completed tasks from the task list.",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function",
        function: {
          name: "start_focus_timer",
          description: "Start or update the Pomodoro focus timer with a target duration.",
          parameters: {
            type: "object",
            properties: {
              durationMinutes: { type: "number", description: "Duration in minutes (e.g. 25, 45, 60)" },
            },
            required: ["durationMinutes"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "pause_focus_timer",
          description: "Pause the currently running focus timer.",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function",
        function: {
          name: "reset_focus_timer",
          description: "Reset the focus timer back to its initial duration.",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function",
        function: {
          name: "save_memory",
          description: "Save an important fact, preference, or project detail about the user into long-term memory.",
          parameters: {
            type: "object",
            properties: {
              fact: { type: "string", description: "The fact to remember" },
            },
            required: ["fact"],
          },
        },
      },
    ];

    const payloadMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(`${targetBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userApiKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: payloadMessages,
        temperature: 0.7,
        max_tokens: 600,
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("LLM Provider error:", response.status, errText);
      return NextResponse.json(
        {
          error: `LLM API Error (${response.status}): ${errText.slice(0, 150)}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const responseMessage = data.choices?.[0]?.message;
    let replyContent = responseMessage?.content || "";
    const toolCalls = responseMessage?.tool_calls;

    // If reply is empty but tool calls were generated, construct human response
    if (!replyContent && toolCalls && toolCalls.length > 0) {
      replyContent = buildResponseFromToolCalls(toolCalls);
    }

    // Auto fact extraction check
    const extractedMemories = extractFactFromPrompt(lastUserMessage);

    const verifiedSources: string[] = [];
    if (lastUserMessage.toLowerCase().includes("task") || lastUserMessage.toLowerCase().includes("todo")) verifiedSources.push("Tasks");
    if (lastUserMessage.toLowerCase().includes("calendar") || lastUserMessage.toLowerCase().includes("meeting")) verifiedSources.push("Calendar");
    if (lastUserMessage.toLowerCase().includes("clip") || lastUserMessage.toLowerCase().includes("copy")) verifiedSources.push("Clipboard");
    if (lastUserMessage.toLowerCase().includes("timer") || lastUserMessage.toLowerCase().includes("focus")) verifiedSources.push("Timer");

    const result: ChatApiResponsePayload = {
      reply: replyContent,
      extractedMemories,
      sources: verifiedSources.length > 0 ? verifiedSources : undefined,
      usedModel: targetModel,
      toolCalls,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in /api/chat route:", error);
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 }
    );
  }
}

// Build friendly assistant text when tool calls return without explicit content
function buildResponseFromToolCalls(toolCalls: any[]): string {
  const summaries: string[] = [];
  for (const call of toolCalls) {
    try {
      const name = call.function?.name;
      const args = typeof call.function?.arguments === "string" ? JSON.parse(call.function.arguments) : call.function?.arguments || {};
      if (name === "create_task") summaries.push(`Created task: "${args.title}"`);
      else if (name === "complete_task") summaries.push(`Completed task: "${args.title}"`);
      else if (name === "delete_task") summaries.push(`Deleted task: "${args.title}"`);
      else if (name === "clear_completed_tasks") summaries.push(`Cleared completed tasks.`);
      else if (name === "start_focus_timer") summaries.push(`Started ${args.durationMinutes || 25}-minute Focus Timer.`);
      else if (name === "pause_focus_timer") summaries.push(`Paused Focus Timer.`);
      else if (name === "reset_focus_timer") summaries.push(`Reset Focus Timer.`);
      else if (name === "save_memory") summaries.push(`Saved to long-term memory: "${args.fact}"`);
    } catch {}
  }
  return summaries.length > 0 ? summaries.join("\n") : "Executed action successfully.";
}

// Utility to auto-detect personal facts in user messages
function extractFactFromPrompt(prompt: string): string[] | undefined {
  const p = prompt.trim();
  const lower = p.toLowerCase();
  const extracted: string[] = [];

  if (lower.startsWith("my name is ") || lower.includes(" my name is ")) {
    extracted.push(p);
  } else if (lower.includes("i work on ") || lower.includes("i am working on ") || lower.includes("i'm working on ")) {
    extracted.push(p);
  } else if (lower.includes("my tech stack is ") || lower.includes("i use ") || lower.includes("my preference is ")) {
    extracted.push(p);
  } else if (lower.startsWith("remember ") || lower.startsWith("save memory ")) {
    const cleanFact = p.replace(/^(remember|save memory)\s*(that|:)?\s*/i, "");
    if (cleanFact) extracted.push(cleanFact);
  }

  return extracted.length > 0 ? extracted : undefined;
}
