import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/screens/LoginScreen';
import ConsentScreen from './src/screens/ConsentScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SpeechTestScreen from './src/screens/SpeechTestScreen';
import SpeechRecordingScreen from './src/screens/SpeechRecordingScreen';
import FacialAnalysisScreen from './src/screens/FacialAnalysisScreen'; // Add this import
import CognitiveTestScreen from './src/screens/CognitiveTestScreen';
import StroopTestScreen from './src/screens/StroopTestScreen';
import ResultsScreen from './src/screens/ResultsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Consent" component={ConsentScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="FacialAnalysis" component={FacialAnalysisScreen} /> {/* Add this route */}
        <Stack.Screen name="SpeechRecording" component={SpeechRecordingScreen} />
        <Stack.Screen name="SpeechTest" component={SpeechTestScreen} />
        <Stack.Screen name="CognitiveTest" component={CognitiveTestScreen} />
        <Stack.Screen name="StroopTest" component={StroopTestScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}