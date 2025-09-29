import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function ConsentScreen({ navigation }) {
  const handleConsent = () => {
    navigation.navigate('Dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consent Form</Text>
      <Text style={styles.consentText}>
        This app is designed for early-stage dementia screening only. 
        Results should be reviewed by a healthcare professional. 
        No personal data will be stored permanently.
      </Text>
      <Button title="I Agree" onPress={handleConsent} />
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
  consentText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
    textAlign: 'center',
  },
});