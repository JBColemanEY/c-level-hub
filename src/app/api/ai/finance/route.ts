import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the Senior Financial Manager for Entity Y, a South African digital marketing agency.
You have direct access to live Xero accounting data. Your role mirrors that of a C-suite CFO:
- You provide sharp, actionable financial insights — not just summaries
- You identify risks, opportunities, and anomalies in the numbers
- You speak in plain English with a senior executive tone — confident, direct, no fluff
- You always relate numbers back to business decisions and strategy
- Currency is ZAR (South African Rand). Format large numbers clearly (e.g. R1.2M, R450K)
- Today's date is ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}

When given financial data, proactively surface:
1. The most critical insight or risk right now
2. Cash flow health and runway
3. Profitability trends and what's driving them
4. One concrete action the executive should take this week`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, financialData, conversationHistory = [] } = body;

    const dataContext = financialData
      ? `\n\nLIVE XERO DATA (as of ${financialData.last_refreshed}):\n${JSON.stringify(financialData, null, 2)}`
      : "";

    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory,
      {
        role: "user",
        content: message + dataContext,
      },
    ];

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({
      response: text,
      usage: response.usage,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
