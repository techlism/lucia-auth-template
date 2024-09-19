"use server"

import { validateRequest, lucia } from "@/lib/lucia"
import { cookies } from "next/headers"

export const signOut = async () => {
    try {
      const { session } = await validateRequest()
  
      if (!session) {
        return {
          error: "Unauthorized",
        }
      }
  
      await lucia.invalidateSession(session.id)
  
      const sessionCookie = lucia.createBlankSessionCookie()
  
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      )
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
      return {
        error: error?.message,
      }
    }
  }