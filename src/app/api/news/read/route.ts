import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
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
      return NextResponse.json(
        { error: "Failed to parse article content" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      title: article.title,
      content: article.content,
      textContent: article.textContent,
      byline: article.byline,
      siteName: article.siteName,
    });
  } catch (error: any) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article content", details: error.message },
      { status: 500 }
    );
  }
}
