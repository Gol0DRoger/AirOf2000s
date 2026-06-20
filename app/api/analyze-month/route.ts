import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  // Secret header check
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current month_year
  const today = new Date();
  const monthYear = today.toISOString().substring(0, 7); // "2026-06"

  // Check if today is actually the last day of the month
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  if (today.getDate() !== lastDay) {
    return NextResponse.json({ 
      skipped: true, 
      reason: "not last day of month" 
    });
  }

  // Fetch all notes from current month that are not flagged
  const { data: notes, error } = await supabase
    .from("notes")
    .select("content")
    .eq("month_year", monthYear)
    .eq("is_flagged", false);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }

  // Check if we have enough notes
  if (!notes || notes.length < 5) {
    return NextResponse.json({ 
      skipped: true, 
      reason: "not enough notes" 
    });
  }

  // Build prompt for Groq
  const notesText = notes.map((n) => n.content).join("\n---\n");
  const prompt = `You are analyzing anonymous notes from users of a retro 2000s nostalgia website.
Here are all the notes submitted this month:

${notesText}

Find the single most common feeling, object, memory or emotion that appears 
across the most notes. It can be anything — a vibe, a song, a TV show, a feeling, 
an object, a game, anything.

Return ONLY valid JSON:
{
  "winning_theme": "one punchy sentence describing what everyone missed most (max 15 words)",
  "sample_quotes": ["quote1", "quote2", "quote3"]
}`;

  // Call Groq API
  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      return NextResponse.json({ 
        error: "Groq API failed", 
        details: errorText 
      }, { status: 500 });
    }

    const groqData = await groqResponse.json();
    const content = groqData.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ 
        error: "No response from Groq" 
      }, { status: 500 });
    }

    // Parse JSON response
    let parsed;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      return NextResponse.json({ 
        error: "Failed to parse Groq response",
        raw: content 
      }, { status: 500 });
    }

    const { winning_theme, sample_quotes } = parsed;

    if (!winning_theme || !sample_quotes || !Array.isArray(sample_quotes)) {
      return NextResponse.json({ 
        error: "Invalid response format from Groq",
        parsed 
      }, { status: 500 });
    }

    // Upsert into monthly_winners table
    const { error: upsertError } = await supabase
      .from("monthly_winners")
      .upsert({
        month_year: monthYear, // Fixed: Mapped the database column key securely to your local camelCase variable
        winning_theme,
        sample_quotes,
        announced_at: new Date().toISOString(),
      }, {
        onConflict: "month_year",
      });

    if (upsertError) {
      return NextResponse.json({ 
        error: "Failed to save winner",
        details: upsertError 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      winning_theme, 
      sample_quotes 
    });

  } catch (error) {
    return NextResponse.json({ 
      error: "Unexpected error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}