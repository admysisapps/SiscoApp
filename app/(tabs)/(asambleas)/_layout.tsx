import React from "react";
import { Stack } from "expo-router";

export default function AsambleasLayout() {
  return (
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
  );
}
