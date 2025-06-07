import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
    paddingBottom: 5,
  },
  logo: {
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 18,
    color: '#111827',
  }
});

interface HeaderProps {
    title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  // A non-existent or incorrect path for an image can cause react-pdf to crash.
  // The logo has been temporarily removed to prevent this.
  // To fix, add logo.png to the /grid-brain-frontend/public directory
  // and uncomment the Image component below.
  // You will also need to re-add `Image` to the import statement above.

  return (
    <View style={styles.header}>
      {/* <Image style={styles.logo} src="/logo.png" /> */}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}; 