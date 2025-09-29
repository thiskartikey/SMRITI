import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Button } from 'react-native';

const COLORS = [
  { name: 'RED', color: '#FF0000', hex: '#FF0000' },
  { name: 'GREEN', color: '#00FF00', hex: '#00FF00' },
  { name: 'BLUE', color: '#0000FF', hex: '#0000FF' },
  { name: 'YELLOW', color: '#FFFF00', hex: '#FFFF00' },
  { name: 'PURPLE', color: '#800080', hex: '#800080' },
  { name: 'ORANGE', color: '#FFA500', hex: '#FFA500' },
];

export default function StroopTestScreen({ navigation }) {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trials, setTrials] = useState([]);
  const [isTestActive, setIsTestActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [currentColor, setCurrentColor] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [totalAccuracy, setTotalAccuracy] = useState(0);
  const [avgReactionTime, setAvgReactionTime] = useState(0);
  
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const generateTrial = () => {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const randomWord = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    return {
      word: randomWord.name,
      wordColor: randomWord.hex,
      textColor: randomColor.hex,
      correctAnswer: randomColor.name,
      timestamp: Date.now()
    };
  };

  const startTest = () => {
    const newTrials = [];
    for (let i = 0; i < 20; i++) { // 20 trials
      newTrials.push(generateTrial());
    }
    setTrials(newTrials);
    setCurrentTrial(0);
    setIsTestActive(true);
    setCurrentWord(newTrials[0].word);
    setCurrentColor(newTrials[0].textColor);
    setStartTime(Date.now());
  };

  const handleColorSelection = (selectedColor) => {
    if (!isTestActive || currentTrial >= trials.length) return;

    const endTime = Date.now();
    const reactionTime = endTime - startTime;
    
    const currentTrialData = trials[currentTrial];
    const isCorrect = selectedColor === currentTrialData.correctAnswer;
    
    // Update trial with results
    const updatedTrials = [...trials];
    updatedTrials[currentTrial] = {
      ...currentTrialData,
      selectedAnswer: selectedColor,
      isCorrect,
      reactionTime
    };
    
    setTrials(updatedTrials);
    
    if (currentTrial + 1 < trials.length) {
      // Move to next trial after delay
      timeoutRef.current = setTimeout(() => {
        setCurrentTrial(currentTrial + 1);
        setCurrentWord(updatedTrials[currentTrial + 1].word);
        setCurrentColor(updatedTrials[currentTrial + 1].textColor);
        setStartTime(Date.now());
      }, 500);
    } else {
      // Test completed
      calculateResults(updatedTrials);
      setIsTestActive(false);
    }
  };

  const calculateResults = (completedTrials) => {
    const correctAnswers = completedTrials.filter(trial => trial.isCorrect).length;
    const accuracy = (correctAnswers / completedTrials.length) * 100;
    const avgTime = completedTrials.reduce((sum, trial) => sum + trial.reactionTime, 0) / completedTrials.length;
    
    setTotalAccuracy(accuracy);
    setAvgReactionTime(avgTime);
    setShowResults(true);
  };

  const submitResults = async () => {
    try {
      const response = await fetch('http://localhost:8000/cognitive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType: 'stroop',
          age: 72, // Get from user profile
          totalTrials: trials.length,
          correctAnswers: trials.filter(t => t.isCorrect).length,
          accuracy: totalAccuracy,
          avgReactionTime: avgReactionTime,
          trials: trials
        })
      });

      const result = await response.json();
      
      // Navigate to results screen
      navigation.navigate('Results', { 
        cognitiveResult: {
          correct_answers: trials.filter(t => t.isCorrect).length,
          total_questions: trials.length,
          accuracy: totalAccuracy,
          avg_reaction_time: avgReactionTime,
          total_risk: result.cognitive_risk || 0
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to submit results');
    }
  };

  const resetTest = () => {
    setCurrentTrial(0);
    setTrials([]);
    setIsTestActive(false);
    setShowResults(false);
    setTotalAccuracy(0);
    setAvgReactionTime(0);
  };

  if (showResults) {
    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.title}>Stroop Test Results</Text>
        <Text style={styles.resultText}>Accuracy: {totalAccuracy.toFixed(2)}%</Text>
        <Text style={styles.resultText}>Average Reaction Time: {(avgReactionTime / 1000).toFixed(2)}s</Text>
        <Text style={styles.resultText}>Correct Answers: {trials.filter(t => t.isCorrect).length}/{trials.length}</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Submit to Cognitive Assessment" 
            onPress={submitResults}
          />
          <Button 
            title="Try Again" 
            onPress={resetTest}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stroop Test</Text>
      
      {!isTestActive ? (
        <View style={styles.startContainer}>
          <Text style={styles.instruction}>
            In this test, you'll see words in different colors. 
            Tap the button that matches the COLOR of the text, not the word itself.
          </Text>
          <Button title="Start Test" onPress={startTest} />
        </View>
      ) : (
        <View style={styles.testContainer}>
          <Text style={[styles.word, { color: currentColor }]}>
            {currentWord}
          </Text>
          
          <Text style={styles.progress}>
            Trial {currentTrial + 1} of {trials.length}
          </Text>
          
          <View style={styles.colorButtons}>
            {COLORS.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.colorButton, { backgroundColor: color.hex }]}
                onPress={() => handleColorSelection(color.name)}
              >
                <Text style={styles.colorButtonText}>{color.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  startContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  testContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  word: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  progress: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
  },
  colorButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  colorButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  colorButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 10,
    textAlign: 'center',
  },
  resultText: {
    fontSize: 18,
    marginVertical: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 30,
    width: '100%',
  },
});