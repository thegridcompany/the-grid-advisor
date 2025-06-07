import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  roadmapContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  phase: {
    marginBottom: 15,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#374151',
  },
  milestone: {
    marginLeft: 10,
    fontSize: 12,
    marginBottom: 3,
  },
});

interface Milestone {
    name: string;
}

interface Phase {
    name: string;
    milestones: Milestone[];
}

interface RoadmapProps {
    phases: Phase[];
}

export const Roadmap: React.FC<RoadmapProps> = ({ phases }) => (
  <View style={styles.roadmapContainer}>
    <Text style={styles.title}>Project Roadmap</Text>
    {phases.map((phase, index) => (
      <View key={index} style={styles.phase}>
        <Text style={styles.phaseTitle}>{phase.name}</Text>
        {phase.milestones.map((milestone, mIndex) => (
          <Text key={mIndex} style={styles.milestone}>- {milestone.name}</Text>
        ))}
      </View>
    ))}
  </View>
); 