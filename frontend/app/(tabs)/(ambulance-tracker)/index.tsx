import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { connectToSocket } from "../../../services/socketService";

const ambulanceImage = require("../../../assets/images/ambulance.png");

interface LocationState {
  latitude: number;
  longitude: number;
}

const LiveTracker = () => {
  const [ambulanceLocation, setAmbulanceLocation] = useState<LocationState>({
    latitude: 28.6139,
    longitude: 77.209,
  });
  const [userLocation, setUserLocation] = useState<LocationState | null>(null);

  useEffect(() => {
    const socket = connectToSocket((newLocation: LocationState) => {
      setAmbulanceLocation({ ...newLocation });
      // console.log("New ambulance location:", newLocation);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getUserLocation = async (): Promise<LocationState | null> => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access location was denied");
      return null;
    }

    let location = await Location.getCurrentPositionAsync({});
    const newUserLocation: LocationState = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setUserLocation(newUserLocation);
    return newUserLocation;
  };

  const handleEmergency = async () => {
    const location = await getUserLocation();
    if (location) {
      Alert.alert(
        "Emergency Alert",
        `Your current location has been shared with emergency services.\n\nLatitude: ${location.latitude.toFixed(
          4
        )}\nLongitude: ${location.longitude.toFixed(4)}`
      );
    } else {
      Alert.alert(
        "Emergency Alert",
        "Unable to retrieve your location. Please try again."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚑 Ambulance Live Tracker</Text>
      <MapView
        style={styles.map}
        region={{
          latitude: ambulanceLocation.latitude,
          longitude: ambulanceLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={ambulanceLocation}>
          <View style={styles.ambulanceContainer}>
            <Text style={styles.emoji}>🚑</Text>
          </View>
        </Marker>
        {userLocation && (
          <Marker coordinate={userLocation}>
            <View style={styles.userContainer}>
              <Text style={styles.emoji}>📍</Text>
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.buttonContainer}>
        <Button
          title="Emergency Contact"
          onPress={() => alert("Emergency Contact Triggered")}
          color="#007AFF"
        />
        <Button
          title="Share My Location"
          onPress={handleEmergency}
          color="#FF3B30"
        />
      </View>
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
    marginBottom: 16,
  },
  ambulanceContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  userContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 40,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default LiveTracker;
