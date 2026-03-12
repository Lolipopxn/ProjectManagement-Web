"use client";

import { useState } from "react";
import { registerUser } from "./action";

import { IoPersonSharp } from "react-icons/io5";
import { VscAccount } from "react-icons/vsc";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // Clear previous errors

    if (
      !passwordRules.length ||
      !passwordRules.uppercase ||
      !passwordRules.lowercase ||
      !passwordRules.number
    ) {
      setError("รหัสผ่านต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่ ตัวอักษรพิมพ์เล็ก ตัวเลข และมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const result = await registerUser(formData);

    if (result?.error) {
      setError(result.error);
    } else {
    }
  };

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const strength = Object.values(passwordRules).filter(Boolean).length;

  function PasswordRule({ valid, text }: { valid: boolean; text: string }) {
    return (
      <div className="flex items-center gap-2">
        {valid ? (
          <IoCheckmarkCircle className="text-green-500 w-4 h-4" />
        ) : (
          <IoCloseCircle className="text-gray-400 w-4 h-4" />
        )}

        <span
          className={`${
            valid ? "text-green-600 font-medium" : "text-gray-500"
          }`}
        >
          {text}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-white">
      {/* Form Container */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 h-full">
        {/*left container*/}
        <div className="bg-linear-to-r from-[#636CCB] to-[#6E8CFB]  col-span-1 col-start-1 w-auto  hidden md:flex shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col justify-center items-center w-full p-25 space-y-5 text-white">
            <div className="flex flex-col justify-center items-center gap-5 w-full">
              <VscAccount  className="w-20 h-20 text-white" />
              <div className="font-bold text-3xl text-white">-- Welcome -- </div> 
            </div>
            <p>
              เข้าร่วมแพลตฟอร์มของเราเพื่อเพิ่มประสิทธิภาพการทำงานของทีมคุณ
              สมัครบัญชีเพื่อเข้าถึงเครื่องมือจัดการโปรเจค แชทแบบเรียลไทม์
              ห้องเสียง และงานทั้งหมดได้ในที่เดียว
            </p>
          </div>
        </div>

        <div className="w-full max-w-[1620px] bg-white px-12 md:px-25 pt-10 md:pt-5">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Create Account
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <label
              htmlFor="name"
              className="block text-sm font-normal text-gray-700 mb-3"
            >
              ชื่อผู้ใช้
            </label>
            <div className="flex items-center bg-gray-200 text-black border border-gray-200 rounded-lg px-3 py-4 focus-within:ring-1 focus-within:ring-black focus-within:bg-white hover:bg-white shadow-sm">
              <IoPersonSharp className="mx-5 w-5 h-5 self-center" />
              <input
                type="text"
                name="fullname"
                required
                placeholder="Full Name"
                className="w-full border-none outline-none placeholder-black"
              />
            </div>
            <label
              htmlFor="name"
              className="block text-sm font-normal text-gray-700 mb-3"
            >
              อีเมล
            </label>
            <div className="flex items-center bg-gray-200 text-black border border-gray-200 rounded-lg px-3 py-4 focus-within:ring-1 focus-within:ring-black focus-within:bg-white hover:bg-white shadow-sm">
              <MdEmail  className="mx-5 w-5 h-5 self-center" />
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full border-none outline-none placeholder-black"
              />
            </div>
            <label
              htmlFor="name"
              className="block text-sm font-normal text-gray-700 mb-3"
            >
              สร้างรหัสผ่าน
            </label>
            <div className="flex items-center bg-gray-200 text-black border border-gray-200 rounded-lg px-3 py-4 focus-within:ring-1 focus-within:ring-black focus-within:bg-white hover:bg-white shadow-sm">
              <RiLockPasswordFill className="mx-5 w-5 h-5 self-center" />
              <input
                type="password"
                name="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-none outline-none placeholder-black"
              />           
            </div>

            {/* Password Progress Bar */}
            <div className="mt-3">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength === 1
                        ? "w-1/4 bg-red-500"
                        : strength === 2
                        ? "w-2/4 bg-orange-400"
                        : strength === 3
                        ? "w-3/4 bg-yellow-400"
                        : strength === 4
                        ? "w-full bg-green-500"
                        : "w-0"
                    }`}
                  ></div>
                </div>
            </div>  

            {/* Password Rule  */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <PasswordRule
                  valid={passwordRules.length}
                  text="อย่างน้อย 8 ตัวอักษร"
              />

                <PasswordRule
                  valid={passwordRules.uppercase}
                  text="มีตัวพิมพ์ใหญ่ (A-Z)"
                />

                <PasswordRule
                  valid={passwordRules.lowercase}
                  text="มีตัวพิมพ์เล็ก (a-z)"
                />

                <PasswordRule
                  valid={passwordRules.number}
                  text="มีตัวเลข (0-9)"
                />
              </div>
            <label
              htmlFor="name"
              className="block text-sm font-normal text-gray-700 mb-3"
            >
              ยืนยันรหัสผ่าน
            </label>
            <div className="flex items-center bg-gray-200 text-black border border-gray-200 rounded-lg px-3 py-4 focus-within:ring-1 focus-within:ring-black focus-within:bg-white hover:bg-white shadow-sm">
              <RiLockPasswordFill className="mx-5 w-5 h-5 self-center" />
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="Confirm Password "
                className="w-full border-none outline-none placeholder-black"
              />
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  className="accent-blue-500"
                />
                <span>I agree to the terms and conditions</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-linear-to-r from-[#6E8CFB] to-[#636CCB] shadow-lg text-white py-2 mt-2 rounded-md hover:opacity-70 transition"
            >
              REGISTER
            </button>
          </form>

          <div className="mt-4 text-center text-sm pb-8">
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
