import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Companion from "./src/Companion";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Companion />
    </SafeAreaProvider>
  );
}
