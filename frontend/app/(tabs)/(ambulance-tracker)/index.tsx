import React, { useEffect, useState, useRef } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import io from "socket.io-client";

interface LocationState {
  latitude: number;
  longitude: number;
}

interface Route {
  distance: number;
  duration: number;
  eta: string;
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
}

interface Ambulance {
  ambulanceId: string;
  latitude: number;
  longitude: number;
}

const LiveTracker = () => {
  const [userLocation, setUserLocation] = useState<LocationState | null>(null);
  const [ambulance, setAmbulance] = useState<Ambulance | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [socket, setSocket] = useState<any>(null);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const newSocket = io("http://192.168.29.99:3000");
    setSocket(newSocket);

    newSocket.on("ambulanceLocation", (data) => {
      if (ambulance && data.ambulanceId === ambulance.ambulanceId) {
        setAmbulance({
          ...ambulance,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    });

    newSocket.on("ambulanceArrived", (data) => {
      if (ambulance && data.ambulanceId === ambulance.ambulanceId) {
        Alert.alert("Arrival Alert", "Ambulance has arrived at your location!");
      }
    });

    return () => {
      newSocket.close();
    };
  }, [ambulance]);

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

  const fitToUserLocation = (location: LocationState) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
    }
  };

  const handleEmergency = async () => {
    const location = await getUserLocation();
    if (location) {
      try {
        const response = await axios.post(
          "http://192.168.29.99:3000/api/emergency/getambulances",
          {
            latitude: location.latitude,
            longitude: location.longitude,
          }
        );

        if (response.status === 200) {
          const newAmbulance = {
            ambulanceId: response.data.ambulance.ambulanceId,
            latitude: response.data.ambulance.latitude,
            longitude: response.data.ambulance.longitude,
          };
          setAmbulance(newAmbulance);
          setRoute(response.data.route);

          setTimeout(() => {
            fitMapToMarkers(location, newAmbulance);
          }, 100);

          Alert.alert(
            "Emergency Alert",
            `Ambulance dispatched!\nETA: ${new Date(
              response.data.route.eta
            ).toLocaleTimeString()}`
          );
        } else {
          Alert.alert("Emergency Alert", "Failed to fetch ambulance data.");
        }
      } catch (error) {
        console.error("Error fetching ambulance data:", error);
        Alert.alert("Emergency Alert", "Failed to connect to the server.");
      }
    } else {
      Alert.alert(
        "Emergency Alert",
        "Unable to retrieve your location. Please try again."
      );
    }
  };

  const fitMapToMarkers = (user: LocationState, ambulance: Ambulance) => {
    if (mapRef.current) {
      const coordinates = [
        { latitude: user.latitude, longitude: user.longitude },
        { latitude: ambulance.latitude, longitude: ambulance.longitude },
      ];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 100,
          right: 100,
          bottom: 100,
          left: 100,
        },
        animated: true,
      });
    }
  };

  useEffect(() => {
    if (userLocation && ambulance) {
      fitMapToMarkers(userLocation, ambulance);
    }
  }, [ambulance?.latitude, ambulance?.longitude]);

  useEffect(() => {
    const initializeLocation = async () => {
      const location = await getUserLocation();
      if (location) {
        setTimeout(() => {
          fitToUserLocation(location);
        }, 500);
      }
    };

    initializeLocation();
  }, []);

  const routeCoordinates = route?.geometry.coordinates.map(
    ([longitude, latitude]) => ({
      latitude,
      longitude,
    })
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚑 Emergency Assistance</Text>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={
          userLocation
            ? {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : {
                latitude: 0,
                longitude: 0,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
        }
      >
        {userLocation && (
          <Marker coordinate={userLocation} title="Your Location">
            <View style={styles.userContainer}>
              <Text style={styles.emoji}>📍</Text>
            </View>
          </Marker>
        )}
        {ambulance && (
          <Marker
            coordinate={{
              latitude: ambulance.latitude,
              longitude: ambulance.longitude,
            }}
            title="Nearest Ambulance"
          >
            <View style={styles.ambulanceContainer}>
              <Text style={styles.emoji}>🚑</Text>
            </View>
          </Marker>
        )}
        {routeCoordinates && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        )}
      </MapView>

      <View style={styles.buttonContainer}>
        <Button title="Emergency" onPress={handleEmergency} color="#FF3B30" />
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
    textAlign: "center",
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
    justifyContent: "center",
  },
});

export default LiveTracker;
