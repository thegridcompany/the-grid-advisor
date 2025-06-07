import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Header } from './Header';
import { Footer } from './Footer';
import { CoverPage } from './CoverPage';
import { Roadmap } from './Roadmap';
import { PricingTable } from './PricingTable';
import { TableOfContents } from './TableOfContents';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 60,
    paddingTop: 30,
    paddingBottom: 60,
  },
  section: {
    flexGrow: 1,
  },
  content: {
    fontSize: 12,
  },
});

interface Milestone {
    name: string;
}

interface Phase {
    name: string;
    milestones: Milestone[];
}

interface PricingTier {
    name: string;
    price: string;
}

interface ProposalDocumentProps {
    title: string;
    clientName: string;
    content: string; // For now, this is just a string
    roadmap: Phase[];
    pricing: PricingTier[];
}

// Create Document Component
export const ProposalDocument: React.FC<ProposalDocumentProps> = ({ title, clientName, content, roadmap, pricing }) => (
  <Document>
    <CoverPage title={title} clientName={clientName} />
    <Page size="A4" style={styles.page}>
      <Header title={title} />
      <TableOfContents />
      <View style={styles.section}>
        <Text style={styles.content}>{content}</Text>
        <View id="roadmap">
          <Roadmap phases={roadmap} />
        </View>
        <View id="pricing">
          <PricingTable tiers={pricing} />
        </View>
      </View>
      <Footer />
    </Page>
  </Document>
); 