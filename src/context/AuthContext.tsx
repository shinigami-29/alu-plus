//to connect to  firebase
import React, { createContext, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken, Settings } from 'react-native-fbsdk-next';

GoogleSignin.configure({
  webClientId:
    '603350820884-4urjapll9a70ofb55kdmlnhraldoscb7.apps.googleusercontent.com',
});

type UserProfile = {
  uid: string;
  name: string;
  username: string;
  email: string;
  photoURL: string | null;
  avatarId: string | null;
  wins: number;
  losses: number;
  draw: number;
  rank: string;
  online: boolean;
};

type AuthContextType = {
  user: FirebaseAuthTypes.User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  registerWithEmail: (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => void;
  recordGameResult: (result: 'win' | 'loss' | 'draw') => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Shared default profile builder — used by every sign-up method so that
// Firestore fields (draw, rank, etc.) stay consistent across all of them
const buildDefaultProfile = (
  uid: string,
  name: string,
  username: string,
  email: string,
  photoURL: string | null,
) => ({
  uid,
  name,
  username,
  email,
  photoURL,
  avatarId: null,
  wins: 0,
  losses: 0,
  draw: 0,
  rank: 'Beginner',
  online: true,
  createdAt: firestore.FieldValue.serverTimestamp(),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileUnsubscribeRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(firebaseUser => {
      setUser(firebaseUser);
      if (firebaseUser) {
        fetchUserProfile(firebaseUser.uid);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
      }
    };
  }, []);

  const fetchUserProfile = (uid: string) => {
    if (profileUnsubscribeRef.current) {
      profileUnsubscribeRef.current();
      profileUnsubscribeRef.current = null;
    }

    const unsubscribe = firestore()
      .collection('users')
      .doc(uid)
      .onSnapshot(
        doc => {
          if (doc.exists()) {
            setUserProfile(doc.data() as UserProfile);
          }
          setLoading(false);
        },
        err => {
          console.log('fetchUserProfile error:', err);
          setLoading(false);
        },
      );

    profileUnsubscribeRef.current = unsubscribe;
  };

  const registerWithEmail = (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => {
    return auth()
      .createUserWithEmailAndPassword(email, password)
      .then(({ user: newUser }) => {
        return firestore()
          .collection('users')
          .doc(newUser.uid)
          .set(buildDefaultProfile(newUser.uid, name, username, email, null))
          .then(() => {
            // Send verification email — if this fails, don't block
            // registration, just retry silently in the background
            return newUser
              .sendEmailVerification()
              .catch(err => console.log('sendEmailVerification error:', err));
          });
      });
  };

  const loginWithEmail = (email: string, password: string) => {
    return auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {});
  };

  const loginWithGoogle = () => {
    return GoogleSignin.hasPlayServices()
      .then(() => GoogleSignin.signOut())
      .catch(() => {})
      .then(() => GoogleSignin.signIn())
      .then(() => GoogleSignin.getTokens())
      .then(({ idToken, accessToken }) => {
        const googleCredential = auth.GoogleAuthProvider.credential(
          idToken,
          accessToken,
        );
        return auth().signInWithCredential(googleCredential);
      })
      .then(({ user: googleUser }) => {
        return firestore()
          .collection('users')
          .doc(googleUser.uid)
          .get()
          .then(doc => {
            if (!doc.exists()) {
              return firestore()
                .collection('users')
                .doc(googleUser.uid)
                .set(
                  buildDefaultProfile(
                    googleUser.uid,
                    googleUser.displayName ?? '',
                    googleUser.email?.split('@')[0] ?? '',
                    googleUser.email ?? '',
                    googleUser.photoURL ?? null,
                  ),
                );
            }

            const existing = doc.data();
            if (!existing?.avatarId && googleUser.photoURL) {
              return firestore()
                .collection('users')
                .doc(googleUser.uid)
                .update({ photoURL: googleUser.photoURL })
                .catch(() => {});
            }
          });
      });
  };

  const loginAsGuest = () => {
    return auth()
      .signInAnonymously()
      .then(({ user: guestUser }) => {
        return firestore()
          .collection('users')
          .doc(guestUser.uid)
          .get()
          .then(doc => {
            if (!doc.exists()) {
              const newProfile = buildDefaultProfile(
                guestUser.uid,
                'Guest',
                `guest_${guestUser.uid.slice(0, 6)}`,
                '',
                null,
              );
              return firestore()
                .collection('users')
                .doc(guestUser.uid)
                .set(newProfile)
                .then(() => {
                  setUserProfile(newProfile as unknown as UserProfile);
                });
            } else {
              setUserProfile(doc.data() as UserProfile);
            }
          });
      });
  };

  const fetchFacebookProfile = (
    accessToken: string,
  ): Promise<{
    name: string;
    email: string | null;
    photoURL: string | null;
  }> => {
    return fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`,
    )
      .then(res => res.json())
      .then(json => ({
        name: json?.name ?? '',
        email: json?.email ?? null,
        photoURL: json?.picture?.data?.url ?? null,
      }))
      .catch(() => ({ name: '', email: null, photoURL: null }));
  };

  const loginWithFacebook = () => {
    Settings.initializeSDK();
    let fbProfile: {
      name: string;
      email: string | null;
      photoURL: string | null;
    } = {
      name: '',
      email: null,
      photoURL: null,
    };

    // Clear cached FB session — otherwise Facebook shows its own native
    // "You previously logged in..." account picker. Our app can't determine
    // whether this is a new user or a returning one, because this is a
    // device-level session that belongs to the Facebook app/browser, not our app.
    LoginManager.logOut();

    return LoginManager.logInWithPermissions(['public_profile', 'email'])
      .then(result => {
        if (result.isCancelled) {
          throw new Error('User cancelled the login process');
        }
        return AccessToken.getCurrentAccessToken();
      })
      .then(data => {
        if (!data) {
          throw new Error('Something went wrong obtaining access token');
        }
        const facebookCredential = auth.FacebookAuthProvider.credential(
          data.accessToken,
        );

        // Fetch Facebook's own name/photo/email here, to use later
        return fetchFacebookProfile(data.accessToken).then(profile => {
          fbProfile = profile;

          // If already signed in with another provider (Google), link
          // the Facebook credential directly to that current user
          const currentUser = auth().currentUser;
          const signInPromise = currentUser
            ? currentUser.linkWithCredential(facebookCredential)
            : auth().signInWithCredential(facebookCredential);

          // Also update Firebase Auth's currentUser.photoURL/displayName —
          // otherwise linkWithCredential/signInWithCredential won't populate
          // FB's name/photo onto auth().currentUser, and GameLogic.tsx relies
          // on auth().currentUser?.photoURL everywhere (leaderboard, room,
          // invitation, random match)
          return signInPromise.then(async result => {
            const fbAuthUser = result.user;

            if (profile.photoURL || profile.name) {
              try {
                await fbAuthUser.updateProfile({
                  displayName:
                    profile.name || fbAuthUser.displayName || undefined,
                  photoURL:
                    profile.photoURL ?? fbAuthUser.photoURL ?? undefined,
                });
              } catch (err) {
                console.log('FB auth profile update error:', err);
              }
            }

            return { user: fbAuthUser };
          });
        });
      })
      .catch((error: any) => {
        if (error.code === 'auth/credential-already-in-use') {
          throw new Error(
            'Yo Facebook account pahile nai arko account sanga linked cha.',
          );
        }
        if (error.code === 'auth/account-exists-with-different-credential') {
          throw new Error(
            'Yo email pahile nai arko sign-in method bata login bhaisakeko cha. Pahile tyo bata login garnus.',
          );
        }
        throw error;
      })
      .then(({ user: fbUser }) => {
        const name = fbProfile.name || fbUser.displayName || '';
        const photoURL = fbProfile.photoURL ?? fbUser.photoURL ?? null;
        const email = fbProfile.email ?? fbUser.email ?? '';

        return firestore()
          .collection('users')
          .doc(fbUser.uid)
          .get()
          .then(doc => {
            if (!doc.exists()) {
              return firestore()
                .collection('users')
                .doc(fbUser.uid)
                .set(
                  buildDefaultProfile(
                    fbUser.uid,
                    name,
                    email
                      ? email.split('@')[0]
                      : `fb_${fbUser.uid.slice(0, 6)}`,
                    email,
                    photoURL,
                  ),
                );
            }

            // Existing user: only apply Facebook's photo if they haven't
            // manually set an avatarId. Don't overwrite the name — the
            // user may have changed it inside the app already
            const existing = doc.data();
            if (!existing?.avatarId && photoURL) {
              return firestore()
                .collection('users')
                .doc(fbUser.uid)
                .update({ photoURL })
                .catch(() => {});
            }
          });
      });
  };

  const refreshProfile = () => {
    if (!user) return;
    fetchUserProfile(user.uid);
  };

  const logout = () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setUserProfile(null);
      return Promise.resolve();
    }
    return firestore()
      .collection('users')
      .doc(currentUser.uid)
      .update({ online: false })
      .catch(() => {})
      .then(() => auth().signOut())
      .then(() => {
        setUserProfile(null);
      });
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return Promise.reject('No user');
    return firestore()
      .collection('users')
      .doc(user.uid)
      .update(data)
      .then(() => {
        setUserProfile(prev => (prev ? { ...prev, ...data } : null));
      });
  };

  const recordGameResult = (result: 'win' | 'loss' | 'draw') => {
    if (!user) return Promise.reject('No user');
    const field =
      result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draw';
    return firestore()
      .collection('users')
      .doc(user.uid)
      .update({
        [field]: firestore.FieldValue.increment(1),
      })
      .then(() => {
        setUserProfile(prev =>
          prev ? { ...prev, [field]: (prev[field] ?? 0) + 1 } : null,
        );
      });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        loginAsGuest,
        logout,
        recordGameResult,
        updateProfile,
        refreshProfile,
        loginWithFacebook,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
