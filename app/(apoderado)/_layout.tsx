import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApoderadoProvider } from "@/contexts/ApoderadoContext";

export default function ApoderadoLayout() {
  return (
    <ApoderadoProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="asamblea/[id]" />
          <Stack.Screen name="asamblea-activa/[id]" />
        </Stack>
      </SafeAreaView>
    </ApoderadoProvider>
  );
}
