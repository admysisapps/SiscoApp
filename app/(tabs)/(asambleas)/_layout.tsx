// app/(tabs)/(asambleas)/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { AsambleaProvider } from "@/contexts/AsambleaContext";

export default function AsambleasLayout() {
  return (
    <AsambleaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[id]" />
        <Stack.Screen
          name="asamblea-activa"
          options={{
            gestureEnabled: false,
            headerBackVisible: false,
          }}
        />
      </Stack>
    </AsambleaProvider>
  );
}
