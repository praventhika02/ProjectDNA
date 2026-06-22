import type { SeedJob } from "@/types/project-dna";

export const seedJobs: SeedJob[] = [
  {
    id: "ai-engineer-intern",
    title: "AI Engineer Intern",
    company: "Nova Labs",
    description: "Help prototype reliable AI-powered product features and the data workflows that support them.",
    responsibilities: ["Build and evaluate machine-learning prototypes", "Prepare datasets and reproducible experiments", "Integrate model outputs into product APIs"],
    requiredSkills: ["Python", "Machine learning fundamentals", "Data structures", "Git", "REST APIs"],
    preferredSkills: ["PyTorch or TensorFlow", "SQL", "Model evaluation", "Docker"],
    keywords: ["python", "machine learning", "pytorch", "tensorflow", "evaluation", "api", "data pipeline"],
  },
  {
    id: "data-analyst-intern",
    title: "Data Analyst Intern",
    company: "SignalWorks",
    description: "Turn product and operational data into clear insights that help teams make better decisions.",
    responsibilities: ["Write queries and validate datasets", "Build dashboards and recurring reports", "Explain trends and recommendations to stakeholders"],
    requiredSkills: ["SQL", "Spreadsheet analysis", "Data visualization", "Statistics", "Clear communication"],
    preferredSkills: ["Python or R", "Tableau or Power BI", "Data cleaning", "Experiment analysis"],
    keywords: ["sql", "analytics", "dashboard", "statistics", "python", "visualization", "insights"],
  },
  {
    id: "frontend-developer-intern",
    title: "Frontend Developer Intern",
    company: "Canvas Digital",
    description: "Create accessible, responsive web experiences in close partnership with product and design.",
    responsibilities: ["Implement responsive product interfaces", "Connect frontend views to APIs", "Improve accessibility, performance, and test coverage"],
    requiredSkills: ["JavaScript", "HTML", "CSS", "React", "Git"],
    preferredSkills: ["TypeScript", "Next.js", "Automated testing", "Web accessibility"],
    keywords: ["react", "typescript", "next.js", "frontend", "responsive", "accessibility", "testing"],
  },
  {
    id: "backend-developer-intern",
    title: "Backend Developer Intern",
    company: "Relay Systems",
    description: "Develop dependable services and APIs that power customer-facing applications.",
    responsibilities: ["Design and implement REST endpoints", "Model and query application data", "Write tests and diagnose service issues"],
    requiredSkills: ["One backend language", "REST APIs", "SQL", "Data structures", "Git"],
    preferredSkills: ["Node.js, Python, Java, or Go", "Docker", "Cloud fundamentals", "Automated testing"],
    keywords: ["backend", "api", "sql", "node.js", "python", "java", "go", "docker", "testing"],
  },
  {
    id: "product-engineer-intern",
    title: "Product Engineer Intern",
    company: "Launchpad Software",
    description: "Ship thoughtful end-to-end product improvements across user interfaces, APIs, and data.",
    responsibilities: ["Build features from discovery through release", "Translate user needs into technical decisions", "Measure outcomes and iterate with cross-functional partners"],
    requiredSkills: ["JavaScript or TypeScript", "React", "API integration", "Product thinking", "Git"],
    preferredSkills: ["Next.js", "Node.js", "SQL", "Testing", "Analytics instrumentation"],
    keywords: ["full stack", "react", "typescript", "product", "api", "sql", "experimentation", "analytics"],
  },
];

export function findSeedJob(title: string): SeedJob | undefined {
  return seedJobs.find((job) => job.title === title);
}
