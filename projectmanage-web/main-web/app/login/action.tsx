"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import axios from "axios";

interface FormState {
  message: string;
}

export async function login(prevState: FormState, formData: FormData) {
  try {
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || typeof password !== "string") {
      return { message: "Email and password are required." };
    }

    const response = await axios.post(`${process.env.STRAPI_BASE_URL}/api/auth/local`, {
      identifier: email,
      password,
    });

    if (response.data?.jwt) {
      (await cookies()).set("token", response.data.jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      
    } else {
      return { message: "Login failed. JWT not received." };
    }
  } catch (error: any) {
    return { message: error?.response?.data?.error?.message || error.message || "Login failed." };
  }
  
  redirect("/test");
}
