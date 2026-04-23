/*
import React from "react";
import { Redirect } from "expo-router";


const PANTALLA_DEV = "/(screens)/test-form-styles";

export default function Index() {
  //Ir directo a la pantalla de desarrollo
  return <Redirect href={PANTALLA_DEV} />;
}

  */

import React from "react";
import { Redirect } from "expo-router";
import LoadingScreen from "@/components/LoadingScreen";
import { useAppNavigation } from "@/hooks/useAppNavigation";

export default function Index() {
  const destination = useAppNavigation();

  if (destination.type === "splash") return null;
  if (destination.type === "loading") return <LoadingScreen />;
  return <Redirect href={destination.href as any} />;
}
