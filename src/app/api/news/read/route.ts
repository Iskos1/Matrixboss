import { NextRequest } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { handleError, badRequest, json } from "@/lib/api/responses";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return badRequest("URL is required");
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article) {
      return handleError(new Error("Could not extract article content"), "Failed to parse article content");
    }

    return json({
      title: article.title,
      content: article.content,
      textContent: article.textContent,
      byline: article.byline,
      siteName: article.siteName,
    });
  } catch (error) {
    return handleError(error, "Failed to fetch article content");
  }
}
