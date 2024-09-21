"use client";
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  signUp,
  verifyOTPForSignup,
  resendVerificationEmail,
  initiateAccountReset,
  verifyOTPAndResetAccount,
} from "@/app/(pages)/sign-up/action";
import { Button } from "@/components/ui/button";
import { redirect, useRouter } from "next/navigation";

import { SignUpSchema, OtpSchema } from "@/lib/types";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createGoogleAuthorizationURL } from "@/actions/oauth.action";

type formScreens = "signUpForm" | "verifySignupOTP" | "resetOTP" | "resetScreen";

function currentTitle(formState: formScreens) {
  switch (formState) {
    case "signUpForm":
      return "Sign Up";
    case "verifySignupOTP":
      return "Verify OTP";
    case "resetOTP":
      return "Reset Account";
    case "resetScreen":
      return "Reset Account";
  }
}

export function SignUpForm() {
  const [formState, setFormState] = useState<formScreens>("signUpForm");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [timer, setTimer] = useState(60); // 1 minute timer
  const [disableResend, setDisableResend] = useState(false);
  const router = useRouter();

  const signUpForm = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const otpForm = useForm({
    resolver: zodResolver(OtpSchema),
    defaultValues: { otp: "" },
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

  async function onSignUpSubmit(values: z.infer<typeof SignUpSchema>) {
    if (values.password !== values.confirmPassword) {
      setMessage("Passwords do not match");
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    const res = await signUp(values);
    if (!res.success) {
      if (res.message.includes("User already exists")) {
        setMessage(res.message);
        setFormState("resetScreen");
        if (res?.data?.userId) {
          setUserId(res.data.userId);
        }
      } else {
        setMessage(res.message);
      }
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    setFormState("verifySignupOTP");
    setMessage(res.message);
    if (res?.data?.userId) {
      setUserId(res.data.userId);
    }
  }

  async function onOtpSubmitForSignup(values: z.infer<typeof OtpSchema>) {
    const res = await verifyOTPForSignup(userId, values.otp);
    setMessage(res.message);
    if (res.success) {
      if (formState === "verifySignupOTP") {
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setTimeout(() => {
          setFormState("signUpForm");
          signUpForm.reset();
        }, 2000);
      }
    }
    setTimeout(() => setMessage(""), 5000);
  }

  async function handleResendOTP() {
    const res = await resendVerificationEmail(userId);
    otpForm.reset();
    setMessage(res.message);
    setDisableResend(true);
    setTimeout(() => setMessage(""), 5000);
  }

  async function handleAccountReset() {
    const res = await initiateAccountReset(userId);
    if (res.success) {
      setFormState("resetOTP");
    }
    setMessage(res.message);
    setTimeout(() => setMessage(""), 5000);
  }

    async function onOtpSubmitForReset(values: z.infer<typeof OtpSchema>) {
        const res = await verifyOTPAndResetAccount(userId, values.otp);
        setMessage(res.message);
        if (res.success) {
        setTimeout(() => {
            setFormState("signUpForm");
            signUpForm.reset();
            otpForm.reset();
        }, 2000);
        }
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
        <CardTitle className="text-3xl">
            {currentTitle(formState)}
        </CardTitle>
        <CardDescription>
          {formState === "signUpForm"
            ? "Create an account to get started."
            : formState === "verifySignupOTP" || formState === "resetOTP"
            ? "Enter the OTP sent to your email."
            : "Reset your account to sign up again."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert className="mb-4">
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {formState === "signUpForm" && (
          <div>
          <form
            onSubmit={signUpForm.handleSubmit(onSignUpSubmit)}
            className="space-y-4"
          >
            <input
              className="w-full border p-2 rounded"
              type="email"
              placeholder="Email"
              {...signUpForm.register("email")}
            />
            <input
              className="w-full border p-2 rounded"
              type="password"
              placeholder="Password"
              {...signUpForm.register("password")}
            />
            <input
              className="w-full border p-2 rounded"
              type="password"
              placeholder="Confirm Password"
              {...signUpForm.register("confirmPassword")}
            />
            <Button type="submit" className="w-full">
              Sign up
            </Button>
          </form>
          <Button
              onClick={handleGoogleSignUp}
              className="w-full mb-4"
              variant="outline"
            >
              Sign up with Google
            </Button>
          </div>

        )}

        {(formState === "verifySignupOTP") && (
          <form
            onSubmit={otpForm.handleSubmit(onOtpSubmitForSignup)}
            className="space-y-4"
          >
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

        {formState === "resetOTP" && (
            <form
                onSubmit={otpForm.handleSubmit(onOtpSubmitForReset)}
                className="space-y-4"
            >
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
                 Reset Account
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

        {formState === "resetScreen" && (
          <div className="space-y-4">
            <Button onClick={handleAccountReset} className="w-full">
              Reset Account
            </Button>
            <Button
              onClick={() => setFormState("signUpForm")}
              variant="outline"
              className="w-full"
            >
              Back to Sign Up
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
