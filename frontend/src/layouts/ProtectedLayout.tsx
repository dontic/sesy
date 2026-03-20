/*
This layout is used to protect routes that require authentication.
It checks if the user is authenticated and then renders the children components.
If the user is not authenticated, it redirects them to the login page.
*/

// React
import { useEffect, useState } from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";

// Zustand
import { useUserStore } from "@/stores/UserStore";

// API
import { authMeRetrieve } from "@/api/django/auth/auth";
import { sesyOnboardingRetrieve } from "@/api/django/onboarding/onboarding";

const ProtectedLayout = () => {
  /* ---------------------------------- HOOKS --------------------------------- */
  const location = useLocation();
  const { setUser, user } = useUserStore();

  // Local useStates
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      // Skip if data is already loaded in the store
      if (user) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const userDetails = await authMeRetrieve({
          signal: controller.signal
        });

        console.debug("User logged in:", userDetails);
        setUser(userDetails);
        setIsAuthenticated(true);

        const onboarding = await sesyOnboardingRetrieve({
          signal: controller.signal
        });
        const isComplete =
          onboarding.username_changed &&
          onboarding.password_changed &&
          onboarding.project_created &&
          onboarding.ses_configured &&
          onboarding.domain_configured;
        setOnboardingComplete(isComplete);
      } catch (error: any) {
        // Only handle errors that aren't from abort
        if (error.name !== "AbortError" && error.name !== "CanceledError") {
          console.debug("User not logged in or error fetching data:", error);
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

  /* --------------------------------- RENDER --------------------------------- */
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export default ProtectedLayout;
