import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function CognitiveTestScreen({ navigation }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  
  const questions = [
    { id: 1, text: "What is the year?", options: ["2024", "2023", "2025", "2022"] },
    { id: 2, text: "What day of the week is it?", options: ["Monday", "Tuesday", "Wednesday", "Thursday"] },
    { id: 3, text: "What is the name of this country?", options: ["India", "USA", "Canada", "UK"] }
  ];

  const handleAnswer = (option) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitTest(newAnswers);
    }
  };

  const submitTest = async (userAnswers) => {
    const response = await fetch('http://localhost:8000/cognitive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        answers: userAnswers, 
        age: 72,
        questions: questions
      })
    });
    
    const result = await response.json();
    navigation.navigate('Results', { cognitiveResult: result });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cognitive Test</Text>
      <Text style={styles.question}>
        {questions[currentQuestion]?.text}
      </Text>
      
      {questions[currentQuestion]?.options.map((option, index) => (
        <Button 
          key={index}
          title={option}
          onPress={() => handleAnswer(option)}
        />
      ))}
      
      <Text style={styles.progress}>
        Question {currentQuestion + 1} of {questions.length}
      </Text>
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
  question: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  progress: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});