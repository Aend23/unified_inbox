import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  // Check if user is authenticated
  const user = await getCurrentUser();
  
  if (user) {
    redirect("/inbox");
  } else {
    redirect("/login");
  }
}
