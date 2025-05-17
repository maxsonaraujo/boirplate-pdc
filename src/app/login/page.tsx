import { LoginPage } from "@/components/templates/LoginPage";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers'

export default async function Login() {


  const cookieStore = await cookies();

  const token = cookieStore.get("token");

  if (token) {
    redirect("/desk")
  } else {
    return (
      <LoginPage />
    )
  }
}


export const revalidate = 0;