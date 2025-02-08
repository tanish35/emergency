import { Stack } from 'expo-router';

export default function AmbulanceTrackerLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: 'Live Tracker' }} />
            <Stack.Screen name="emergency-contact" options={{ title: 'Emergency Contact' }} />
        </Stack>
    );
}
