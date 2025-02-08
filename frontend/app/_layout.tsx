import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";

export default function Layout() {
  console.log("Layout rendered");
  return (
    <View style={styles.container}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
});
