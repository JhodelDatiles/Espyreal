import { Audio, ResizeMode, Video } from "expo-av";
import * as Font from 'expo-font';
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get('window');

const TUTORIAL_AUDIO = {
  step1: require("../../assets/audio/tutorial/welcome2.mp3"),
  step2: require("../../assets/audio/tutorial/step2.mp3"),
  step3: require("../../assets/audio/tutorial/step333.mp3"),
  step4: require("../../assets/audio/tutorial/FINAL.mp3"),
};

const TUTORIAL_VIDEOS = {
  step1: require("../../assets/audio/tutorial/steph1.mp4"),
  step2: require("../../assets/audio/tutorial/steph2.mp4"),
  step3: require("../../assets/audio/tutorial/steph3.mp4"),
  step4: require("../../assets/audio/tutorial/finalsteph.mp4"),
};

interface TutorialOverlayProps {
  visible: boolean;
  onClose: () => void;
}

interface AudioQueueItem {
  soundFile: any;
  onComplete: (() => void) | null;
}

interface TutorialStep {
  title: string;
  description: string;
  illustration: string;
  video: any;
  backgroundColor: string;
  illustrationBg: string;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ visible, onClose }) => {
  const [tutorialStep, setTutorialStep] = useState<number>(1);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  const tutorialOpacity = useRef(new Animated.Value(0)).current;
  const tutorialScale = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const videoOpacity = useRef(new Animated.Value(1)).current;
  
  const tutorialStepRef = useRef<number>(1);
  const currentSoundRef = useRef<Audio.Sound | null>(null);
  const tutorialAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioQueueRef = useRef<AudioQueueItem[]>([]);
  const isPlayingAudioRef = useRef<boolean>(false);
  const videoRef = useRef<Video>(null);

  const tutorialSteps: TutorialStep[] = [
    {
      title: 'MALIGAYANG PAGBATI 🇵🇭',
      description: 'Ito ay isang maikling tutorial para sa pag-gamit ng Espyreal.',
      illustration: '💼',
      video: TUTORIAL_VIDEOS.step1,
      backgroundColor: '#ffffffff',
      illustrationBg: '#ffffffff',
    },
    {
      title: 'BUTTONS 🛠️',
      description: 'Ang Espyreal ay mayroong dalawang pangunahing button, isa para sa wallet at isa naman para sa pagcapture.',
      illustration: '🔒',
      video: TUTORIAL_VIDEOS.step2,
      backgroundColor: '#ffffffff',
      illustrationBg: '#ffffffff',
    },
    {
      title: 'PAANO GAMITIN?',
      description: 'Pindutin lamang ang camera button upang makapang-scan ng pera at wallet button naman para makita ang mga nakaraang na-scan na pera.',
      illustration: '📊',
      video: TUTORIAL_VIDEOS.step3,
      backgroundColor: '#ffffffff',
      illustrationBg: '#fcffffff',
    },
    {
      title: 'MALIGAYANG PAGGAMIT 🇵🇭',
      description: 'Siguraduhin na maayos ang pag-kakakuha ng litrato upang maging maayos ang resulta.',
      illustration: '📈',
      video: TUTORIAL_VIDEOS.step4,
      backgroundColor: '#ffffffff',
      illustrationBg: '#ffffffff',
    },
  ];

  const currentTutorial = tutorialSteps[tutorialStep - 1] || tutorialSteps[0];

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
        // Set to true anyway to not block the UI
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  useEffect(() => {
    tutorialStepRef.current = tutorialStep;
  }, [tutorialStep]);

  useEffect(() => {
    if (visible && fontsLoaded) {
      startTutorial();
    } else if (!visible) {
      cleanup();
    }
    
    return () => cleanup();
  }, [visible, fontsLoaded]);

  const cleanup = () => {
    stopAllAudio();
    audioQueueRef.current = [];
    
    if (tutorialAdvanceTimeoutRef.current) {
      clearTimeout(tutorialAdvanceTimeoutRef.current);
      tutorialAdvanceTimeoutRef.current = null;
    }
  };

  const playSound = async (soundFile: any, priority: boolean = false, onComplete: (() => void) | null = null) => {
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
    const { soundFile, onComplete } = audioQueueRef.current.shift()!;

    try {
      const { sound } = await Audio.Sound.createAsync(
        soundFile,
        { shouldPlay: true }
      );
      currentSoundRef.current = sound;
      
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          try {
            await sound.unloadAsync();
          } catch (e) {
            console.log("Unload error:", e);
          }
          if (currentSoundRef.current === sound) {
            currentSoundRef.current = null;
          }
          
          if (onComplete) {
            onComplete();
          }
          
          await playNextInQueue();
        }
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      isPlayingAudioRef.current = false;
      
      if (onComplete) {
        onComplete();
      }
      
      await playNextInQueue();
    }
  };

  const stopAllAudio = async () => {
    try {
      if (tutorialAdvanceTimeoutRef.current) {
        clearTimeout(tutorialAdvanceTimeoutRef.current);
        tutorialAdvanceTimeoutRef.current = null;
      }
      
      if (currentSoundRef.current) {
        await currentSoundRef.current.stopAsync();
        await currentSoundRef.current.unloadAsync();
        currentSoundRef.current = null;
      }
      
      isPlayingAudioRef.current = false;
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  };

  const playVideo = async () => {
    try {
      if (videoRef.current) {
        await videoRef.current.setPositionAsync(0);
        videoRef.current.playAsync();
        
        Animated.timing(videoOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error("Error playing video:", error);
    }
  };

  const startTutorial = () => {
    tutorialStepRef.current = 1;
    setTutorialStep(1);
    
    Animated.parallel([
      Animated.timing(tutorialOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(tutorialScale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      playVideo();
      
      playSound(TUTORIAL_AUDIO.step1, true, () => {
        tutorialAdvanceTimeoutRef.current = setTimeout(() => {
          autoAdvanceStep();
        }, 800);
      });
    });
  };

  const autoAdvanceStep = async () => {
    const currentStep = tutorialStepRef.current;
    const nextStep = currentStep + 1;
    
    if (nextStep > 4) {
      closeTutorial();
      return;
    }

    Animated.timing(videoOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(async () => {
      try {
        if (videoRef.current) {
          await videoRef.current.stopAsync();
          await videoRef.current.setPositionAsync(0);
        }
      } catch (error) {
        console.error("Error stopping video:", error);
      }

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        tutorialStepRef.current = nextStep;
        setTutorialStep(nextStep);
        
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            playVideo();
            
            playTutorialAudio(nextStep, () => {
              if (nextStep < 4) {
                tutorialAdvanceTimeoutRef.current = setTimeout(() => {
                  autoAdvanceStep();
                }, 800);
              }
            });
          });
        }, 100);
      });
    });
  };

  const handleGetStartedPress = async () => {
    await stopAllAudio();
    closeTutorial();
  };

  const playTutorialAudio = (step: number, onComplete: () => void) => {
    const audioMap: { [key: number]: any } = {
      1: TUTORIAL_AUDIO.step1,
      2: TUTORIAL_AUDIO.step2,
      3: TUTORIAL_AUDIO.step3,
      4: TUTORIAL_AUDIO.step4,
    };

    const audioFile = audioMap[step];
    if (audioFile) {
      playSound(audioFile, true, onComplete);
    } else if (onComplete) {
      onComplete();
    }
  };

  const closeTutorial = async () => {
    stopAllAudio();
    audioQueueRef.current = [];
    
    try {
      if (videoRef.current) {
        await videoRef.current.stopAsync();
      }
    } catch (error) {
      console.error("Error stopping video:", error);
    }
    
    Animated.parallel([
      Animated.timing(tutorialOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(tutorialScale, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Show nothing if not visible or fonts not loaded
  if (!visible || !fontsLoaded) return null;

  return (
    <Animated.View
      style={[
        styles.tutorialOverlay,
        {
          opacity: tutorialOpacity,
          transform: [{ scale: tutorialScale }],
          backgroundColor: currentTutorial.backgroundColor,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Video Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={[styles.illustration, { backgroundColor: currentTutorial.illustrationBg }]}>
            <Animated.View style={[styles.videoContainer, { opacity: videoOpacity }]}>
              <Video
                ref={videoRef}
                source={currentTutorial.video}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay={false}
                isMuted
              />
            </Animated.View>
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
          </View>
        </View>

        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === tutorialStep - 1 ? '#00D4AA' : '#D0D0D0',
                  width: index === tutorialStep - 1 ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentTutorial.title}</Text>
          <Text style={styles.description}>{currentTutorial.description}</Text>
        </View>

        {/* Get Started Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStartedPress}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tutorialOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 30,
    paddingTop: 80,
    paddingBottom: 40,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  illustration: {
    width: width * 1.0,
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: "flex-end",
    overflow: 'hidden',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  illustrationEmoji: {
    fontSize: 120,
    zIndex: 2,
  },
  decorCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: 20,
    right: 30,
  },
  decorCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    bottom: 40,
    left: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  textContainer: {
    alignItems: 'center',
    width: '95%',
    marginBottom: 40,
    marginLeft: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Caprasimo', // ✅ Fixed: matches loaded font name
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    fontFamily: 'Caprasimo', // ✅ Fixed: lowercase
    color: '#666',
    textAlign: 'center',
    // lineHeight: 15,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  getStartedButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#4745daff',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4AA',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  getStartedText: {
    fontFamily: 'Caprasimo',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default TutorialOverlay;