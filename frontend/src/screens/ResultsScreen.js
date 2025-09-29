import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';

export default function ResultsScreen({ route, navigation }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shapAnalysis, setShapAnalysis] = useState(null);

  // Get results from route params or fetch from backend
  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Check if we have results from previous screens
        if (route.params && route.params.speechResult) {
          // Combine results from different tests
          const combinedResults = {
            speech_result: route.params.speechResult,
            cognitive_result: route.params.cognitiveResult,
            facial_result: route.params.facialResult,
            timestamp: Date.now()
          };
          
          // Calculate final risk
          const finalRisk = calculateFinalRisk(combinedResults);
          combinedResults.final_risk = finalRisk;
          
          setResults(combinedResults);
          setLoading(false);
          
          // Generate SHAP analysis if speech transcript exists
          if (route.params.speechResult && route.params.speechResult.transcript) {
            generateShapAnalysis(route.params.speechResult.transcript);
          }
        } else {
          // Fetch results from backend
          const response = await fetch('http://localhost:8000/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              speech_data: route.params?.speechResult || {},
              cognitive_data: route.params?.cognitiveResult || {},
              facial_data: route.params?.facialResult || {}
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch results');
          }
          
          const result = await response.json();
          setResults(result);
          setLoading(false);
          
          // Generate SHAP analysis if transcript exists
          if (route.params?.speechResult?.transcript) {
            generateShapAnalysis(route.params.speechResult.transcript);
          }
        }
      } catch (error) {
        console.error('Error fetching results:', error);
        Alert.alert('Error', 'Failed to load results');
        setLoading(false);
      }
    };

    fetchResults();
  }, [route.params]);

  const calculateFinalRisk = (combinedResults) => {
    let totalRisk = 0;
    let riskCount = 0;

    // Speech risk
    if (combinedResults.speech_result) {
      const speechRisk = combinedResults.speech_result.total_risk || 
                        combinedResults.speech_result.risk_score * 100 || 0;
      totalRisk += speechRisk;
      riskCount++;
    }

    // Cognitive risk
    if (combinedResults.cognitive_result) {
      const cognitiveRisk = combinedResults.cognitive_result.cognitive_risk || 0;
      totalRisk += cognitiveRisk;
      riskCount++;
    }

    // Facial risk
    if (combinedResults.facial_result) {
      const facialRisk = combinedResults.facial_result.risk_score * 100 || 0;
      totalRisk += facialRisk;
      riskCount++;
    }

    const averageRisk = riskCount > 0 ? totalRisk / riskCount : 0;

    // Determine final risk level
    let riskLevel;
    if (averageRisk > 40) {
      riskLevel = "HIGH";
    } else if (averageRisk > 20) {
      riskLevel = "MODERATE";
    } else {
      riskLevel = "LOW";
    }

    return {
      level: riskLevel,
      score: averageRisk,
      recommendation: getRecommendation(riskLevel)
    };
  };

  const getRecommendation = (riskLevel) => {
    switch (riskLevel) {
      case "HIGH":
        return "Consult neurologist within 14 days";
      case "MODERATE":
        return "Retest in 4 weeks";
      default:
        return "Continue monitoring";
    }
  };

  const generateShapAnalysis = (transcript) => {
    // Simple keyword analysis (in real app, this would use actual SHAP)
    const words = transcript.split(' ');
    const highRiskWords = ['...'];
    const repetitionWords = [];
    
    // Find repeated words
    for (let i = 1; i < words.length; i++) {
      if (words[i].toLowerCase() === words[i-1].toLowerCase()) {
        repetitionWords.push(words[i]);
      }
    }

    const shapAnalysis = {
      transcript: transcript,
      highlighted_words: [
        ...highRiskWords.map(word => ({ word, type: 'pause', risk: 'high' })),
        ...repetitionWords.map(word => ({ word, type: 'repetition', risk: 'medium' }))
      ],
      summary: `Detected ${highRiskWords.length} pauses and ${repetitionWords.length} repetitions`
    };

    setShapAnalysis(shapAnalysis);
  };

  const renderTranscriptWithHighlights = (transcript) => {
    if (!shapAnalysis) return transcript;

    const words = transcript.split(' ');
    const highlightedWords = shapAnalysis.highlighted_words.map(h => h.word.toLowerCase());

    return words.map((word, index) => {
      const isHighlighted = highlightedWords.includes(word.toLowerCase());
      const highlightType = shapAnalysis.highlighted_words.find(h => h.word.toLowerCase() === word.toLowerCase());
      
      return (
        <Text 
          key={index} 
          style={[
            styles.word,
            isHighlighted && highlightType?.risk === 'high' && styles.highRiskWord,
            isHighlighted && highlightType?.risk === 'medium' && styles.mediumRiskWord
          ]}
        >
          {word}{' '}
        </Text>
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Analyzing results...</Text>
      </View>
    );
  }

  if (!results) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No results available</Text>
        <Button 
          title="Back to Dashboard" 
          onPress={() => navigation.navigate('Dashboard')} 
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dementia Screening Results</Text>
      
      {/* Final Risk Assessment */}
      <View style={styles.riskCard}>
        <Text style={styles.riskLevel}>Final Risk Level: {results.final_risk?.level}</Text>
        <Text style={styles.riskScore}>Risk Score: {results.final_risk?.score?.toFixed(2)}/100</Text>
        <Text style={styles.recommendation}>{results.final_risk?.recommendation}</Text>
      </View>

      {/* Speech Analysis Results */}
      {results.speech_result && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speech Analysis</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Risk Score:</Text>
            <Text style={styles.metricValue}>{results.speech_result.risk_score?.toFixed(2) || results.speech_result.total_risk}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Risk Level:</Text>
            <Text style={styles.metricValue}>{results.speech_result.risk_level}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Pause Rate:</Text>
            <Text style={styles.metricValue}>{(results.speech_result.features?.pause_rate * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Repetition Rate:</Text>
            <Text style={styles.metricValue}>{(results.speech_result.features?.repetition_rate * 100).toFixed(1)}%</Text>
          </View>
        </View>
      )}

      {/* Cognitive Analysis Results */}
      {results.cognitive_result && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cognitive Analysis</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Accuracy:</Text>
            <Text style={styles.metricValue}>{results.cognitive_result.accuracy}%</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Correct Answers:</Text>
            <Text style={styles.metricValue}>{results.cognitive_result.correct_answers}/{results.cognitive_result.total_questions}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Risk Score:</Text>
            <Text style={styles.metricValue}>{results.cognitive_result.cognitive_risk}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Test Type:</Text>
            <Text style={styles.metricValue}>{results.cognitive_result.test_type}</Text>
          </View>
        </View>
      )}

      {/* Facial Analysis Results */}
      {results.facial_result && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facial Analysis</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Risk Score:</Text>
            <Text style={styles.metricValue}>{results.facial_result.risk_score.toFixed(2)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Risk Level:</Text>
            <Text style={styles.metricValue}>{results.facial_result.risk_level}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Gaze Stability:</Text>
            <Text style={styles.metricValue}>{(results.facial_result.input_metrics?.eye_gaze_stability * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Blink Rate:</Text>
            <Text style={styles.metricValue}>{results.facial_result.input_metrics?.blink_rate} blinks/min</Text>
          </View>
        </View>
      )}

      {/* SHAP Analysis */}
      {shapAnalysis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SHAP Analysis - Key Risk Indicators</Text>
          <Text style={styles.shapSummary}>{shapAnalysis.summary}</Text>
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptTitle}>Transcript Analysis:</Text>
            <Text style={styles.transcriptText}>
              {renderTranscriptWithHighlights(shapAnalysis.transcript)}
            </Text>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.highRiskColor]} />
              <Text style={styles.legendText}>High Risk Indicators</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.mediumRiskColor]} />
              <Text style={styles.legendText}>Medium Risk Indicators</Text>
            </View>
          </View>
        </View>
      )}

      {/* Clinical Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Clinical Information</Text>
        <Text style={styles.clinicalNote}>
          {results.speech_result?.clinical_note || 
           results.cognitive_result?.clinical_note || 
           results.facial_result?.clinical_note || 
           "Based on validated clinical guidelines"}
        </Text>
        <Text style={styles.validatedBy}>
          Validated by: {results.speech_result?.validated_by || 
                        results.cognitive_result?.validated_by || 
                        results.facial_result?.validated_by || 
                        "NIA-AA Clinical Guidelines"}
        </Text>
      </View>

      {/* Emergency Contact */}
      <Button 
        title="Emergency Doctor Contact" 
        onPress={() => {}} 
        color="#c00"
        style={styles.emergencyButton}
      />

      <Button 
        title="View Detailed Report" 
        onPress={() => {
          // Generate PDF report
          navigation.navigate('Report', { results });
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  riskCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riskLevel: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#c00',
  },
  riskScore: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  recommendation: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  shapSummary: {
    fontSize: 14,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  transcriptContainer: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  transcriptTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  transcriptText: {
    fontSize: 14,
    lineHeight: 20,
  },
  word: {
    color: '#333',
  },
  highRiskWord: {
    backgroundColor: '#ffebee',
    fontWeight: 'bold',
    padding: 2,
    marginHorizontal: 1,
    borderRadius: 3,
  },
  mediumRiskWord: {
    backgroundColor: '#fff3e0',
    padding: 2,
    marginHorizontal: 1,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 15,
    height: 15,
    marginRight: 5,
    borderRadius: 3,
  },
  highRiskColor: {
    backgroundColor: '#f44336',
  },
  mediumRiskColor: {
    backgroundColor: '#ff9800',
  },
  legendText: {
    fontSize: 12,
  },
  clinicalNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 5,
    color: '#666',
  },
  validatedBy: {
    fontSize: 12,
    color: '#666',
  },
  emergencyButton: {
    marginTop: 15,
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#c00',
    marginBottom: 20,
  },
});