import { Hero, BookPreview, ChatbotDemo, Features } from "@/components/landing";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <>
      <Hero />
      <BookPreview />
      <ChatbotDemo />
      <Features />
      <Footer />
    </>
  );
}
