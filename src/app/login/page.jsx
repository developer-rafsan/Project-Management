import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import LoginClient from "./LoginClient"

export default async function LoginPage({ searchParams }) {
  const session = await getServerSession(authOptions)
  const params = await searchParams
  const callbackUrl = params?.callbackUrl || "/dashboard"

  if (session) {
    redirect(callbackUrl)
  }

  return <LoginClient />
}
