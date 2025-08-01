"use server";

import axios from "axios";

interface FormState {
  success: boolean;
  message: string | null;
}

export async function forgotPasswordAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = formData.get("email");

  // Basic validation
  if (typeof email !== "string" || !email) {
    return {
      success: false,
      message: "Please enter a valid email address.",
    };
  }

  const STRAPI_URL = process.env.STRAPI_BASE_URL;

  try {
    await axios.post(`${STRAPI_URL}/api/auth/forgot-password`, {
      email,
    });

    return {
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    };
  } catch (error: any) {
    console.error("Forgot password error:", error.response?.data || error.message);
    
    return {
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    };
  }
}
