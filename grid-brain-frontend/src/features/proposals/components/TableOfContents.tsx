import React from 'react';
import { View, Text, StyleSheet, Link } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  tocContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  link: {
    fontSize: 12,
    marginBottom: 5,
    color: '#374151',
    textDecoration: 'none',
  },
});

export const TableOfContents = () => (
  <View style={styles.tocContainer}>
    <Text style={styles.title}>Table of Contents</Text>
    <Link style={styles.link} src="#roadmap">1. Project Roadmap</Link>
    <Link style={styles.link} src="#pricing">2. Pricing</Link>
  </View>
); 