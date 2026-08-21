import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameLogicProvider ,navigationRef} from './GameLogicContext';
import StartScreen from './Screens/StartScreen';
import ModeScreen from './Screens/ModeScreen';
import GameScreen from './Screens/GameScreen';
import MultiplayerScreen from './Screens/MultiplayerScreen';
// import WaitingScreen from './Screens/WaitingScreen';
import JoinRoomScreen from './Screens/JoinRoomScreen';
import MultiplayerGameScreen from './Screens/MultiplayerGameScreen';
import LeaderboardScreen from './Screens/LeaderboardScreen';
import InvitationScreen from './Screens/InvitationScreen';
import LoginScreen from '../auth/LoginScreen';
import RegisterScreen from '../auth/RegisterScreen';
import ProfileScreen from '../auth/ProfileScreen';
import RandomMatchScreen from './Screens/RandomMatchScreen';
import MatchHistoryScreen from './Screens/MatchHistoryScreen';
import PlayerProfileScreen from './Screens/PlayerProfileScreen';
import RoomScreen from './Screens/RoomScreen';
import RoomListScreen from './Screens/RoomListScreen';
import CreateEventScreen from './Screens/CreateEventScreen';
import EventLobbyScreen from './Screens/EventLobbyScreen';
import EventBracketScreen from './Screens/EventBracketScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <GameLogicProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName="Start" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Start" component={StartScreen} />
          <Stack.Screen name="Mode" component={ModeScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Multiplayer" component={MultiplayerScreen} />
          {/* <Stack.Screen name="Waiting" component={WaitingScreen} /> */}
          <Stack.Screen name="Waiting" component={RoomScreen} />
          <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
          <Stack.Screen name="MultiplayerGame" component={MultiplayerGameScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="Invitation" component={InvitationScreen} />
          <Stack.Screen name="Login" component={LoginScreen}/>
          <Stack.Screen name="Register" component={RegisterScreen}/>
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="RandomMatch" component={RandomMatchScreen} />
          <Stack.Screen name="MatchHistory" component={MatchHistoryScreen} />
          <Stack.Screen name="Room" component={RoomScreen}/>
          <Stack.Screen name="RoomList" component={RoomListScreen}/>
          <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
          <Stack.Screen name="EventLobby" component={EventLobbyScreen} />
          <Stack.Screen name="EventBracket" component={EventBracketScreen} />
          
        </Stack.Navigator>
      </NavigationContainer>
    </GameLogicProvider>
  );
};

export default AppNavigator;