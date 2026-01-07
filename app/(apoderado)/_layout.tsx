import { Stack } from "expo-router";
import { ApoderadoProvider } from "@/contexts/ApoderadoContext";

export default function ApoderadoLayout() {
  return (
    <ApoderadoProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="asamblea/[id]" />
        <Stack.Screen name="asamblea-activa/[id]" />
      </Stack>
    </ApoderadoProvider>
  );
}
