import React, {createContext, useContext, useEffect, useRef} from 'react';
import GameLogic from '../Game2/Gamelogic';
import {NavigationContainerRef} from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

type GameLogicType = ReturnType<typeof GameLogic>;

const GameLogicContext = createContext<GameLogicType | any>(null);

export const navigationRef = React.createRef<NavigationContainerRef<any>>();

export const GameLogicProvider = ({children}: {children: React.ReactNode}) => {
  const { userProfile } = useAuth();
  const logic = GameLogic(userProfile?.avatarId, userProfile?.photoURL);
  const prevUsernameRef = useRef<string | null>(null);

 // Sync myName when the username changes, and also update the
  // leaderboard entry with the new name
  useEffect(() => {
    if (
      userProfile?.username &&
      userProfile.username !== prevUsernameRef.current
    ) {
      const isFirstLoad = prevUsernameRef.current === null;
      logic.setMyName(userProfile.username);

      if (!isFirstLoad) {
         // Not the first mount — this is an actual username change,
        // so update the name in the leaderboard too
        logic.updateLeaderboardName(userProfile.username);
      }

      prevUsernameRef.current = userProfile.username;
    }
  }, [userProfile?.username]);

 // If navigationRef isn't ready yet, retry shortly instead of giving up —
// otherwise a screen change could silently fail to navigate.
  useEffect(() => {
    let cancelled = false;

    const tryNavigate = () => {
      if (cancelled) return;

      if (!navigationRef.current) {
        setTimeout(tryNavigate, 100);
        return;
      }

      if (logic.screen === 'multiplayerGame') {
        navigationRef.current.navigate('MultiplayerGame' as never);
      } else if (logic.screen === 'waiting') {
        navigationRef.current.navigate('Waiting' as never);
      } else if (logic.screen === 'multiplayer') {
        navigationRef.current.navigate('Multiplayer' as never);
      } else if (logic.screen === 'Mode') {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Mode' }],
        } as never);
      }
    };

    tryNavigate();

    return () => {
      cancelled = true;
    };
  }, [logic.screen]);

  useEffect(() => {
  if (!logic.myName) return;
  logic.listenToInvitations();
  logic.listenToSentInvitations();
  logic.listenToFriendRequests();
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