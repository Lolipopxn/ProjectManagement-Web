"use client";

import { useActionState } from "react";
import { login } from "./action";
import { FaLock } from "react-icons/fa";
import { IoPersonSharp } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";

const initialState = {
  message: null,
};

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);

  const handleGoogleLogin = () => {
    const strapi = "http://localhost:1337";

    window.location.href =
      `${strapi}/api/connect/google`;
  };

  return (
    <div className="h-screen w-screen  grid grid-cols-1 md:grid-cols-2">
      <div className="col-span-1 relative hidden md:block bg-[#ffffff]">
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="absolute opacity-100 z-0 pr-1 w-full h-full bg-[url('/bg-login.jpg')] bg-cover bg-top-left border-t-4 border-white bg-clip-border p-1 rounded-tr-[700px]"></div>
          <div className="relative opacity-100 z-0 pr-1 w-full h-full bg-white bg-cover bg-top-left border-b-4 border-white rounded-bl-[1000px]"></div>
        </div>
        
        <div className=" absolute inset-0 bg-black-500/[100%] flex justify-center items-start mt-20 ml-40">
          <div className="text-white text-start">
            <div className="opacity-100 bg-[url('/postponed-concept.png')] bg-cover bg-center w-150 h-110 scale-80"></div>
          </div>
        </div>
      </div>

      <div className="w-full col-span-1 flex items-center justify-center bg-[#3C467B]">
        <div className="bg-white pt-15 px-12 md:px-20 w-[100%] h-[100%]">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Login
          </h2>

          <form className="space-y-3 md:px-15" action={formAction}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-normal text-gray-700 mb-3"
              >
                ชื่อผู้ใช้ หรือ อีเมล
              </label>
              <div className="flex items-center bg-blue-300/20 text-black rounded-[25px] px-3 py-4 focus-within:ring-2 focus-within:ring-[#3C467B] hover:bg-blue-300/50">
                <IoPersonSharp className="mx-5 w-5 h-5 self-center" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="w-full border-none outline-none placeholder-black"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-normal text-gray-700 mb-3"
              >
              รหัสผ่าน
              </label>
              <div className="flex items-center bg-blue-300/20 text-black rounded-[25px] px-3 py-4 focus-within:ring-2 focus-within:ring-[#3C467B] hover:bg-blue-300/50">
                <FaLock className="mx-5 w-4 h-4 self-center" />
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  placeholder="Enter your password"
                  className="w-full border-none outline-none placeholder-black"
                />
              </div>
            </div>

            {/* Register */}
          <div className="mt-4 text-start text-sm text-gray-600 flex flex-row justify-between gap-10 items-center">
            <p>
              Don't have an account?{" "}
              <a href="/register" className="text-blue-600 hover:underline">
                Sign up
              </a>
            </p>
            <p>
              <a href="/forgot_password" className="text-blue-600 hover:underline">
                Forgot password?
              </a>
            </p>
          </div>


            {/* Login Button */}
            <button
              type="submit"
              className="w-full md:w-1/2 flex justify-self-center justify-center self-end bg-linear-to-r from-[#6E8CFB] to-[#636CCB] text-white hover:opacity-70 font-bold py-3 mt-8 rounded-[25px] transition-all"
            >
              <div>Login</div>
            </button>
            {state?.message && (
            <div className="mt-4 text-center text-red-500">
              {state.message}
            </div>
          )}
          </form>

          {/* Others Login */}
          <hr className="my-6 border-t"/>
          <div className="justify-items-center items-center space-y-5">
            <div className="font-normal text-center">หรือ</div>
            <button onClick={handleGoogleLogin} className="w-full md:w-8/10 bg-white border border-gray-400 gap-3 rounded-[16px] p-3 flex justify-center justify-self-center items-center hover:bg-gray-200">
              <FcGoogle className="w-6 h-6"/>
              <div className="font-normal text-md">Login with <span className="font-bold">Google</span></div>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-20 flex justify-center">
            © 2025 Project Management. All rights reserved.
          </div>

        </div>
      </div>
    </div>
  );
}
