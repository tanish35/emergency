import React from "react";
import { View, Text, StyleSheet } from "react-native";

console.log("App.tsx is loaded!"); // Debugging

const HomeScreen = () => {
  console.log("HomeScreen component rendered!"); // Debugging

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Home Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default HomeScreen;
