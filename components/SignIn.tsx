"use client";
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  signIn,
  requestPasswordReset,
  verifyOTPAndResetPassword,
} from "@/app/(pages)/sign-in/action";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import { SignInSchema, OtpSchema, ResetPasswordSchema } from "@/lib/types";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createGoogleAuthorizationURL } from "@/actions/oauth.action";

type FormScreens = "signInForm" | "forgotPassword" | "verifyOTP" | "resetPassword";

function currentTitle(formState: FormScreens) {
  switch (formState) {
    case "signInForm":
      return "Sign In";
    case "forgotPassword":
      return "Forgot Password";
    case "verifyOTP":
      return "Verify OTP";
    case "resetPassword":
      return "Reset Password";
  }
}

export function SignInForm() {
  const [formState, setFormState] = useState<FormScreens>("signInForm");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [timer, setTimer] = useState(60); // 1-minute timer
  const [disableResend, setDisableResend] = useState(false);
  const router = useRouter();

  const signInForm = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: "", password: "" },
  });

  const emailForm = useForm<{ email: string }>({
    defaultValues: { email: "" },
  });

  const otpForm = useForm<z.infer<typeof OtpSchema>>({
    resolver: zodResolver(OtpSchema),
    defaultValues: { otp: "" },
  });

  const resetPasswordForm = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Timer to enable OTP resend after 60 seconds
  useEffect(() => {
    let countdown: NodeJS.Timeout;
    if (disableResend) {
      countdown = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            setDisableResend(false);
            clearInterval(countdown);
            return 60;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [disableResend]);

  async function onSignInSubmit(values: z.infer<typeof SignInSchema>) {
    const res = await signIn(values);
    if (!res.success) {
      setMessage(res.message);
      setTimeout(() => setMessage(""), 5000);
      return;
    }
    router.push("/");
  }

  async function onForgotPasswordSubmit(values: { email: string }) {
    setEmail(values.email);
    const res = await requestPasswordReset(values.email);
    setMessage(res.message);
    if (res.success) {
      setFormState("verifyOTP");
      setDisableResend(true);
    }
    setTimeout(() => setMessage(""), 5000);
  }

  async function onOtpSubmit(values: z.infer<typeof OtpSchema>) {
    // Store the OTP for use in password reset
    otpForm.setValue("otp", values.otp);
    setFormState("resetPassword");
  }

  async function onResetPasswordSubmit(values: z.infer<typeof ResetPasswordSchema>) {
    if (values.password !== values.confirmPassword) {
      setMessage("Passwords do not match");
      setTimeout(() => setMessage(""), 5000);
      return;
    }
    const res = await verifyOTPAndResetPassword(email, otpForm.getValues("otp"), values.password);
    setMessage(res.message);
    if (res.success) {
      setFormState("signInForm");
      signInForm.reset();
      emailForm.reset();
      otpForm.reset();
      resetPasswordForm.reset();
    }
    setTimeout(() => setMessage(""), 5000);
  }

  async function handleResendOTP() {
    const res = await requestPasswordReset(email);
    otpForm.reset();
    setMessage(res.message);
    setDisableResend(true);
    setTimeout(() => setMessage(""), 5000);
  }

  async function handleGoogleSignUp() {
    const res = await createGoogleAuthorizationURL();
    if (!res.success || !res.data) {
      setMessage(res.error || "An error occurred");
      setTimeout(() => setMessage(""), 5000);
      return;
    }
    return router.push(res.data);    
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">{currentTitle(formState)}</CardTitle>
        <CardDescription>
          {formState === "signInForm"
            ? "Sign in to your account."
            : formState === "forgotPassword"
            ? "Enter your email to reset your password."
            : formState === "verifyOTP"
            ? "Enter the OTP sent to your email."
            : "Enter your new password."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert className="mb-4">
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {formState === "signInForm" && (
          <div>
            <form
              onSubmit={signInForm.handleSubmit(onSignInSubmit)}
              className="space-y-4"
            >
              <input
                className="w-full border p-2 rounded"
                type="email"
                placeholder="Email"
                {...signInForm.register("email")}
              />
              <input
                className="w-full border p-2 rounded"
                type="password"
                placeholder="Password"
                {...signInForm.register("password")}
              />
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setFormState("forgotPassword")}
              >
                Forgot Password?
            </Button>
            <Button
          onClick={handleGoogleSignUp}
          variant={"outline"}
          className="w-full"
        >
          Sign in with Google
        </Button>
          </div>

        )}

        {formState === "forgotPassword" && (
          <form
            onSubmit={emailForm.handleSubmit(onForgotPasswordSubmit)}
            className="space-y-4"
          >
            <input
              className="w-full border p-2 rounded"
              type="email"
              placeholder="Email"
              {...emailForm.register("email")}
            />
            <Button type="submit" className="w-full">
              Send Reset Code
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setFormState("signInForm")}
            >
              Back to Sign In
            </Button>
          </form>
        )}

        {formState === "verifyOTP" && (
          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
            <Controller
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <InputOTP
                  maxLength={6}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              )}
            />
            <Button type="submit" className="w-full">
              Verify OTP
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendOTP}
              disabled={disableResend}
            >
              Resend OTP {disableResend ? `(${timer}s)` : ""}
            </Button>
          </form>
        )}

        {formState === "resetPassword" && (
          <form
            onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)}
            className="space-y-4"
          >
            <input
              className="w-full border p-2 rounded"
              type="password"
              placeholder="New Password"
              {...resetPasswordForm.register("password")}
            />
            <input
              className="w-full border p-2 rounded"
              type="password"
              placeholder="Confirm Password"
              {...resetPasswordForm.register("confirmPassword")}
            />
            <Button type="submit" className="w-full">
              Reset Password
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
