import { cookies } from "next/headers";
import ProjectChatClient from "../components/ProjectChat";

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const token = (await cookies()).get("token")?.value ?? null;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Project: {params.slug}</h1>
    </main>
  );
}