import { createFileRoute } from "@tanstack/react-router";
import { Portfolio } from "@/components/portfolio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rutuja Vaidya | AI/ML Engineer & Python Developer" },
      { name: "description", content: "Explore Rutuja Vaidya's AI, machine learning, Python, full-stack, and research projects." },
      { property: "og:title", content: "Rutuja Vaidya | AI/ML Engineer" },
      { property: "og:description", content: "A portfolio of intelligent systems, data-driven applications, and modern software." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Portfolio,
});
