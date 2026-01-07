import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Permitir acceso a changePassword incluso si está autenticado
  const isChangePasswordRoute = segments.includes("changePassword");

  // Si está autenticado y NO está en changePassword, ir al index
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isChangePasswordRoute) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, isChangePasswordRoute, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
