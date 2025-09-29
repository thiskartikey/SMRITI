import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Button } from 'react-native';
import { Camera } from 'expo-camera';
import { CameraView } from 'expo-camera';
import * as MediaPipe from 'mediapipe/tasks-vision';

export default function FacialAnalysisScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMetrics, setAnalysisMetrics] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const timerRef = useRef(null);
  const cameraRef = useRef(null);
  const analysisIntervalRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const startAnalysis = async () => {
    if (hasPermission) {
      setCameraActive(true);
      setIsAnalyzing(true);
      
      // Start recording timer
      let timeLeft = 30;
      timerRef.current = setInterval(() => {
        timeLeft--;
        setRecordingTime(timeLeft);
        if (timeLeft <= 0) {
          stopAnalysis();
        }
      }, 1000);
      
      // Start facial analysis
      startFacialTracking();
    }
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    setCameraActive(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
    
    setRecordingTime(30);
  };

  const startFacialTracking = () => {
    // Simulate MediaPipe analysis (in real app, you'd use actual MediaPipe integration)
    const metrics = {
      eye_gaze_stability: 0.7, // 0-1 scale
      blink_rate: 15, // blinks per minute
      head_movement: 0.3, // 0-1 scale (0 = stable, 1 = very unstable)
      facial_asymmetry: 0.2, // 0-1 scale
      eye_closure_duration: 0.25, // seconds
      pupil_dilation: 0.8, // 0-1 scale
      gaze_direction: { x: 0.5, y: 0.5 }, // normalized coordinates
      face_detected: true,
      confidence: 0.9
    };

    // Simulate continuous analysis for 30 seconds
    const analysisData = [];
    analysisIntervalRef.current = setInterval(() => {
      // Simulate slight variations in metrics
      const variation = (Math.random() - 0.5) * 0.1;
      const currentMetrics = {
        ...metrics,
        eye_gaze_stability: Math.max(0, Math.min(1, metrics.eye_gaze_stability + variation)),
        blink_rate: Math.max(5, Math.min(30, metrics.blink_rate + Math.floor((Math.random() - 0.5) * 3))),
        head_movement: Math.max(0, Math.min(1, metrics.head_movement + variation)),
        timestamp: Date.now()
      };
      
      analysisData.push(currentMetrics);
      
      // Update display metrics
      setAnalysisMetrics(currentMetrics);
    }, 1000); // Update every second

    // Stop after 30 seconds
    setTimeout(() => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      
      // Calculate average metrics
      const avgMetrics = calculateAverageMetrics(analysisData);
      setAnalysisMetrics(avgMetrics);
      
      // Send to backend
      sendMetricsToBackend(avgMetrics);
    }, 30000);
  };

  const calculateAverageMetrics = (data) => {
    if (data.length === 0) return null;
    
    const sum = data.reduce((acc, curr) => {
      return {
        eye_gaze_stability: acc.eye_gaze_stability + curr.eye_gaze_stability,
        blink_rate: acc.blink_rate + curr.blink_rate,
        head_movement: acc.head_movement + curr.head_movement,
        facial_asymmetry: acc.facial_asymmetry + curr.facial_asymmetry,
        eye_closure_duration: acc.eye_closure_duration + curr.eye_closure_duration,
        pupil_dilation: acc.pupil_dilation + curr.pupil_dilation,
        confidence: acc.confidence + curr.confidence
      };
    }, {
      eye_gaze_stability: 0,
      blink_rate: 0,
      head_movement: 0,
      facial_asymmetry: 0,
      eye_closure_duration: 0,
      pupil_dilation: 0,
      confidence: 0
    });

    return {
      eye_gaze_stability: sum.eye_gaze_stability / data.length,
      blink_rate: sum.blink_rate / data.length,
      head_movement: sum.head_movement / data.length,
      facial_asymmetry: sum.facial_asymmetry / data.length,
      eye_closure_duration: sum.eye_closure_duration / data.length,
      pupil_dilation: sum.pupil_dilation / data.length,
      confidence: sum.confidence / data.length,
      total_samples: data.length
    };
  };

  const sendMetricsToBackend = async (metrics) => {
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:8000/facial_analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          age: 72, // Get from user profile
          test_type: 'facial_analysis',
          timestamp: Date.now()
        }),
      });

      if (!response.ok) {
        throw new Error('Backend request failed');
      }

      const result = await response.json();
      
      // Navigate to results screen
      navigation.navigate('Results', { 
        facialResult: result 
      });

    } catch (error) {
      console.error('Send to backend error:', error);
      Alert.alert('Error', 'Failed to send facial analysis to server');
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No camera access</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Facial Analysis Test</Text>
      <Text style={styles.instruction}>
        Keep your face in the frame for 30 seconds
      </Text>
      
      {cameraActive ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="front"
            ref={cameraRef}
          />
          
          <View style={styles.overlay}>
            <View style={styles.faceFrame} />
          </View>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Text style={styles.previewText}>Camera Preview</Text>
        </View>
      )}
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            { backgroundColor: isAnalyzing ? '#c00' : '#4CAF50' }
          ]}
          onPress={isAnalyzing ? stopAnalysis : startAnalysis}
          disabled={isProcessing}
        >
          <Text style={styles.recordButtonText}>
            {isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}
          </Text>
        </TouchableOpacity>
        
        {isAnalyzing && (
          <Text style={styles.countdownText}>
            {recordingTime}s remaining
          </Text>
        )}
      </View>
      
      {analysisMetrics && (
        <View style={styles.metricsContainer}>
          <Text style={styles.metricsTitle}>Current Metrics:</Text>
          <Text>Eye Gaze Stability: {(analysisMetrics.eye_gaze_stability * 100).toFixed(1)}%</Text>
          <Text>Blink Rate: {analysisMetrics.blink_rate} blinks/min</Text>
          <Text>Head Movement: {(analysisMetrics.head_movement * 100).toFixed(1)}%</Text>
          <Text>Facial Asymmetry: {(analysisMetrics.facial_asymmetry * 100).toFixed(1)}%</Text>
        </View>
      )}
      
      {isProcessing && (
        <Text style={styles.processingText}>Processing facial metrics... Please wait</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
  },
  camera: {
    flex: 1,
    borderRadius: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 100,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    backgroundColor: '#000',
    borderRadius: 10,
  },
  previewText: {
    color: 'white',
    fontSize: 18,
  },
  controls: {
    alignItems: 'center',
    padding: 20,
  },
  recordButton: {
    width: 200,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  countdownText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricsContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  processingText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});