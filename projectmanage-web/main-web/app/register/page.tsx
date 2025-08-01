"use client";

import Image from "next/image";
import { useState } from "react";
import { registerUser } from "./action";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // Clear previous errors

    const formData = new FormData(event.currentTarget);
    const result = await registerUser(formData);

    if (result?.error) {
      setError(result.error);
    } else {
    }
  };

  return (
    <div className="relative h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Background Image */}
      <Image
        src="/bg-login.jpg" 
        alt="Background"
        fill
        className="object-cover absolute z-0"
        style={{ opacity: 1 }}
      />

      {/* Form Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">
              Register Account
            </h2>
            <p className="text-sm text-gray-500">
              Fill in your details below to create an account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <input
              type="text"
              name="fullname"
              placeholder="Full Name"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="email"
              name="email"
              placeholder="Email ID"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <div className="flex items-center justify-between text-sm text-gray-600">
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="agreeToTerms" className="accent-blue-500" />
                <span>I agree to the terms and conditions</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              REGISTER
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-500">
              Already have an account?{" "}
              <a href="login" className="text-blue-600 hover:underline">
                Login here
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}