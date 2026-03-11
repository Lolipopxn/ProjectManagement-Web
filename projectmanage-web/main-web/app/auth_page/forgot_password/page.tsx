"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { FaEnvelope } from "react-icons/fa";
import { forgotPasswordAction } from "./action";

const initialState = {
  success: false,
  message: null,
};

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  return (
    <div className="flex h-full">
      <div className="w-1/2 relative h-screen hidden md:block bg-blue-500">
        <Image
          src="/bg-login.jpg"
          alt="Forgot Password Image"
          fill
          className="object-cover opacity-30 z-0"
        />

        <div className="absolute inset-0 flex items-center justify-start p-15">
          <div className="text-white text-start">
            <h1 className="text-4xl font-bold mb-4">
              Project Management Platform
            </h1>
            <p className="text-lg">
              Collaborate, organize tasks, and manage your team’s productivity
              in one place.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-lg rounded-lg p-8 w-[80%] h-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Forgot Password
          </h2>
          <p className="text-center text-sm text-gray-600 mb-6">
            Enter your email address and we'll send you a password reset link.
          </p>

          <form className="space-y-5 px-15" action={formAction}>
            {/* Display success or error message */}
            {state?.message && (
              <div
                className={`mt-4 text-center p-3 rounded-lg ${
                  state.success
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {state.message}
              </div>
            )}
            
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 dark:border-black">
                <FaEnvelope className="text-gray-400 mr-2" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="w-full border-none outline-none dark:text-black"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              Send Reset Link
            </button>
          </form>

          {/* Footer */}
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              <a href="/auth_page/login" className="text-blue-600 hover:underline">
                Back to Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}