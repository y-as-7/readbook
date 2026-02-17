import { Anthropic } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    const key = process.env.ANTHROPIC_API_KEY.trim();

    const anthropic = new Anthropic({
      apiKey: key,
    });

    let systemPrompt = "You are a helpful AI assistant integrated into a book reader. ";
    
    if (context) {
      systemPrompt += `The user has selected the following text from the book: "${context}". Please provide explanations, definitions, or context for this selection when asked.`;
    }

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = response.content[0];
    if (content.type === 'text') {
        return NextResponse.json({ message: content.text });
    } else {
        return NextResponse.json({ error: "Unexpected response format" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Claude API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
