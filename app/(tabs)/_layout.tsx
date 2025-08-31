// app/_layout.tsx
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import SplashScreen from '../SplashScreen';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  return <Slot />;
}
