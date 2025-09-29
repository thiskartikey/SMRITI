import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function DashboardScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dementia Screening Dashboard</Text>
      
      <Button 
        title="Facial Analysis Test" 
        onPress={() => navigation.navigate('FacialAnalysis')} 
      />
      
      <Button 
        title="Speech Recording Test" 
        onPress={() => navigation.navigate('SpeechRecording')} 
        style={styles.button}
      />
      
      <Button 
        title="Speech Test" 
        onPress={() => navigation.navigate('SpeechTest')} 
        style={styles.button}
      />
      
      <Button 
        title="Cognitive Test" 
        onPress={() => navigation.navigate('CognitiveTest')} 
        style={styles.button}
      />
      
      <Button 
        title="Stroop Test" 
        onPress={() => navigation.navigate('StroopTest')} 
        style={styles.button}
      />
      
      <Button 
        title="View Results" 
        onPress={() => navigation.navigate('Results')} 
        style={styles.button}
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
    marginBottom: 30,
  },
  button: {
    marginTop: 15,
  },
});