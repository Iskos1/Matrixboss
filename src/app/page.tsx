import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedCaseStudy from "@/components/FeaturedCaseStudy";
import Skills from "@/components/Skills";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import AdminButton from "@/components/AdminButton";
import PortfolioChat from "@/components/PortfolioChat";
import NewsletterButton from "@/components/NewsletterButton";
import { readJsonFile, joinPath } from "@/lib/utils/file-utils";
import { PATHS } from "@/lib/constants";

async function getPortfolioData() {
  try {
    const dataPath = joinPath(PATHS.PORTFOLIO_DATA);
    return readJsonFile(dataPath);
  } catch (error) {
    console.error("Failed to load portfolio data:", error);
    // Return null to indicate failure, which we can handle in the component
    return null;
  }
}

export default async function Home() {
  const data = await getPortfolioData();

  // If data loading fails, we can either:
  // 1. Show an error message (useful for debugging)
  // 2. Fall back to static data (current behavior, but might show stale content)
  // Let's try to be helpful if data is missing, especially in dev/admin context
  if (!data && process.env.NODE_ENV === 'development') {
      return (
        <div className="p-10 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Portfolio Data</h1>
            <p className="text-slate-600 mb-4">Could not read portfolio data from {PATHS.PORTFOLIO_DATA}.</p>
            <p className="text-sm text-slate-500">Check server console for details.</p>
        </div>
      );
  }

  // Fallback to empty object if data is null (will trigger default props in components)
  // This ensures the site doesn't crash in production if something goes wrong
  const safeData = data || {};

  return (
    <>
      <Header profile={safeData.profile} socialLinks={safeData.socialLinks} />
      <main>
        <Hero profile={safeData.profile} />
        <FeaturedCaseStudy />
        <Skills skills={safeData.skills} />
        <Experience experience={safeData.experience} />
        <Projects projects={safeData.projects} />
        <Contact profile={safeData.profile} socialLinks={safeData.socialLinks} />
      </main>
      <Footer profile={safeData.profile} />
      <AdminButton />
      <NewsletterButton />
      <PortfolioChat />
    </>
  );
}
