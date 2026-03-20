import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate
} from "react-router-dom";

// Styles
import "./index.css";

// Layouts
import ProtectedLayout from "@/layouts/ProtectedLayout";
import OnboardingLayout from "@/layouts/OnboardingLayout";

// Components
import { Toaster } from "sonner";
import LoadingFallback from "@/components/LoadingFallback";

// Pages - Lazy loaded for code splitting
const Campaigns = lazy(() => import("@/pages/Campaigns"));
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Settings = lazy(() => import("@/pages/Settings"));
const Audience = lazy(() => import("@/pages/Audience"));
const Unsubscribe = lazy(() => import("@/pages/Unsubscribe"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/campaigns" replace />
      },
      {
        path: "/campaigns",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Campaigns />
          </Suspense>
        )
      },
      {
        path: "/audience",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Audience />
          </Suspense>
        )
      },
      {
        path: "/settings",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Settings />
          </Suspense>
        )
      }
    ]
  },
  {
    path: "/onboarding",
    element: <OnboardingLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Onboarding />
          </Suspense>
        )
      }
    ]
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Login />
      </Suspense>
    )
  },
  {
    path: "/unsubscribe",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Unsubscribe />
      </Suspense>
    )
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <NotFound />
      </Suspense>
    )
  }
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster richColors />
  </StrictMode>
);
