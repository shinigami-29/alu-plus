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

// Common default profile builder — sabai signup method le yehi use garne,
// taki Firestore ma field haru (draw, rank, aadi) sabai jaga consistent hos
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

  
  // const fetchUserProfile = (uid: string) => {
  //   firestore()
  //     .collection('users')
  //     .doc(uid)
  //     .get()
  //     .then(doc => {
  //       if (doc.exists()) {
  //         setUserProfile(doc.data() as UserProfile);
  //       }
  //       setLoading(false);
  //     })
  //      .catch(err => {
  //     console.log('fetchUserProfile error:', err);
  //     setLoading(false); // error aaye pani loading false garne, natra forever stuck
  //   });
  // };
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
            // Verification email pathaune — yo fail vaye pani registration
            // process rokdaina, matra background ma try garcha
            return newUser
              .sendEmailVerification()
              .catch(err =>
                console.log('sendEmailVerification error:', err),
              );
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
              // Naya user — pahilo pali account banaune
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
                // Yehi missing thiyo — profile create garepachi state pani update garne
                setUserProfile(newProfile as unknown as UserProfile);
              });
          } else {
            // Doc already exists (existing guest re-login huda) — state update garne
            setUserProfile(doc.data() as UserProfile);
          }
        });
    });
};

  // Facebook Graph API bata seedhai fresh profile (naam + photo) tannu —
  // kina ki linkWithCredential garda Firebase le existing (Google) user ko
  // hi displayName/photoURL firtaucha, Facebook ko aafno data haruna
  const fetchFacebookProfile = (
    accessToken: string,
  ): Promise<{ name: string; email: string | null; photoURL: string | null }> => {
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
    let fbProfile: { name: string; email: string | null; photoURL: string | null } = {
      name: '',
      email: null,
      photoURL: null,
    };

    // Cached FB session clear garne — natra Facebook le aafno native
    // "You previously logged in..." picker dekhaucha (naya user ho ki
    // pura ho vanne kura hamro app le determine garna paudaina, kina ki
    // yo Facebook app/browser ko device-level session ho)
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

        // Facebook ko aafno naam/photo/email yehi fetch garne, pachi use garna
        return fetchFacebookProfile(data.accessToken).then(profile => {
          fbProfile = profile;

          // Pahile nai kohi arko provider (Google) bata signed in cha bhane,
          // seedhai tyahi current user ma Facebook credential link garne
          const currentUser = auth().currentUser;
          const signInPromise = currentUser
            ? currentUser.linkWithCredential(facebookCredential)
            : auth().signInWithCredential(facebookCredential);

          // Firebase Auth ko currentUser.photoURL/displayName pani update
          // garne — natra linkWithCredential/signInWithCredential le FB ko
          // naam/photo auth().currentUser ma populate gardaina, ra
          // GameLogic.tsx ma sabai jaga (leaderboard, room, invitation,
          // random match) auth().currentUser?.photoURL nai use huncha
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
                    email ? email.split('@')[0] : `fb_${fbUser.uid.slice(0, 6)}`,
                    email,
                    photoURL,
                  ),
                );
            }

            // Existing user ho bhane, avatarId manually set gareko
            // nahos bhane matra Facebook ko photo lagaune — naam
            // over-write nagarne (user le aafno app ma naam badaleko
            // huna sakcha)
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