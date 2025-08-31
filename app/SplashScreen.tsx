import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (typeof onFinish === 'function') {
        onFinish(); // Trigger transition to main screen
      }
    }, 5000); // 5 seconds

    return () => clearTimeout(timeout);
  }, [onFinish]);

  return (
    <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
      <Animatable.Image
        animation="zoomIn"
        duration={1500}
        easing="ease-in-out"
        source={require('../assets/images/espyreal.png')} // ✅ Corrected path
        style={styles.logo}
        resizeMode="contain"
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
  },
});

export default SplashScreen;