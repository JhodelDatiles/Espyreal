import * as tf from "@tensorflow/tfjs";
import { bundleResourceIO } from "@tensorflow/tfjs-react-native";
import { decode as atob } from "base-64";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as jpeg from "jpeg-js";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const modelJson = require("../../assets/model/dollar/model.json");
const modelWeights = [require("../../assets/model/dollar/weights.bin")];

const picInputShapeSize = {
  width: 224,
  height: 224,
};

const PESO_CLASSES = {
  0: "1 DOLLAR",
  1: "5 DOLLAR",
  2: "10 DOLLAR",
  3: "20 DOLAR",
  4: "50 DOLLAR",
  5: "100 DOLLAR",
  6: "NO BILLS",
};

function imageToTensor(rawImageData) {
  const TO_UINT8ARRAY = true;
  const { width, height, data } = jpeg.decode(rawImageData, TO_UINT8ARRAY);
  
  // Drop the alpha channel
  const buffer = new Uint8Array(width * height * 3);
  let offset = 0;
  for (let i = 0; i < buffer.length; i += 3) {
    buffer[i] = data[offset];
    buffer[i + 1] = data[offset + 1];
    buffer[i + 2] = data[offset + 2];
    offset += 4;
  }

  return tf.tidy(() => {
    const tensor = tf.tensor4d(buffer, [1, height, width, 3]);
    return tensor.div(255); // Normalize to 0-1
  });
}

async function getTopKClasses(logits, topK) {
  const values = await logits.data();
  const valuesAndIndices = [];
  
  for (let i = 0; i < values.length; i++) {
    valuesAndIndices.push({ value: values[i], index: i });
  }
  valuesAndIndices.sort((a, b) => b.value - a.value);
  
  const topClassesAndProbs = [];
  for (let i = 0; i < Math.min(topK, valuesAndIndices.length); i++) {
    topClassesAndProbs.push({
      className: PESO_CLASSES[valuesAndIndices[i].index],
      probability: valuesAndIndices[i].value,
    });
  }
  return topClassesAndProbs;
}

const classify = async (model, img, topk = 7) => {
  if (!model) {
    console.error("Model is not loaded");
    return null;
  }
  
  try {
    const logits = model.predict(img);
    const classes = await getTopKClasses(logits, topk);
    logits.dispose();
    return classes;
  } catch (error) {
    console.error("Classification error:", error);
    return null;
  }
};

const PesoDetectorApp = () => {
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState('back');
  
  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      console.log('Loading TensorFlow model...');
      await tf.ready();
      
      const loadedModel = await tf.loadLayersModel(
        bundleResourceIO(modelJson, modelWeights)
      );
      
      console.log('Model loaded successfully');
      setModel(loadedModel);
    } catch (error) {
      console.error('Model loading error:', error);
      Alert.alert('Error', 'Failed to load AI model: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const classifyImage = async (uri) => {
    if (!uri || !model) return;
    
    try {
      setIsProcessing(true);
      
      const resizedPhoto = await manipulateAsync(
        uri,
        [{ resize: picInputShapeSize }],
        { format: "jpeg", base64: true }
      );

      const base64 = resizedPhoto.base64;
      const arrayBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const imageTensor = imageToTensor(arrayBuffer);
      
      const results = await classify(model, imageTensor);
      setPredictions(results);
      
      if (results && results.length > 0) {
        console.log('Top prediction:', results[0]);
      }
      
      imageTensor.dispose();
      
    } catch (error) {
      console.error('Classification error:', error);
      Alert.alert('Error', 'Failed to analyze image');
    } finally {
      setIsProcessing(false);
    }
  };

  const onHandlePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setImage(imageUri);
        setPredictions(null);
        await classifyImage(imageUri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const openCamera = async () => {
    if (!permission) return;
    
    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }
    }
    
    setShowCamera(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      setImage(photo.uri);
      setShowCamera(false);
      setPredictions(null);
      
      await classifyImage(photo.uri);
      
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
      setIsProcessing(false);
    }
  };

  const getConfidenceColor = (probability) => {
    if (probability > 0.8) return '#4CAF50';
    if (probability > 0.6) return '#FF9800';
    if (probability > 0.4) return '#FFC107';
    return '#F44336';
  };

  // Loading screen
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00d4aa" />
          <Text style={styles.loadingText}>Loading Peso Detector...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Camera screen
  if (showCamera) {
    return (
      <SafeAreaView style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
        />
        
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraGuide}>Position peso bill in frame</Text>
        </View>
        
        <View style={styles.cameraControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.controlText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.captureButton, isProcessing && styles.disabled]}
            onPress={takePhoto}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.captureText}>📸</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setCameraType(current => current === 'back' ? 'front' : 'back')}
          >
            <Text style={styles.controlText}>Flip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main interface
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Philippine Peso Detector</Text>
        <Text style={styles.subtitle}>AI-Powered Bill Recognition</Text>
      </View>

      <View style={styles.content}>
        {image && (
          <Image source={{ uri: image }} style={styles.image} />
        )}
        
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#00d4aa" />
            <Text style={styles.processingText}>Analyzing peso bill...</Text>
          </View>
        )}

        {predictions && !isProcessing && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Detection Results:</Text>
            {predictions.slice(0, 3).map((prediction, index) => (
              <View key={index} style={styles.predictionRow}>
                <Text style={[
                  styles.predictionText,
                  index === 0 && styles.topPrediction
                ]}>
                  {prediction.className}
                </Text>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(prediction.probability) }
                ]}>
                  <Text style={styles.confidenceText}>
                    {(prediction.probability * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={onHandlePick}>
            <Text style={styles.buttonText}>📱 Choose from Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.primaryButton} onPress={openCamera}>
            <Text style={styles.buttonText}>📸 Take Photo</Text>
          </TouchableOpacity>
        </View>

        {!model && !isLoading && (
          <TouchableOpacity style={styles.retryButton} onPress={loadModel}>
            <Text style={styles.retryText}>Retry Loading Model</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 15,
    color: '#333',
  },

  // Header
  header: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#00d4aa',
    fontSize: 14,
    marginTop: 5,
  },

  // Content
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 15,
    marginBottom: 20,
    backgroundColor: '#e0e0e0',
  },

  // Processing
  processingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },

  // Results
  resultsContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  predictionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  topPrediction: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Buttons
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#00d4aa',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    height: 50,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraGuide: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  controlText: {
    color: 'white',
    fontWeight: 'bold',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00d4aa',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  captureText: {
    fontSize: 30,
  },
  disabled: {
    backgroundColor: '#999',
  },
});

export default PesoDetectorApp;