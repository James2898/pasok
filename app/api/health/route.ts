import { NextResponse } from "next/server";
import { getManilaToday } from "@/lib/time";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    manilaToday: getManilaToday(),
  });
}
