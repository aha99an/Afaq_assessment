import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="my-topics" />
        <Stack.Screen name="my-replies" />
        <Stack.Screen name="topic" />
    </Stack>
  );
} 