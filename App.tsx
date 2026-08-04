import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, Text } from 'react-native';

import { SafeAreaProvider } from 'react-native-safe-area-context';
// import Tik_tak_game from './src/Game/Game';
import AppNavigator from './src/Navigation/AppNavigator';
// import {AuthProvider} from './src/context/AuthContext';
import {AuthProvider} from './src/context/AuthContext';

export default function App() { 
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppContent() { 
  return (
    <View style={styles.container}>
      {/* <Tik_tak_game /> */}
    <AppNavigator />
       </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d2cfcf',
  },
});
