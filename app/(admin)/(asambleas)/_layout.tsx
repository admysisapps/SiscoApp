import React from "react";
import { Stack } from "expo-router";
import { AsambleaProvider } from "@/contexts/AsambleaContext";

export default function AsambleasLayout() {
  return (
    <AsambleaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[id]" />
        <Stack.Screen name="asamblea-moderacion" />
        <Stack.Screen name="ControlPreguntas" />
        <Stack.Screen name="crearAsamblea" />
        <Stack.Screen name="votacion-crear" />
        <Stack.Screen name="participantes-lista" />
      </Stack>
    </AsambleaProvider>
  );
}
