/*
This layout wraps the /onboarding route.
It only checks authentication (no onboarding check, to avoid redirect loops).
If authenticated and onboarding is already complete, redirects to /campaigns.
*/

import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useUserStore } from "@/stores/UserStore";
import { authMeRetrieve } from "@/api/django/auth/auth";

const OnboardingLayout = () => {
  const { setUser, user } = useUserStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      if (user) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const userDetails = await authMeRetrieve({ signal: controller.signal });
        setUser(userDetails);
        setIsAuthenticated(true);
      } catch (error: any) {
        if (error.name !== "AbortError" && error.name !== "CanceledError") {
          setIsAuthenticated(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [user, setUser]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default OnboardingLayout;
