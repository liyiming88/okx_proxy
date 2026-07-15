const TARGET = "https://www.okx.com";

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/" || url.pathname === "/health") {
    res.status(200).json({ ok: true, target: TARGET, time: new Date().toISOString() });
    return;
  }

  const targetUrl = TARGET + url.pathname + url.search;

  const headers = new Headers(req.headers);
  headers.set("host", "www.okx.com");
  ["x-forwarded-for", "x-forwarded-host", "x-forwarded-proto",
   "x-vercel-forwarded-for", "x-vercel-forwarded-host",
   "x-vercel-ip-country", "x-vercel-ip-country-region",
   "x-vercel-ip-city", "x-real-ip"].forEach(h => headers.delete(h));

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      redirect: "follow",
    });

    const respHeaders = new Headers(response.headers);
    respHeaders.set("access-control-allow-origin", "*");
    respHeaders.delete("content-encoding");

    const buffer = await response.arrayBuffer();
    res.status(response.status);
    respHeaders.forEach((v, k) => res.setHeader(k, v));
    res.end(Buffer.from(buffer));
  } catch (err) {
    res.status(502).json({ error: err.message, target: targetUrl });
  }
}
