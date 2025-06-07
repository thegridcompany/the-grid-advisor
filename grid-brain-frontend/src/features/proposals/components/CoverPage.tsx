import React from 'react';
import { Page, Text, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    color: 'white',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  client: {
    fontSize: 24,
    color: '#9CA3AF',
  }
});

interface CoverPageProps {
    title: string;
    clientName: string;
}

export const CoverPage: React.FC<CoverPageProps> = ({ title, clientName }) => (
  <Page size="A4" style={styles.page}>
    <Image style={styles.logo} src="/logo.png" />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.client}>{clientName}</Text>
  </Page>
); 