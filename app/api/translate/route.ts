export async function POST(request: Request) {
  const { text } = await request.json();
  const res = await fetch("https://libretranslate.de/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: "auto", target: "en" }),
  });
  const data = await res.json();
  return Response.json(data);
}
