export const dynamic = "force-dynamic";
import { Signin } from "@/components/Signin";

export default function SignIn() {
  console.log("Amplify NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "✅ set" : "❌ missing");
  return <Signin/>;
}
