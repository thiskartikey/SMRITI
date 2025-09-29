import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Button } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

export default function SpeechRecordingScreen({ navigation }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordedUri, setRecordedUri] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      // Request audio permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Audio recording permission is needed');
        return;
      }

      // Set up audio recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_WAV,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_WAV,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);

      // Start countdown timer
      let timeLeft = 30;
      timerRef.current = setInterval(() => {
        timeLeft--;
        setCountdown(timeLeft);
        if (timeLeft <= 0) {
          stopRecording();
        }
      }, 1000);

    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecordedUri(uri);
        setIsRecording(false);
        setCountdown(30);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        // Automatically send to backend
        await sendToBackend(uri);
      } catch (error) {
        console.error('Stop recording error:', error);
        Alert.alert('Error', 'Failed to stop recording');
      }
    }
  };

  const sendToBackend = async (uri) => {
    setIsProcessing(true);
    try {
      // Read file as base64
      const fileBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const formData = new FormData();
      formData.append('audio_file', {
        uri: uri,
        type: 'audio/wav',
        name: 'recording.wav',
      });

      const response = await fetch('http://localhost:8000/speech', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error('Backend request failed');
      }

      const result = await response.json();
      
      // Navigate to results screen
      navigation.navigate('Results', { 
        speechResult: result 
      });

    } catch (error) {
      console.error('Send to backend error:', error);
      Alert.alert('Error', 'Failed to send recording to server');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetRecording = () => {
    setRecordedUri(null);
    setRecording(null);
    setCountdown(30);
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Speech Analysis Test</Text>
      <Text style={styles.instruction}>
        Please speak continuously for 30 seconds about your typical day
      </Text>
      
      {!recordedUri ? (
        <View style={styles.recordingSection}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              { backgroundColor: isRecording ? '#c00' : '#4CAF50' }
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            <Text style={styles.recordButtonText}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </TouchableOpacity>
          
          {isRecording && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>
                {countdown}s remaining
              </Text>
              <View style={styles.progressContainer}>
                <View 
                  style={[
                    styles.progressBar,
                    { width: `${((30 - countdown) / 30) * 100}%` }
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.resultsSection}>
          <Text style={styles.recordingStatus}>Recording Complete!</Text>
          <Button 
            title="Send to Analysis" 
            onPress={() => sendToBackend(recordedUri)}
            disabled={isProcessing}
          />
          <Button 
            title="Record Again" 
            onPress={resetRecording}
            color="#666"
          />
        </View>
      )}
      
      {isProcessing && (
        <Text style={styles.processingText}>Processing... Please wait</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  recordingSection: {
    alignItems: 'center',
  },
  recordButton: {
    width: 200,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  progressContainer: {
    width: 200,
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  resultsSection: {
    alignItems: 'center',
  },
  recordingStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4CAF50',
  },
  processingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});