import { z } from "zod"
export const SignUpSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const SignInSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
})

export const OtpSchema = z.object({
    otp: z.string().length(6, { message: "OTP must be 6 characters long" }),
});

export const ResetPasswordSchema = z.object({
  password: z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters long" }),  
}).refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"], });