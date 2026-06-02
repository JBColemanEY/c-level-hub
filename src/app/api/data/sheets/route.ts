import { NextRequest, NextResponse } from "next/server";
import { getSheetData, getSheetNames } from "@/lib/google-sheets";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range");

  try {
    if (!range) {
      const names = await getSheetNames();
      return NextResponse.json({ sheets: names });
    }
    const data = await getSheetData(range);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Sheets API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
