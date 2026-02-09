import { Stack } from "expo-router";

export default function AdminFinancieroLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="Documentos" />
    </Stack>
  );
}
