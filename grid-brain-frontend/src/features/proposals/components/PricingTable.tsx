import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 20,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row"
  },
  tableColHeader: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#374151',
    color: 'white',
    padding: 5,
    fontWeight: 'bold',
  },
  tableCol: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
});

interface PricingTier {
    name: string;
    price: string;
}

interface PricingTableProps {
    tiers: PricingTier[];
}

export const PricingTable: React.FC<PricingTableProps> = ({ tiers }) => (
  <View>
    <Text style={styles.title}>Pricing</Text>
    <View style={styles.table}>
      <View style={styles.tableRow}>
        <View style={styles.tableColHeader}><Text>Tier</Text></View>
        <View style={styles.tableColHeader}><Text>Price</Text></View>
      </View>
      {tiers.map((tier, index) => (
        <View style={styles.tableRow} key={index}>
          <View style={styles.tableCol}><Text>{tier.name}</Text></View>
          <View style={styles.tableCol}><Text>{tier.price}</Text></View>
        </View>
      ))}
    </View>
  </View>
); 