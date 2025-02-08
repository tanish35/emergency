import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { connectToSocket } from "../../../services/socketService";

const ambulanceImage = require("../../../assets/images/ambulance.png");

const LiveTracker = () => {
  const [location, setLocation] = useState({
    latitude: 28.6139,
    longitude: 77.209,
  });

  useEffect(() => {
    const socket = connectToSocket((newLocation) => {
      //   console.log("Received new location:", newLocation);
      setLocation({ ...newLocation });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚑 Ambulance Live Tracker</Text>
      <MapView
        style={styles.map}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={location}>
          <View style={styles.ambulanceContainer}>
            <Text style={styles.emoji}>🚑</Text>
          </View>
        </Marker>
      </MapView>

      <Button
        title="Emergency Contact"
        onPress={() => alert("Emergency Contact Triggered")}
      />
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
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  ambulanceContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 40, // Make the ambulance emoji large
  },
});

export default LiveTracker;
