import React from "react";
import { View, Text, StyleSheet } from "react-native";

const EmergencyContact = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Contact</Text>
      <Text>Call Emergency Services at: 112</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
});

export default EmergencyContact;
