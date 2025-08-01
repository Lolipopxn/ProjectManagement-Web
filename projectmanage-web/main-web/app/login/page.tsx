"use client";

import { useActionState } from "react";
import { login } from "./action";
import { FaEnvelope, FaLock } from "react-icons/fa";
import Image from "next/image";

const initialState = {
  message: null,
};

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="flex h-full">
      <div className="w-1/2 relative h-screen hidden md:block bg-blue-500">
        <Image
          src="/bg-login.jpg"
          alt="Login Image"
          fill
          className="object-cover opacity-30 z-0"
        />

        <div className="absolute inset-0 bg-black-500/[100%] flex items-center justify-start p-15">
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
        <div className="bg-white shadow-lg rounded-lg p-8 w-[80%] h-[90%]">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Login
          </h2>

          <form className="space-y-5 px-15" action={formAction}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                <FaEnvelope className="text-gray-400 mr-2" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="w-full border-none outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                <FaLock className="text-gray-400 mr-2" />
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  placeholder="Enter your password"
                  className="w-full border-none outline-none"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              Login
            </button>
            {state?.message && (
            <div className="mt-4 text-center text-red-500">
              Message: {state.message}
            </div>
          )}
          </form>

          {/* Footer */}
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              <a href="/forgot_password" className="text-blue-600 hover:underline">
                Forgot password?
              </a>
            </p>
            <p className="mt-2">
              Don't have an account?{" "}
              <a href="/register" className="text-blue-600 hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
