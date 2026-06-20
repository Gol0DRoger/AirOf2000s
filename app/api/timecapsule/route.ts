export const revalidate = 86400;

export async function GET() {
  // FIX: use local IST date not UTC
  // UTC midnight ≠ IST midnight — causes stale data until 5:30am IST
  const now  = new Date();

  // Offset to IST (UTC+5:30 = 330 minutes)
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const ist  = new Date(now.getTime() + IST_OFFSET);

  const mm   = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const dd   = String(ist.getUTCDate()).padStart(2, "0");
  const year = ist.getUTCFullYear() - 20;

  let wikiEvents = "";
  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`,
      { headers: { "Api-User-Agent": "AirOf2000s/1.0" } }
    );
    const wikiData = await wikiRes.json();
    const events = (wikiData.events || [])
      .filter((e: { year: number }) => Math.abs(e.year - year) <= 3)
      .slice(0, 10)
      .map((e: { year: number; text: string }) => `${e.year}: ${e.text}`);
    wikiEvents = events.join("\n");
  } catch {
    wikiEvents = "";
  }

  const prompt = `You are a nostalgic curator for a retro 2000s website.
Wikipedia "On This Day" events near ${year} for today ${dd}/${mm}:
${wikiEvents || "No close Wikipedia events found."}

Fill exactly 5 memory cards for the year ${year}. Max 12 words each. Real and positive only.

WORLD: Famous positive international news or milestone from ${year}
HOLLYWOOD: Famous Hollywood movie released or trending in ${year} with lead actor name
BOLLYWOOD: Famous Bollywood movie or hit song from ${year} with star name
MUSIC: Famous English song or album at #1 in ${year} with artist name
GAMING: Famous game released or trending in ${year} with platform

Use Wikipedia where it matches. Fill from knowledge of ${year} where it does not.
Warm, casual, nostalgic tone. No deaths. No disasters. No negativity.

Return ONLY valid JSON, nothing else:
{"WORLD":"...","HOLLYWOOD":"...","BOLLYWOOD":"...","MUSIC":"...","GAMING":"..."}`;

  const fallback: Record<
    number,
    { WORLD: string; HOLLYWOOD: string; BOLLYWOOD: string; MUSIC: string; GAMING: string }
  > = {
    2001: { WORLD:"Wikipedia launched and changed how we all learn", HOLLYWOOD:"Harry Potter and the Sorcerer's Stone hit cinemas", BOLLYWOOD:"Lagaan nominated for Oscars — the whole nation watched", MUSIC:"Linkin Park's Hybrid Theory was on every CD", GAMING:"GTA III dropped and changed gaming forever" },
    2002: { WORLD:"FIFA World Cup held in Korea & Japan for first time", HOLLYWOOD:"Spider-Man swung into cinemas and broke records", BOLLYWOOD:"Devdas — SRK, Aishwarya and Madhuri together at last", MUSIC:"Eminem's Without Me ruled every radio station", GAMING:"Warcraft III: Reign of Chaos launched globally" },
    2003: { WORLD:"Space Shuttle Columbia memorial united the world", HOLLYWOOD:"Finding Nemo had every kid glued to the screen", BOLLYWOOD:"Kal Ho Naa Ho — tissues required, no exceptions", MUSIC:"Beyoncé's Crazy in Love hit #1 worldwide", GAMING:"Need for Speed Underground released" },
    2004: { WORLD:"Facebook launched from a Harvard dorm room", HOLLYWOOD:"Spider-Man 2 swung even higher than the first", BOLLYWOOD:"Veer-Zaara — the love story of a generation", MUSIC:"Usher's Yeah! dominated every playlist all year", GAMING:"GTA San Andreas launched on PS2" },
    2005: { WORLD:"YouTube launched and the internet was never the same", HOLLYWOOD:"Batman Begins rebooted the superhero genre forever", BOLLYWOOD:"Bunty Aur Babli had everyone singing Kajra Re", MUSIC:"Kelly Clarkson's Since U Been Gone owned the radio", GAMING:"God of War dropped on PlayStation 2" },
    2006: { WORLD:"FIFA World Cup kicked off in Germany", HOLLYWOOD:"Pirates of the Caribbean 2 was the summer blockbuster", BOLLYWOOD:"Fanaa released — Kajol and Aamir reunited on screen", MUSIC:"Shakira's Hips Don't Lie was everywhere this summer", GAMING:"GTA San Andreas finally hit PS2 across India" },
    2007: { WORLD:"iPhone launched and changed everything we knew", HOLLYWOOD:"Transformers brought robots to the big screen in style", BOLLYWOOD:"Chak De! India — SRK at his absolute best", MUSIC:"Rihanna's Umbrella owned the entire summer", GAMING:"Halo 3 launched and broke every record" },
    2008: { WORLD:"Beijing Olympics opened with 91,000 in the Bird Nest", HOLLYWOOD:"The Dark Knight — Heath Ledger's Joker stunned everyone", BOLLYWOOD:"Ghajini — Aamir's transformation was national news", MUSIC:"Coldplay's Viva la Vida was inescapable", GAMING:"Grand Theft Auto IV released worldwide" },
    2009: { WORLD:"Barack Obama became the 44th US President", HOLLYWOOD:"Avatar shattered every box office record imaginable", BOLLYWOOD:"3 Idiots broke every box office record in India", MUSIC:"Lady Gaga's Poker Face ruled every chart", GAMING:"Uncharted 2 shipped and redefined storytelling" },
    2010: { WORLD:"FIFA World Cup kicked off in South Africa", HOLLYWOOD:"Inception had everyone questioning their dreams", BOLLYWOOD:"Dabangg launched Salman's unstoppable comeback era", MUSIC:"Eminem's Recovery was the album of the year", GAMING:"Red Dead Redemption became an instant classic" },
  };

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 400,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const groqData = await groqRes.json();
    const raw   = groqData.choices[0].message.content.trim();
    const cards = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return Response.json({ date: `${dd}/${mm}/${year}`, year, cards });
  } catch {
    const cards = fallback[year] || fallback[2006];
    return Response.json({ date: `${dd}/${mm}/${year}`, year, cards });
  }
}