
import React, {createContext, useContext, useEffect, useRef} from 'react';
import GameLogic from '../Game2/Gamelogic';
import {NavigationContainerRef} from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

type GameLogicType = ReturnType<typeof GameLogic>;

const GameLogicContext = createContext<GameLogicType | any>(null);

export const navigationRef = React.createRef<NavigationContainerRef<any>>();

const invitationListenerActiveRef: {current: boolean} = {current: false};

export const GameLogicProvider = ({children}: {children: React.ReactNode}) => {
  const { userProfile } = useAuth();
  const logic = GameLogic(userProfile?.avatarId, userProfile?.photoURL);
  // const logic = GameLogic();
  // const invitationListenerActive = useRef(false); // ADD YO

  useEffect(() => {
    if (!navigationRef.current) return;
    if (logic.screen === 'multiplayerGame') {
      navigationRef.current.navigate('MultiplayerGame' as never);
    } else if (logic.screen === 'waiting') {
      navigationRef.current.navigate('Waiting' as never);
    }else if (logic.screen === 'multiplayer') {
    navigationRef.current.navigate('Multiplayer' as never);} 
    else if (logic.screen === 'Mode') {
      // navigationRef.current.navigate('Mode' as never);
      navigationRef.current.reset({
      index: 0,
      routes: [{ name: 'Mode' }],
    } as never);
    }
  }, [logic.screen]);

  useEffect(() => {
    if (logic.myName && !invitationListenerActiveRef.current) {
      invitationListenerActiveRef.current = true;
      setTimeout(() => {
        logic.listenToInvitations();
        logic.listenToSentInvitations(); // / ADD — sender side pani listen gara
        logic.listenToFriendRequests();
      }, 500);
    }
  }, [logic.myName]);

  return (
    <GameLogicContext.Provider value={logic}>
      {children}
    </GameLogicContext.Provider>
  );
};

// export const useGameLogic = () => useContext(GameLogicContext);
export const useGameLogic = (): GameLogicType => {
  const ctx = useContext(GameLogicContext);
  if (!ctx) {
    throw new Error('useGameLogic must be used within GameLogicProvider');
  }
  return ctx; 
};  //ctx  = conetext