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
        try {
          await connectDB()
          const existingUser = await User.findOne({ email: user.email })
          if (!existingUser) {
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
            })
          }
        } catch {
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      try {
        await connectDB()
        let dbUser = await User.findOne({ email: session.user.email })
        if (!dbUser) {
          dbUser = await User.create({
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          })
        }
        session.user.id = dbUser._id.toString()
      } catch {
        // session stays but without custom id
      }
      return session
    },
  },
}
