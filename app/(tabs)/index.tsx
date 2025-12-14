import * as tf from "@tensorflow/tfjs";
import { bundleResourceIO } from "@tensorflow/tfjs-react-native";
import { decode as atob } from "base-64";
import { Audio } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Font from 'expo-font';
import { manipulateAsync } from "expo-image-manipulator";
import * as jpeg from "jpeg-js";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CurrencyResultDisplay from './DetectionResultOverlay';
import WalletComponent from "./WalletComponent";

const getBillInfo = (denomination) => {
  const billInfo = {
    // 🪙 Old & New PHP Coins
    '25 CENTS NEW': { image: require('../../assets/images/Img/Centsnew.png'), type: 'coin' },
    '1 PESO NEW': { image: require('../../assets/images/Img/1new.png'), type: 'coin' },
    '5 PESO NEW': { image: require('../../assets/images/Img/5new.png'), type: 'coin' },
    '10 PESO NEW': { image: require('../../assets/images/Img/10new.png'), type: 'coin' },
    '20 PESO COIN': { image: require('../../assets/images/Img/20coin.png'), type: 'coin' },
    '25 CENTS OLD': { image: require('../../assets/images/Img/Centsold.png'), type: 'coin' },
    '1 PESO COIN': { image: require('../../assets/images/Img/1old.png'), type: 'coin' },
    '5 PESO COIN': { image: require('../../assets/images/Img/5old.png'), type: 'coin' },
    '10 PESO COIN': { image: require('../../assets/images/Img/10old.png'), type: 'coin' },

    // 💵 Old Peso Bills
    '20 PESO': { image: require('../../assets/images/Img/OLDPESOBILLS6.png'), type: 'bill' },
    '50 PESO': { image: require('../../assets/images/Img/OLDPESOBILLS5.png'), type: 'bill' },
    '100 PESO': { image: require('../../assets/images/Img/OLDPESOBILLS4.png'), type: 'bill' },
    '200 PESO': { image: require('../../assets/images/Img/OLDPESOBILLS3.png'), type: 'bill' },
    '500 PESO': { image: require('../../assets/images/Img/OLDPESOBILLS2.png'), type: 'bill' },
    '1000 PESO': { image: require('../../assets/images/Img/OLDPESOBILLS1.png'), type: 'bill' },

    // 🧾 New Peso Bills
    '50NEW PHP PESO': { image: require('../../assets/images/Img/NEWPHPBILLS4.png'), type: 'bill' },
    '100NEW PHP PESO': { image: require('../../assets/images/Img/NEWPHPBILLS3.png'), type: 'bill' },
    '500NEW PHP PESO': { image: require('../../assets/images/Img/NEWPHPBILLS2.png'), type: 'bill' },
    '1000NEW PHP PESO': { image: require('../../assets/images/Img/NEWPHPBILLS1.png'), type: 'bill' },

    // 💵 USD Bills
    '1 DOLLARS': { image: require('../../assets/images/Img/USDBILLS6.png'), type: 'bill' },
    '5 DOLLARS': { image: require('../../assets/images/Img/USDBILLS5.png'), type: 'bill' },
    '10 DOLLARS': { image: require('../../assets/images/Img/USDBILLS4.png'), type: 'bill' },
    '20 DOLLARS': { image: require('../../assets/images/Img/USDBILLS3.png'), type: 'bill' },
    '50 DOLLARS': { image: require('../../assets/images/Img/USDBILLS2.png'), type: 'bill' },
    '100 DOLLARS': { image: require('../../assets/images/Img/USDBILLS1.png'), type: 'bill' },
  };

  return billInfo[denomination] || { color: '#9E9E9E', symbol: '¤', label: denomination };
};

// --- Model Imports ---
const modelPaths = {
  coins: {
    json: require("../../assets/model/coins/model.json"),
    weights: [require("../../assets/model/coins/weights.bin")],
  },
  old: {
    json: require("../../assets/model/peso/model.json"),
    weights: [require("../../assets/model/peso/weights.bin")],
  },
  new: {
    json: require("../../assets/model/peso/new/model.json"),
    weights: [require("../../assets/model/peso/new/weights.bin")],
  },
  usd: {
    json: require("../../assets/model/dollar/model.json"),
    weights: [require("../../assets/model/dollar/weights.bin")],
  },
};

const CURRENCY_AUDIO = {
  "1 PESO COIN": require("../../assets/audio/phpcoins/piso.mp3"),
  "5 PESO COIN": require("../../assets/audio/phpcoins/5.mp3"),
  "10 PESO COIN": require("../../assets/audio/phpcoins/10.mp3"),
  "20 PESO COIN": require("../../assets/audio/phpcoins/20coin.mp3"),
  "1 PESO NEW": require("../../assets/audio/phpcoins/pisonew.mp3"),
  "5 PESO NEW": require("../../assets/audio/phpcoins/5new.mp3"),
  "10 PESO NEW": require("../../assets/audio/phpcoins/10new.mp3"),
  "25 CENTS NEW": require("../../assets/audio/phpcoins/25centsnew.mp3"),
  "25 CENTS OLD": require("../../assets/audio/phpcoins/25cents.mp3"),
  "20 PESO": require("../../assets/audio/oldphp/20pesos.mp3"),
  "50 PESO": require("../../assets/audio/oldphp/50pesos.mp3"),
  "100 PESO": require("../../assets/audio/oldphp/100pesos.mp3"),
  "200 PESO": require("../../assets/audio/oldphp/200pesos.mp3"),
  "500 PESO": require("../../assets/audio/oldphp/500pesos.mp3"),
  "1000 PESO": require("../../assets/audio/oldphp/1000pesos.mp3"),
  "50NEW PHP PESO": require("../../assets/audio/newphp/50new.mp3"),
  "100NEW PHP PESO": require("../../assets/audio/newphp/100new.mp3"),
  "500NEW PHP PESO": require("../../assets/audio/newphp/500new.mp3"),
  "1000NEW PHP PESO": require("../../assets/audio/newphp/1000new.mp3"),
  "1 DOLLARS": require("../../assets/audio/usd/1dollars.mp3"),
  "5 DOLLARS": require("../../assets/audio/usd/5dollars.mp3"),
  "10 DOLLARS": require("../../assets/audio/usd/10dollars.mp3"),
  "20 DOLLARS": require("../../assets/audio/usd/20dollars.mp3"),
  "50 DOLLARS": require("../../assets/audio/usd/50dollars.mp3"),
  "100 DOLLARS": require("../../assets/audio/usd/100dollars.mp3"),
};

const GESTURE_AUDIO = {
  // If you add a swipePrompt audio file, uncomment and add it here:
  // swipePrompt: require("../../assets/audio/gestures/swipromt.mp3"),
  swipeLeft: require("../../assets/audio/gestures/addprompt.mp3"),
  swipeRight: require("../../assets/audio/gestures/readyna.mp3"),
};

const picInputShapeSize = { width: 224, height: 224 };

const MODEL_CLASSES = {
  coins: {
    0: "1 PESO COIN",
    1: "5 PESO COIN",
    2: "10 PESO COIN",
    3: "20 PESO COIN",
    4: "1 PESO NEW",
    5: "5 PESO NEW",
    6: "10 PESO NEW",
    7: "25 CENTS NEW",
    8: "25 CENTS OLD",
    9: "NO BILLS",
  },
  old: {
    0: "20 PESO",
    1: "50 PESO",
    2: "100 PESO",
    3: "200 PESO",
    4: "500 PESO",
    5: "1000 PESO",
    6: "NO BILLS",
  },
  new: {
    0: "50NEW PHP PESO",
    1: "100NEW PHP PESO",
    2: "500NEW PHP PESO",
    3: "1000NEW PHP PESO",
    4: "NO BILLS",
  },
  usd: {
    0: "1 DOLLARS",
    1: "5 DOLLARS",
    2: "10 DOLLARS",
    3: "20 DOLLARS",
    4: "50 DOLLARS",
    5: "100 DOLLARS",
    6: "NO BILLS",
  },
};

const CURRENCY_VALUES = {
  "1 PESO COIN": 1,
  "5 PESO COIN": 5,
  "10 PESO COIN": 10,
  "20 PESO COIN": 20,
  "1 PESO NEW": 1,
  "5 PESO NEW": 5,
  "10 PESO NEW": 10,
  "25 CENTS NEW": 0.25,
  "25 CENTS OLD": 0.25,
  "20 PESO": 20,
  "50 PESO": 50,
  "100 PESO": 100,
  "200 PESO": 200,
  "500 PESO": 500,
  "1000 PESO": 1000,
  "50NEW PHP PESO": 50,
  "100NEW PHP PESO": 100,
  "500NEW PHP PESO": 500,
  "1000NEW PHP PESO": 1000,
  "1 DOLLARS": 1,
  "5 DOLLARS": 5,
  "10 DOLLARS": 10,
  "20 DOLLARS": 20,
  "50 DOLLARS": 50,
  "100 DOLLARS": 100,
  "NO BILLS": 0,
};

// --- New: thresholds and margin checks
const MIN_CONFIDENCE = {
  coins: 0.98,
  old: 1.0,
  new: 1.0,
  usd: 1.0,
};
const MIN_MARGIN = 0.20; // top pobability must beat 2nd by this amount

function imageToTensor(rawImageData, imageSize = 224) {
  const TO_UINT8ARRAY = true;
  const { width, height, data } = jpeg.decode(rawImageData, TO_UINT8ARRAY);
  return tf.tidy(() => {
    const tensor = tf.browser.fromPixels({ data, width, height }, 3);
    const resized = tf.image.resizeBilinear(tensor, [imageSize, imageSize]);
    const normalized = resized.sub(127.5).div(127.5);
    return normalized.expandDims(0);
  });
}

async function getTopKClasses(prediction, topK, mode) {
  const values = await prediction.data();
  const valuesAndIndices = [];

  for (let i = 0; i < values.length; i++) {
    valuesAndIndices.push({
      value: values[i],
      index: i,
      className: MODEL_CLASSES[mode]?.[i] || `Unknown_${i}`,
    });
  }

  valuesAndIndices.sort((a, b) => b.value - a.value);

  return valuesAndIndices.slice(0, topK).map((v) => ({
    className: v.className,
    probability: v.value,
  }));
}

const classify = async (model, img, mode = "coins", topk = 7) => {
  if (!model) return null;
  try {
    const prediction = model.predict(img);
    const classes = await getTopKClasses(prediction, topk, mode);
    prediction.dispose();
    return classes;
  } catch (error) {
    console.error("Classification error:", error);
    return null;
  }
};

const PesoDetectorApp = () => {
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wallet, setWallet] = useState([]);
  const [showWallet, setShowWallet] = useState(false);
  const [cameraType, setCameraType] = useState("back");
  const [showOverlay, setShowOverlay] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [awaitingGesture, setAwaitingGesture] = useState(false); 
  const [pendingDetection, setPendingDetection] = useState(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(0.7);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const walletAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;

  const [models, setModels] = useState({});
  const [activeCurrency, setActiveCurrency] = useState("coins");

  const awaitingGestureRef = useRef(awaitingGesture);
  const pendingDetectionRef = useRef(pendingDetection);
  const currentSoundRef = useRef(null);
  const gesturePromptTimeoutRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingAudioRef = useRef(false);
  
  const showWalletRef = useRef(false);

  const lastTapRef = useRef(0);
  const doubleTapDelayRef = useRef(null);

  useEffect(() => {
    awaitingGestureRef.current = awaitingGesture;
  }, [awaitingGesture]);

  useEffect(() => {
    pendingDetectionRef.current = pendingDetection;
  }, [pendingDetection]);

  useEffect(() => {
    showWalletRef.current = showWallet;
  }, [showWallet]);

  useEffect(() => {
    // Set zoom: 0.5 for coins, 0.2 for others
    setCameraZoom(activeCurrency === "coins" ? 0.5 : 0.2);
  }, [activeCurrency]);

  // When models or activeCurrency change, ensure `model` points to the active one
  useEffect(() => {
    if (models && models[activeCurrency]) {
      setModel(models[activeCurrency]);
    }
  }, [activeCurrency, models]);

  // Load fonts on mount
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Caprasimo': require('../../assets/fonts/tutsFonts/Caprasimo-Regular.ttf'),
          'SpaceMono-Regular': require('../../assets/fonts/tutsFonts/SpaceMono-Regular.ttf')
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error("Audio mode setup error:", error);
      }
      
      await loadAllModels();
    };
    
    initializeApp();
  }, []);

  const loadAllModels = async () => {
    try {
      await tf.ready();
      const loadedModels = {};

      for (const key of Object.keys(modelPaths)) {
        const { json, weights } = modelPaths[key];
        const loadedModel = await tf.loadLayersModel(bundleResourceIO(json, weights));
        loadedModels[key] = loadedModel;
      }

      setModels(loadedModels);
      // set model to current activeCurrency (useEffect will also handle this)
      if (loadedModels[activeCurrency]) {
        setModel(loadedModels[activeCurrency]);
      }

      console.log("✅ All models loaded successfully");
    } catch (error) {
      console.error("❌ Error loading models:", error);
    }
  };

  useEffect(() => {
    Animated.timing(walletAnim, {
      toValue: showWallet ? 1 : 0,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [showWallet]);

  useEffect(() => {
    Animated.timing(overlayAnim, {
      toValue: showOverlay ? 1 : 0,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [showOverlay]);

  const playSound = async (soundFile, priority = false, onComplete = null) => {
    try {
      if (!soundFile) return;
      
      if (priority) {
        await stopAllAudio();
        audioQueueRef.current = [];
      }
      
      audioQueueRef.current.push({ soundFile, onComplete });
      
      if (!isPlayingAudioRef.current) {
        await playNextInQueue();
      }
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  };

  const playNextInQueue = async () => {
  if (audioQueueRef.current.length === 0) {
    isPlayingAudioRef.current = false;
    return;
  }

  isPlayingAudioRef.current = true;
  const { soundFile, onComplete } = audioQueueRef.current.shift();

  try {
    const { sound } = await Audio.Sound.createAsync(soundFile, { shouldPlay: true });
    currentSoundRef.current = sound;

    // guard: only attach callback if sound exists
    if (sound && typeof sound.setOnPlaybackStatusUpdate === "function") {
      sound.setOnPlaybackStatusUpdate(async (status) => {
        try {
          if (!status) return;
          if (status.didJustFinish) {
            // attempt to unload, but protect with try/catch & check status
            try {
              const s = currentSoundRef.current;
              if (s) {
                const st = await s.getStatusAsync();
                if (st && st.isLoaded) {
                  await s.unloadAsync().catch((e) => {
                    console.warn("playNextInQueue: unloadAsync warning:", e?.message || e);
                  });
                }
              }
            } catch (e) {
              console.warn("playNextInQueue: getStatus/unload error (ignored):", e?.message || e);
            }

            // clear ref if it still points to this sound
            if (currentSoundRef.current === sound) {
              currentSoundRef.current = null;
            }

            if (onComplete) {
              try { onComplete(); } catch (e) { console.warn("onComplete threw:", e); }
            }

            // next in queue
            await playNextInQueue();
          }
        } catch (e) {
          console.warn("playNextInQueue status handler error:", e?.message || e);
        }
      });
    }
  } catch (error) {
    console.error("Error playing audio:", error);
    isPlayingAudioRef.current = false;
    if (onComplete) {
      try { onComplete(); } catch (e) { console.warn("onComplete threw:", e); }
    }
    // continue with next entry
    await playNextInQueue();
  }
};



  const stopAllAudio = async () => {
  try {
    // cancel gesture timeout if any
    if (gesturePromptTimeoutRef.current) {
      clearTimeout(gesturePromptTimeoutRef.current);
      gesturePromptTimeoutRef.current = null;
    }

    // clear queued audios first (so playNextInQueue won't restart them)
    audioQueueRef.current = [];

    // if there's a current sound, safely stop/unload it
    const cur = currentSoundRef.current;
    if (cur) {
      try {
        // first check if the player is loaded
        const status = await cur.getStatusAsync().catch(() => null);
        if (status && status.isLoaded) {
          // stop if it's playing
          if (status.isPlaying) {
            await cur.stopAsync().catch((e) => {
              // ignore known race errors
              console.warn("stopAllAudio: stopAsync warning:", e?.message || e);
            });
          }
          // then unload
          await cur.unloadAsync().catch((e) => {
            console.warn("stopAllAudio: unloadAsync warning:", e?.message || e);
          });
        }
      } catch (e) {
        // final safety net: log but do not throw
        console.warn("stopAllAudio: error while stopping/unloading (ignored):", e?.message || e);
      } finally {
        // always clear ref
        currentSoundRef.current = null;
      }
    }

    isPlayingAudioRef.current = false;
  } catch (error) {
    // never throw; just log so app keeps running
    console.warn("Error stopping audio (ignored):", error?.message || error);
    isPlayingAudioRef.current = false;
    currentSoundRef.current = null;
    audioQueueRef.current = [];
  }
};

  const playCurrencySound = async (denomination) => {
    const soundFile = CURRENCY_AUDIO[denomination];
    await playSound(soundFile);
  };

  const playGesturePrompt = async () => {
    // Be safe: only attempt if audio exists
    if (!GESTURE_AUDIO.swipePrompt) return;
    await playSound(GESTURE_AUDIO.swipePrompt);
  };

  const addToWallet = (denomination, confidence) => {
    // Prevent adding NO BILLS or low confidence detections
    if (denomination === "NO BILLS" || confidence < 0.5) {
      console.log("Cannot add to wallet: Invalid denomination or low confidence");
      return;
    }
    
    // Stop all audio and clear queue
    stopAllAudio();
    
    const newBill = {
      id: Date.now() + Math.random(),
      denomination,
      value: CURRENCY_VALUES[denomination],
      timestamp: Date.now(),
      confidence,
    };
    setWallet((prev) => [newBill, ...prev]);
    
    // Reset all states
    setShowOverlay(false);
    setPredictions(null);
    setPendingDetection(null);
    setAwaitingGesture(false);
    setSuccessMessage("");
    
    // Play add to wallet sound with priority
    playSound(GESTURE_AUDIO.swipeLeft, true);
  };

  const resetForNewScan = () => {
    // Stop all audio and clear queue
    stopAllAudio();
    
    setPredictions(null);
    setPendingDetection(null);
    setAwaitingGesture(false);
    setShowOverlay(false);
    setSuccessMessage("");
    
    // Play ready for new scan sound with priority
    playSound(GESTURE_AUDIO.swipeRight, true);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: (evt, gestureState) => {
        gestureState.initialTime = Date.now();
      },
      onPanResponderMove: (evt, gestureState) => {
        if (awaitingGestureRef.current && pendingDetectionRef.current) {
          // Only allow gesture if there's a valid pending detection
          const detection = pendingDetectionRef.current;
          if (detection && detection.className !== "NO BILLS" && detection.probability >= 0.5) {
            swipeAnim.setValue(gestureState.dx);
          }
        }
        else if (gestureState.dy < -20 && !showWalletRef.current) {
          const opacity = Math.min(Math.abs(gestureState.dy) / 100, 1);
          walletAnim.setValue(opacity);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const SWIPE_THRESHOLD = 100;
        const VERTICAL_THRESHOLD = 150;
        const TAP_THRESHOLD = 10;
        const TAP_TIME_THRESHOLD = 300;

        const moveDistance = Math.sqrt(
          gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy
        );
        const gestureTime = Date.now() - (gestureState.initialTime || 0);

        // Handle tap
        if (moveDistance < TAP_THRESHOLD && gestureTime < TAP_TIME_THRESHOLD) {
          handleTap();
          return;
        }

        // Handle horizontal swipes only when awaiting gesture with valid detection
        if (awaitingGestureRef.current && pendingDetectionRef.current) {
          const detection = pendingDetectionRef.current;
          
          // Only process swipes if detection is valid (not NO BILLS and high confidence)
          if (detection && detection.className !== "NO BILLS" && detection.probability >= 0.95) {
            if (gestureState.dx < -SWIPE_THRESHOLD) {
              // Swipe left - add to wallet
              addToWallet(detection.className, detection.probability);
              swipeAnim.setValue(0);
              return;
            }
            else if (gestureState.dx > SWIPE_THRESHOLD) {
              // Swipe right - skip and ready for new scan
              Animated.timing(swipeAnim, {
                toValue: 400,
                duration: 200,
                useNativeDriver: true,
              }).start(() => {
                resetForNewScan();
                swipeAnim.setValue(0);
              });
              return;
            }
            else {
              // Swipe not far enough - bounce back
              Animated.spring(swipeAnim, {
                toValue: 0,
                friction: 5,
                useNativeDriver: true,
              }).start();
              return;
            }
          } else {
            // Invalid detection (NO BILLS or low confidence) - reset without gesture
            Animated.spring(swipeAnim, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
            return;
          }
        }

        // Handle vertical swipe to show wallet
        if (gestureState.dy < -VERTICAL_THRESHOLD && !awaitingGestureRef.current) {
          setShowWallet(true);
          return;
        }

        // Reset animations
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        
        if (!showWalletRef.current) {
          Animated.spring(walletAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // --- Updated classifyImage with acceptance rules + audio only when accepted
  const classifyImage = async (uri) => {
    if (!uri || !model) return;
    try {
      setIsProcessing(true);
      setShowOverlay(false);
      setPredictions(null);
      setPendingDetection(null);
      setAwaitingGesture(false);
      
      // Stop any playing audio before new detection
      await stopAllAudio();
      
      const resizedPhoto = await manipulateAsync(
        uri,
        [{ resize: picInputShapeSize }],
        { format: "jpeg", base64: true, compress: 1.0 }
      );
      const base64 = resizedPhoto.base64;
      const arrayBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const imageTensor = imageToTensor(arrayBuffer, 224);
      const results = await classify(models[activeCurrency], imageTensor, activeCurrency);
      setPredictions(results);

      if (results && results.length > 0) {
        const top = results[0];
        const second = results[1] || { probability: 0 };
        const minConf = MIN_CONFIDENCE[activeCurrency] ?? 0.7;

        console.log("Top prediction:", top, "Second:", second, "mode:", activeCurrency);

        // acceptance rules:
        // 1) not "NO BILLS"
        // 2) prob >= minConf
        // 3) margin between top and second >= MIN_MARGIN
        const isNoBills = top.className === "NO BILLS";
        const hasEnoughConfidence = top.probability >= minConf;
        const hasClearMargin = (top.probability - second.probability) >= MIN_MARGIN;

        if (!isNoBills && hasEnoughConfidence && hasClearMargin) {
          // accepted detection -> play currency sound then show overlay & gestures
          await playCurrencySound(top.className);
          setPendingDetection(top);
          setAwaitingGesture(true);
          setShowOverlay(true);

          // prompt for swipe after currency sound finishes
          gesturePromptTimeoutRef.current = setTimeout(() => {
            if (awaitingGestureRef.current) {
              playGesturePrompt();
            }
          }, 1200);
        } else {
          // NOT accepted: do NOT play currency sound, show no overlay or gestures
          console.log("Rejected detection (no overlay). isNoBills:", isNoBills, "conf:", top.probability, "margin:", (top.probability - second.probability));
          setSuccessMessage("");
          setPendingDetection(null);
          setAwaitingGesture(false);
        }
      }

      imageTensor.dispose();
    } catch (error) {
      console.error("Classification error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || awaitingGesture) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      await classifyImage(photo.uri);
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  const handleDoubleTap = () => {
    if (!awaitingGesture && !isProcessing) {
      takePhoto();
    }
  };

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (doubleTapDelayRef.current) {
        clearTimeout(doubleTapDelayRef.current);
        doubleTapDelayRef.current = null;
      }
      lastTapRef.current = 0;
      handleDoubleTap();
    } else {
      lastTapRef.current = now;
      if (doubleTapDelayRef.current) {
        clearTimeout(doubleTapDelayRef.current);
      }
      doubleTapDelayRef.current = setTimeout(() => {
        if (!isProcessing && !awaitingGesture && showOverlay) {
          setShowOverlay(false);
        }
        lastTapRef.current = 0;
      }, DOUBLE_TAP_DELAY);
    }
  };

  const toggleCurrencyMode = () => {
    if (awaitingGesture) return;
    
    // Stop audio when changing modes
    stopAllAudio();
    
    const modes = ["coins", "old", "new", "usd"];
    const currentIndex = modes.indexOf(activeCurrency);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setActiveCurrency(nextMode);
    // model will follow via useEffect

    setSuccessMessage(`🔄 Switched to ${nextMode.toUpperCase()} detection`);
    setShowOverlay(true);
    
    // Reset states when changing mode
    setPredictions(null);
    setPendingDetection(null);
    setAwaitingGesture(false);
  };

  const toggleWallet = () => {
    setShowWallet(!showWallet);
  };

  return (
    <SafeAreaView style={styles.cameraContainer}>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <CameraView ref={cameraRef} style={styles.camera} facing={cameraType} zoom={cameraZoom} />
        <Image source={require("../../assets/images/Img/focus-frame-removebg-preview.png")}
        style={styles.cameraPointer}/>

        {isProcessing && (
          <View style={styles.processingOverlay}>
            <Image
              style={{ width: 50, height: 50 }}
              source={require("../../assets/images/ice.png")}
            />
            <Image
              style={{ width: 160, height: 50 }}
              source={require("../../assets/images/identifyingCurrency.png")}
            />
          </View>
        )}

        {showOverlay && !isProcessing && successMessage !== "" && !awaitingGesture && (
          <Animated.View style={[styles.successContainer, { opacity: overlayAnim }]}>
            <Text style={styles.successText}>{successMessage}</Text>
          </Animated.View>
        )}

        {showOverlay && !isProcessing && predictions && awaitingGesture && pendingDetection && (
          <CurrencyResultDisplay
            visible={showOverlay}
            denomination={predictions[0].className}
            confidence={predictions[0].probability}
            billImage={getBillInfo(predictions[0].className).image}
            billType={getBillInfo(predictions[0].className).type}
            swipeAnim={swipeAnim}
            onWalletPress={() => {
              const detection = predictions[0];
              if (detection && detection.className !== "NO BILLS" && detection.probability >= 0.5) {
                addToWallet(detection.className, detection.probability);
              }
            }}
            onDismiss={() => {
              resetForNewScan();
            }}
          />
        )}

        <View style={[styles.cameraControls, styles.cameraControlsShadow]}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleWallet}
          >
            <Image
              source={require("../../assets/images/Img/wallet.png")}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.captureButton, awaitingGesture && styles.disabledButton]} 
            onPress={takePhoto}
            disabled={awaitingGesture}
          >
            <Image
              source={require("../../assets/images/Img/camera.png")}
              style={{ width: 40, height: 40 }}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleCurrencyMode}>
            <Text style={styles.currencyText}>{activeCurrency.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <Animated.View
          style={{
            position: "absolute",
            bottom: 90,
            left: 20,
            right: 20,
            opacity: walletAnim,
            transform: [
              {
                scale: walletAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
              {
                translateY: walletAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [200, 0],
                }),
              },
            ],
          }}
        >
          {showWallet && (
            <WalletComponent
              wallet={wallet}
              onClearWallet={() => setWallet([])}
              visible={showWallet}
              onClose={() => setShowWallet(false)}
              currencyValues={CURRENCY_VALUES}
              onRemoveItem={(id) =>
                setWallet((prev) => prev.filter((item) => item.id !== id))
              }
            />
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  cameraContainer: { flex: 1, backgroundColor: "black"  },
  camera: { flex: 1 },
  processingOverlay: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(81,10,201,0.8)",
    padding: 25,
    borderRadius: 15,
    marginHorizontal: 20,
  },
  successContainer: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  successText: {
    backgroundColor: "rgba(81,10,201,0.9)",
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    textAlign: "center",
  },
cameraControls: {
  position: "absolute",
  bottom: 30,
  left: 17,
  right: 0,
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  padding: 15,
  borderRadius: 50,
  backgroundColor: 'rgba(81,10,201,1.0)',
  width: '90%',
},
cameraControlsShadow: {
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
},
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(81,10,201,0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 212, 170, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#00D4AA",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  disabledButton: {
    backgroundColor: "rgba(150, 150, 150, 0.5)",
    shadowOpacity: 0.2,
  },
  currencyText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
    fontFamily: 'Caprasimo'
  },
  cameraPointer: {
    position: "absolute",
    top: "25%",
    left: "18%",
    width: 350,
    height: 300,
    transform: [{ translateX: -60 }],
    opacity: 0.8,
  },
});

export default PesoDetectorApp;
