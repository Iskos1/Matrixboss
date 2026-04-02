
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
import staticPortfolioData from "@/data/portfolio.json";

export default async function Home() {
  // Use the statically-bundled JSON so this page always works on Vercel
  // (fs.readFileSync is unreliable in serverless environments without explicit
  // outputFileTracingIncludes coverage for every route).
  const safeData: any = staticPortfolioData || {};

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
