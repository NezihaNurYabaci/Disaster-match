import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="match-list" options={{ title: 'Eşleşmeler' }} />
      <Tabs.Screen name="need-entry" options={{ title: 'İhtiyaç Gir' }} />
      <Tabs.Screen name="offer-entry" options={{ title: 'Yardım Teklif Et' }} />
    </Tabs>
  );
}