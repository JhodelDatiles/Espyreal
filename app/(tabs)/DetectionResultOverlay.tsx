import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const NUM_COINS = 20; // number of falling coins

const CurrencyResultDisplay = ({
  denomination,
  confidence,
  billImage,
  billType,
  onWalletPress,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const billScaleAnim = useRef(new Animated.Value(0)).current;
  const [sound, setSound] = useState(null);

  // 💰 Generate random animations for coins across screen
  const coinAnimations = useRef(
    [...Array(NUM_COINS)].map(() => ({
      translateY: new Animated.Value(-Math.random() * height),
      translateX: new Animated.Value(Math.random() * width), // random horizontal position
      rotate: new Animated.Value(0),
      size: 30 + Math.random() * 80, // random coin size
    }))
  ).current;

  // 💫 Start falling animation for coins
  const startFallingCoins = () => {
    coinAnimations.forEach((anim) => {
      const fall = () => {
        // reset start position randomly across the width
        anim.translateY.setValue(-100 - Math.random() * 200);
        anim.translateX.setValue(Math.random() * width);
        anim.rotate.setValue(0);

        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: height + 150,
            duration: 3000 + Math.random() * 2000,
            delay: Math.random() * 1500,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 1,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ]).start(() => fall());
      };
      fall();
    });
  };

  // 🔊 Play coin/cash sound
  async function playCashSound() {
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/audio/tutorial/cash-out.mp3")
    );
    setSound(sound);
    await sound.playAsync();
  }

  // 🧹 Clean up sound on exit
  useEffect(() => {
    return sound
      ? () => {
          sound.stopAsync();
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(billScaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Loop pulse animation for bill display
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // start coins + sound
    startFallingCoins();
    playCashSound();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#7B68EE", "#9370DB", "#8B7BB8"]}
        style={styles.gradient}
      >
        {/* 💰 Falling Coins Across Screen */}
        {coinAnimations.map((anim, index) => (
          <Animated.Image
            key={index}
            source={require("../../assets/images/Img/coin.png")}
            style={{
              position: "absolute",
              width: anim.size,
              height: anim.size,
              opacity: 0.9,
              transform: [
                { translateY: anim.translateY },
                { translateX: anim.translateX },
                {
                  rotate: anim.rotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            }}
            resizeMode="contain"
          />
        ))}

        {/* 🌟 Logo */}
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
          <Image
            source={require("../../assets/images/Img/espyreal-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 🪙 Bill/Coin Image */}
        {billImage && (
          <Animated.View
            style={[
              styles.billImageContainer,
              { opacity: fadeAnim, transform: [{ scale: billScaleAnim }] },
            ]}
          >
            <View style={styles.billImageWrapper}>
              <Image
                source={billImage}
                style={billType === "coin" ? styles.coinImage : styles.billImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
        )}

        {/* 💵 Amount Display */}
        <Animated.View
          style={[
            styles.amountContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.amountText}>{denomination}</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: "100%",
  },
  gradient: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    position: "relative",
    height: 80,
    width: 200,
    marginBottom: 20,
  },
  billImageContainer: {
    height: 90,
    zIndex: 1,
    elevation: 10,
    top: 150,
  },
  billImageWrapper: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  billImage: {
    width: width - 150,
    height: 140,
    bottom: 10,
  },
  coinImage: {
    width: 140,
    height: 140,
    bottom: 20,
  },
  amountContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    width: width - 60,
    alignItems: "center",
  },
  amountText: {
    fontSize: 40,
    fontWeight: "800",
    color: "#7B68EE",
    letterSpacing: 1,
    textAlign: "center",
  },
  logoImage: {
    width: width * 0.4,
    height: width * 0.4,
    marginTop: 50,
  },
});

export default CurrencyResultDisplay;
