import GoogleProvider from "next-auth/providers/google"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        await connectDB()
        const existingUser = await User.findOne({ email: user.email })
        if (!existingUser) {
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
          })
        }
      }
      return true
    },
    async session({ session, token }) {
      await connectDB()
      const dbUser = await User.findOne({ email: session.user.email })
      if (!dbUser) return null
      session.user.id = dbUser._id.toString()
      return session
    },
  },
}
