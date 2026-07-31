import GoogleProvider from "next-auth/providers/google"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import Workspace from "@/models/Workspace"

async function ensureDefaultWorkspace(userId, userName) {
  try {
    const existing = await Workspace.findOne({ owner: userId })
    if (!existing) {
      await Workspace.create({
        name: `${userName || 'User'}'s Workspace`,
        slug: `workspace-${userId.toString().slice(-8)}`,
        type: 'individual',
        owner: userId,
      })
    }
  } catch {
    // non-blocking - workspace creation failure should not prevent auth
  }
}

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
            const newUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
            })
            await ensureDefaultWorkspace(newUser._id, user.name)
          }
        } catch {
          return false
        }
      }
      return true
    },
    async session({ session }) {
      try {
        await connectDB()
        let dbUser = await User.findOne({ email: session.user.email })
        if (!dbUser) {
          dbUser = await User.create({
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          })
          await ensureDefaultWorkspace(dbUser._id, session.user.name)
        }
        session.user.id = dbUser._id.toString()
      } catch {
        // session stays but without custom id
      }
      return session
    },
  },
}
