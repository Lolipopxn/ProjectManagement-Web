"use server";

import { redirect } from "next/navigation";

interface RegisterResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

interface StrapiError {
  error: {
    status: number;
    name: string;
    message: string;
    details: any;
  };
}

export async function registerUser(formData: FormData) {
  const fullname = formData.get("fullname");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const agreeToTerms = formData.get("agreeToTerms");

  if (!fullname || !email || !password || !confirmPassword) {
    return { error: "Please fill in all required fields." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (!agreeToTerms) {
    return { error: "You must agree to the terms and conditions." };
  }

  const STRAPI_URL = process.env.STRAPI_BASE_URL;

  try {
    const response = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: fullname,
        email,
        password,
      }),
    });

    const data: RegisterResponse | StrapiError = await response.json();

    if (!response.ok) {
      const errorData = data as StrapiError;
      return { error: errorData.error?.message || "Registration failed." };
    }

    const successData = data as RegisterResponse;
    console.log("Registration successful! User:", successData.user);
    
  } catch (error) {
    console.error("An error occurred:", error);
    return { error: "Failed to connect to the server." };
  }
  
  redirect('/auth_page/login');

}