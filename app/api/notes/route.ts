import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const BAD_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "nigger",
  "asshole",
  "cunt",
  "bastard",
  "whore",
  "slut",
  "faggot",
  "chutiya",
  "madarchod",
  "behenchod",
  "randi",
  "gaandu",
  "saala",
  "saale",
  "harami",
  "kamina",
  "kaminey",
  "bhadwa",
  "bhadwe",
  "lawda",
  "loda",
  "lund",
  "gand",
  "gaand",
  "chut",
  "jhaant",
  "jhant",
  "tatte",
  "kutta",
  "kutti",
  "bakchod",
  "bakchodi",
  "randwa",
  "chudail",
  "chodo",
  "chudwana",
  "gandfaad",
  
  // Common Short-forms & Acronyms used on IG/Reddit
  "bc",
  "mc",
  "bkl",
  "mkl",
  "gnd",
  "dick",
  "pussy",
  "twat",
  "cock",
  "prick",
  "wanker",
  "motherfucker",
  "milf",
  "retard",
  "douche",
  "douchebag",
  "dumbass",
  "dipshit",
  "jackass",
  "bullshit",
  "scumbag",
  "arse",
  "hoe",
  "piss",
  "coon"
];

function hashIP(ip: string) {
  return crypto
    .createHash("sha256")
    .update(ip + process.env.IP_SALT)
    .digest("hex")
    .substring(0, 16);
}

// Minimal core update to implement defensive character normalization
function isClean(text: string) {
  const normalized = text
    .toLowerCase()
    // Resolves leetspeak symbol obfuscation attempts
    .replace(/1|!|i/g, "i")
    .replace(/3|e/g, "e")
    .replace(/4|a/g, "a")
    .replace(/0|o/g, "o")
    .replace(/5|\$/g, "s")
    .replace(/7|t/g, "t")
    .replace(/µ|¢/g, "c")
    // Strips out all spaces, tabs, dots, and punctuation to catch "b.c" or "g a n d"
    .replace(/[^a-z0-9]/g, "");

  return !BAD_WORDS.some((w) => normalized.includes(w));
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = hashIP(ip);
  const body = await req.json();
  const content = (body.content || "").trim();

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (!content || wordCount > 120)
    return NextResponse.json({ error: "Max 120 words" }, { status: 400 });

  if (!isClean(content))
    return NextResponse.json({ error: "Keep it clean ✌️" }, { status: 400 });

  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabase
    .from("notes")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", today + "T00:00:00Z");

  if ((count || 0) >= 1)
    return NextResponse.json(
      { error: "One scrap per day — come back tomorrow ✌️" },
      { status: 429 }
    );

  const monthYear = new Date().toISOString().substring(0, 7);
  const { error } = await supabase
    .from("notes")
    .insert({ content, ip_hash: ipHash, month_year: monthYear, is_flagged: false });

  if (error)
    return NextResponse.json({ error: "Could not save" }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const today = new Date();
  const lastDay = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();
  const isLast = today.getDate() === lastDay;
  const monthYear = today.toISOString().substring(0, 7);

  if (isLast) {
    const { data: winner } = await supabase
      .from("monthly_winners")
      .select("*")
      .eq("month_year", monthYear)
      .single();

    if (winner) {
      const { data: notes } = await supabase
        .from("notes")
        .select("content, created_at")
        .eq("month_year", monthYear)
        .eq("is_flagged", false)
        .order("created_at", { ascending: false })
        .limit(6);
      return NextResponse.json({
        winner,
        recentNotes: notes || [],
        isLastDay: true,
      });
    }
  }

  const { data: notes } = await supabase
    .from("notes")
    .select("content, created_at")
    .eq("is_flagged", false)
    .order("created_at", { ascending: false })
    .limit(6);

  return NextResponse.json({
    winner: null,
    recentNotes: notes || [],
    isLastDay: false,
  });
}