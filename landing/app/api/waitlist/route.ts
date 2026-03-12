import { NextResponse } from "next/server";
import { createServerSupabase } from "../../lib/supabase";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email format" }, { status: 400 });
    }

    const sb = createServerSupabase();
    const { error } = await sb.from("warden_waitlist").insert({ email: email.toLowerCase().trim() });

    // Unique constraint violation — silently succeed
    if (error && error.code === "23505") {
      return NextResponse.json({ ok: true });
    }

    if (error) {
      console.error("Waitlist insert error:", error);
      return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
