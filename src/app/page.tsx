import { redirect } from "next/navigation";

export default function Home() {
  // V1 entry point. Auth-aware routing (login vs dashboard) lands in Milestone 2.
  redirect("/dashboard");
}
