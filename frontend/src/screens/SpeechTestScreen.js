import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import Sound from 'react-native-sound';

export default function SpeechTestScreen({ navigation }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startRecording = () => {
    setIsRecording(true);
    // Mock recording - in real app, use react-native-speech-recognition
    setTimeout(() => {
      setTranscript("I went to the store yesterday and bought some vegetables");
      setIsRecording(false);
    }, 3000);
  };

  const submitTest = async () => {
    // Send to backend
    const response = await fetch('http://localhost:8000/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, age: 72 })
    });
    
    const result = await response.json();
    navigation.navigate('Results', { speechResult: result });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Speech Analysis Test</Text>
      <Text style={styles.instruction}>
        Please tell us about your typical day
      </Text>
      
      <Button 
        title={isRecording ? "Recording..." : "Start Recording"} 
        onPress={startRecording} 
        disabled={isRecording}
      />
      
      {transcript && (
        <Text style={styles.transcript}>
          Transcript: {transcript}
        </Text>
      )}
      
      <Button 
        title="Submit" 
        onPress={submitTest} 
        disabled={!transcript}
      />
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
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  transcript: {
    marginVertical: 20,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
});