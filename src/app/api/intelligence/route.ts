import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSheetsContext } from "@/lib/sheets-context";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BUSINESS_CONTEXT = {
  company: "Entity Y (Pty) Ltd — Performance Marketing Agency, South Africa",
  financial_year: "2026 (Jan–Dec)",
  currency: "ZAR (all figures VAT-exclusive)",

  cash: 1243823,
  monthly_burn: 343858,
  cash_runway_months: 3.6,
  working_capital: 384665,
  current_ratio: 0.60,

  mrr: 359764,
  active_clients: 19,
  ytd_revenue: 1723321,
  ytd_target: 2030000,
  ytd_variance: -306679,
  annual_target: 5030000,

  monthly_pnl: [
    { month: "Jan", revenue: 263004, expenses: 300161, profit: 2852, target: 300000 },
    { month: "Feb", revenue: 318764, expenses: 318979, profit: 24785, target: 310000 },
    { month: "Mar", revenue: 379801, expenses: 338424, profit: 96463, target: 330000 },
    { month: "Apr", revenue: 393988, expenses: 370495, profit: 23493, target: 360000 },
    { month: "May", revenue: 367764, expenses: 393060, profit: 108056, target: 385000 },
  ],

  total_receivables: 1355203,
  overdue_receivables: 1246305,
  overdue_invoices: 49,
  total_invoices: 51,
  pridebet_outstanding: 198639,

  breakeven_buffer: 15906,
  breakeven_buffer_pct: 4.4,
  short_term_contracts_at_risk: 196949,
  steam_bar_ending: true,

  dec2025_cash: 644338,
  dec2025_annual_revenue: 3303548,
  dec2025_profit: 828614,
  dec2025_margin: 27,

  avg_client_value: 17131,
  avg_client_lifespan_months: 6.9,
  clv: 118603,
};

export async function POST(req: NextRequest) {
  try {
    const { module, question, history = [] } = await req.json();

    // Fetch live Sheets context (non-blocking — falls back gracefully)
    let sheetsContext = "";
    try {
      const ctx = await getSheetsContext();
      sheetsContext = ctx.rawSummary;
    } catch {
      sheetsContext = "";
    }

    const systemPrompt = `You are the Chief Intelligence Officer for Entity Y, a South African performance marketing agency. You have real-time access to financial, operational, and client data across all departments.

Your role:
- Provide sharp, executive-level insights — not summaries
- Identify patterns, risks, and opportunities across departments
- Be direct, specific, and actionable
- Always relate insights to business decisions
- Format responses concisely with bullet points where helpful
- Currency is ZAR (VAT-exclusive). Use R prefix. Format: R1.24M, R360K, R15.9K
- Today is ${new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
- When live sheet data and static context differ, ALWAYS prefer the live sheet data

Static business context (use as fallback if live data unavailable):
${JSON.stringify(BUSINESS_CONTEXT, null, 2)}

${sheetsContext ? `Live data from Google Sheets (authoritative — use this over static context):\n${sheetsContext}` : ""}

Module context: ${module || "Overview / Cross-department"}`;

    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: "user", content: question },
    ];

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ response: text, usage: response.usage });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Intelligence request failed" }, { status: 500 });
  }
}
