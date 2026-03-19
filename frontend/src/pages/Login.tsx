import { LoginForm } from "@/components/login/LoginForm";
import type { LoginFormValues } from "@/components/login/LoginForm";
import { toast } from "sonner";
import RedirectIfAuthenticatedLayout from "@/layouts/RedirectIfAuthenticatedLayout";
import { authLoginCreate } from "@/api/django/auth/auth";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/assets/icon.svg?react";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  type CredentialResponse
} from "@react-oauth/google";

const Login = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (formData: LoginFormValues) => {
    try {
      setIsLoading(true);
      await authLoginCreate({
        username: formData.username,
        password: formData.password
      });
      navigate("/campaigns");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Invalid username or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RedirectIfAuthenticatedLayout>
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className={"flex flex-col gap-6"}>
            {/* Header */}
            <div className="flex flex-col items-center gap-2">
              <a
                href="#"
                className="flex flex-col items-center gap-2 font-medium"
              >
                <span className="sr-only">Sesy</span>
              </a>
              <Icon className="h-[50px]" />
              <h1 className="text-xl font-bold">Welcome to Sesy</h1>
            </div>

            {/* Login form */}
            <LoginForm onSubmit={handleLogin} isSubmitting={isLoading} />
          </div>
        </div>
      </div>
    </RedirectIfAuthenticatedLayout>
  );
};

export default Login;
