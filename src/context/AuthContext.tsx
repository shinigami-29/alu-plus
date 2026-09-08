//to connect to  firebase
import React, { createContext, useContext, useEffect, useState } from 'react';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signInAnonymously,
  signOut,
  sendEmailVerification,
  linkWithCredential,
  updateProfile as updateFirebaseAuthProfile,
  GoogleAuthProvider,
  deleteUser,
  FacebookAuthProvider,
  AppleAuthProvider,
  User,
} from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  deleteDoc,
} from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken, Settings } from 'react-native-fbsdk-next';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import { requestNotifications, RESULTS } from 'react-native-permissions';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';

GoogleSignin.configure({
  webClientId:
    '603350820884-4urjapll9a70ofb55kdmlnhraldoscb7.apps.googleusercontent.com',
});

const authInstance = getAuth();
const db = getFirestore();
const messagingInstance = getMessaging();
const usersCollection = collection(db, 'users');

const NOTIF_TOAST_SHOWN_KEY = 'notif_enabled_toast_shown';

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
  user: User | null;
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
  loginWithApple: () => Promise<void>;
  linkGuestWithGoogle: () => Promise<void>;
  linkGuestWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
  createdAt: serverTimestamp(),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileUnsubscribeRef = React.useRef<(() => void) | null>(null);
  const tokenRefreshUnsubscribeRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authInstance, firebaseUser => {
      setUser(firebaseUser);
      if (firebaseUser) {
        fetchUserProfile(firebaseUser.uid);
        registerFcmToken(firebaseUser.uid);
        setupTokenRefreshListener(firebaseUser.uid);
      } else {
        setUserProfile(null);
        setLoading(false);

        if (profileUnsubscribeRef.current) {
          profileUnsubscribeRef.current();
          profileUnsubscribeRef.current = null;
        }

        if (tokenRefreshUnsubscribeRef.current) {
          tokenRefreshUnsubscribeRef.current();
          tokenRefreshUnsubscribeRef.current = null;
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
      }
      if (tokenRefreshUnsubscribeRef.current) {
        tokenRefreshUnsubscribeRef.current();
      }
    };
  }, []);

  const fetchUserProfile = (uid: string) => {
    if (profileUnsubscribeRef.current) {
      profileUnsubscribeRef.current();
      profileUnsubscribeRef.current = null;
    }

    const unsubscribe = onSnapshot(
      doc(usersCollection, uid),
      snap => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
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

  // Saves the FCM token to Firestore. Uses merge-set instead of updateDoc
  // because on a brand-new signup, onAuthStateChanged can fire before the
  // profile doc's setDoc() in registerWithEmail finishes — updateDoc would
  // throw "No document to update" in that race. merge-set is safe either way.
  const saveFcmToken = (uid: string, token: string) => {
    return setDoc(
      doc(usersCollection, uid),
      { fcmToken: token },
      { merge: true },
    ).catch(err => {
      console.log('saveFcmToken error:', err);
    });
  };

  const registerFcmToken = (uid: string) => {
    const permissionPromise =
      Platform.OS === 'android' && Platform.Version >= 33
        ? PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          ).then(granted => granted === PermissionsAndroid.RESULTS.GRANTED)
        : Platform.OS === 'ios'
        ? requestNotifications(['alert', 'sound']).then(
            ({ status }) => status === RESULTS.GRANTED,
          )
        : Promise.resolve(true);

    return permissionPromise
      .then(enabled => {
        if (!enabled) return null;

        // Only show the "enabled" toast once ever (per device), not on
        // every login/app restart
        AsyncStorage.getItem(NOTIF_TOAST_SHOWN_KEY).then(shown => {
          if (shown) return;

          notifee
            .createChannel({
              id: 'default',
              name: 'Default Channel',
              importance: AndroidImportance.HIGH,
            })
            .then(channelId => {
              notifee.displayNotification({
                title: 'Notification Enabled!',
                body: 'Alu Plus can now send you notifications',
                android: {
                  channelId,
                  importance: AndroidImportance.HIGH,
                },
              });
            });

          AsyncStorage.setItem(NOTIF_TOAST_SHOWN_KEY, 'true').catch(() => {});
        });

        return getToken(messagingInstance);
      })
      .then(token => {
        if (token) {
          return saveFcmToken(uid, token);
        }
      })
      .catch(err => {
        console.log('registerFcmToken error:', err);
      });
  };

  // FCM tokens can rotate (app reinstall, cache clear, token expiry).
  // Keep Firestore in sync whenever that happens for the logged-in user.
  const setupTokenRefreshListener = (uid: string) => {
    if (tokenRefreshUnsubscribeRef.current) {
      tokenRefreshUnsubscribeRef.current();
    }

    const unsubscribe = onTokenRefresh(messagingInstance, newToken => {
      saveFcmToken(uid, newToken);
    });

    tokenRefreshUnsubscribeRef.current = unsubscribe;
  };

  const registerWithEmail = (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => {
    return createUserWithEmailAndPassword(authInstance, email, password).then(
      ({ user: newUser }) => {
        return setDoc(
          doc(usersCollection, newUser.uid),
          buildDefaultProfile(newUser.uid, name, username, email, null),
        ).then(() => {
          // Send verification email — if this fails, don't block
          // registration, just retry silently in the background
          return sendEmailVerification(newUser).catch(err =>
            console.log('sendEmailVerification error:', err),
          );
        });
      },
    );
  };

  const loginWithEmail = (email: string, password: string) => {
    return signInWithEmailAndPassword(authInstance, email, password).then(
      () => {},
    );
  };

  const loginWithGoogle = () => {
    return GoogleSignin.hasPlayServices()
      .then(() => GoogleSignin.signOut())
      .catch(() => {})
      .then(() => GoogleSignin.signIn())
      .then(() => GoogleSignin.getTokens())
      .then(({ idToken, accessToken }) => {
        const googleCredential = GoogleAuthProvider.credential(
          idToken,
          accessToken,
        );
        return signInWithCredential(authInstance, googleCredential);
      })
      .then(({ user: googleUser }) => {
        const userDoc = doc(usersCollection, googleUser.uid);
        return getDoc(userDoc).then(snap => {
          if (!snap.exists()) {
            return setDoc(
              userDoc,
              buildDefaultProfile(
                googleUser.uid,
                googleUser.displayName ?? '',
                googleUser.email?.split('@')[0] ?? '',
                googleUser.email ?? '',
                googleUser.photoURL ?? null,
              ),
            );
          }

          const existing = snap.data();
          if (!existing?.avatarId && googleUser.photoURL) {
            return updateDoc(userDoc, {
              photoURL: googleUser.photoURL,
            }).catch(() => {});
          }
        });
      });
  };

  const loginAsGuest = () => {
    return signInAnonymously(authInstance).then(({ user: guestUser }) => {
      const userDoc = doc(usersCollection, guestUser.uid);
      return getDoc(userDoc).then(snap => {
        if (!snap.exists()) {
          const newProfile = buildDefaultProfile(
            guestUser.uid,
            'Guest',
            `guest_${guestUser.uid.slice(0, 6)}`,
            '',
            null,
          );
          return setDoc(userDoc, newProfile).then(() => {
            setUserProfile(newProfile as unknown as UserProfile);
          });
        } else {
          setUserProfile(snap.data() as UserProfile);
        } 
      });
    });
  };


  // login with apple 
    const loginWithApple = () => {
    return appleAuth
      .performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      })
      .then(appleAuthRequestResponse => {
        const { identityToken, nonce, fullName, email } =
          appleAuthRequestResponse;

        if (!identityToken) {
          throw new Error('Apple Sign-In failed — no identity token returned');
        }

        const appleCredential = AppleAuthProvider.credential(
          identityToken,
          nonce,
        );

        return signInWithCredential(authInstance, appleCredential).then(
          ({ user: appleUser }) => {
            // Apple only sends fullName/email on the VERY FIRST sign-in —
            // subsequent logins return null for both
            const name = fullName
              ? `${fullName.givenName ?? ''} ${fullName.familyName ?? ''}`.trim()
              : '';
            const userEmail = email ?? appleUser.email ?? '';

            const userDoc = doc(usersCollection, appleUser.uid);
            return getDoc(userDoc).then(snap => {
              if (!snap.exists()) {
                return setDoc(
                  userDoc,
                  buildDefaultProfile(
                    appleUser.uid,
                    name || appleUser.displayName || 'Player',
                    userEmail
                      ? userEmail.split('@')[0]
                      : `apple_${appleUser.uid.slice(0, 6)}`,
                    userEmail,
                    null,
                  ),
                );
              }
            });
          },
        );
      });
  };

  const fetchFacebookProfile = (
    accessToken: string,
  ): Promise<{
    name: string;
    email: string | null;
    photoURL: string | null;
  }> => {
    type FacebookGraphResponse = {
      name?: string;
      email?: string;
      picture?: { data?: { url?: string } };
    };

    return fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`,
    )
      .then(res => res.json() as Promise<FacebookGraphResponse>)
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
        const facebookCredential = FacebookAuthProvider.credential(
          data.accessToken,
        );

        // Fetch Facebook's own name/photo/email here, to use later
        return fetchFacebookProfile(data.accessToken).then(profile => {
          fbProfile = profile;

          const currentUser = authInstance.currentUser;
          const signInPromise = currentUser
            ? linkWithCredential(currentUser, facebookCredential)
            : signInWithCredential(authInstance, facebookCredential);

          return signInPromise.then(async result => {
            const fbAuthUser = result.user;

            if (profile.photoURL || profile.name) {
              try {
                await updateFirebaseAuthProfile(fbAuthUser, {
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
            'This Facebook account is already linked to another account.',
          );
        }
        if (error.code === 'auth/account-exists-with-different-credential') {
          throw new Error(
            'This email is already registered with a different sign-in method. Please log in using that method first.',
          );
        }
        throw error;
      })
      .then(({ user: fbUser }) => {
        const name = fbProfile.name || fbUser.displayName || '';
        const photoURL = fbProfile.photoURL ?? fbUser.photoURL ?? null;
        const email = fbProfile.email ?? fbUser.email ?? '';

        const userDoc = doc(usersCollection, fbUser.uid);
        return getDoc(userDoc).then(snap => {
          if (!snap.exists()) {
            return setDoc(
              userDoc,
              buildDefaultProfile(
                fbUser.uid,
                name,
                email ? email.split('@')[0] : `fb_${fbUser.uid.slice(0, 6)}`,
                email,
                photoURL,
              ),
            );
          }
          const existing = snap.data();
          if (!existing?.avatarId && photoURL) {
            return updateDoc(userDoc, { photoURL }).catch(() => {});
          }
        });
      });
  };

  // ============ GUEST → PERMANENT ACCOUNT UPGRADE ============
  // Both functions below use linkWithCredential (NOT signInWithCredential)
  // so the anonymous user's existing uid — and therefore their Firestore
  // profile, wins/losses, friends, match history — is preserved. Only the
  // sign-in method is added on top of the same account.

  const linkGuestWithGoogle = () => {
    const currentUser = authInstance.currentUser;
    if (!currentUser) return Promise.reject(new Error('No user logged in'));
    if (!currentUser.isAnonymous) {
      return Promise.reject(new Error('This account is not a guest account.'));
    }

    return GoogleSignin.hasPlayServices()
      .then(() => GoogleSignin.signOut())
      .catch(() => {})
      .then(() => GoogleSignin.signIn())
      .then(() => GoogleSignin.getTokens())
      .then(({ idToken, accessToken }) => {
        const googleCredential = GoogleAuthProvider.credential(
          idToken,
          accessToken,
        );
        return linkWithCredential(currentUser, googleCredential);
      })
      .then(({ user: linkedUser }) => {
        const updates: Partial<UserProfile> = {};
        if (linkedUser.email) updates.email = linkedUser.email;
        if (linkedUser.displayName) updates.name = linkedUser.displayName;
        if (linkedUser.photoURL) updates.photoURL = linkedUser.photoURL;

        if (Object.keys(updates).length === 0) return;

        return updateDoc(doc(usersCollection, linkedUser.uid), updates).then(
          () => {
            setUserProfile(prev => (prev ? { ...prev, ...updates } : null));
          },
        );
      });
  };

  const linkGuestWithFacebook = () => {
    const currentUser = authInstance.currentUser;
    if (!currentUser) return Promise.reject(new Error('No user logged in'));
    if (!currentUser.isAnonymous) {
      return Promise.reject(new Error('This account is not a guest account.'));
    }

    Settings.initializeSDK();
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
        const facebookCredential = FacebookAuthProvider.credential(
          data.accessToken,
        );

        return fetchFacebookProfile(data.accessToken).then(profile =>
          linkWithCredential(currentUser, facebookCredential).then(
            ({ user: linkedUser }) => {
              const updates: Partial<UserProfile> = {};
              const email = profile.email ?? linkedUser.email;
              const name = profile.name || linkedUser.displayName;
              const photoURL = profile.photoURL ?? linkedUser.photoURL;
              if (email) updates.email = email;
              if (name) updates.name = name;
              if (photoURL) updates.photoURL = photoURL;

              if (Object.keys(updates).length === 0) return;

              return updateDoc(
                doc(usersCollection, linkedUser.uid),
                updates,
              ).then(() => {
                setUserProfile(prev =>
                  prev ? { ...prev, ...updates } : null,
                );
              });
            },
          ),
        );
      });
  };

  const refreshProfile = () => {
    if (!user) return;
    fetchUserProfile(user.uid);
  };

  const logout = () => {
    const currentUser = authInstance.currentUser;
    if (!currentUser) {
      setUserProfile(null);
      return Promise.resolve();
    }
    return updateDoc(doc(usersCollection, currentUser.uid), {
      online: false,
    })
      .catch(() => {})
      .then(() => signOut(authInstance))
      .then(() => {
        setUserProfile(null);
      });
  };

  // delete
  const deleteAccount = () => {
    const currentUser =authInstance.currentUser;
    if(!currentUser) return Promise.reject(new Error("No user logged in"));

    return deleteDoc(doc(usersCollection, currentUser.uid))
    .catch(err => {
       console.log('deleteAccount: Firestore doc delete error:', err);
    })
    .then(() => deleteUser(currentUser))
    .then(() => {
      setUserProfile(null);
      setUser(null);
    })
  }

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return Promise.reject('No user');
    return updateDoc(doc(usersCollection, user.uid), data).then(() => {
      setUserProfile(prev => (prev ? { ...prev, ...data } : null));
    });
  };

  const recordGameResult = (result: 'win' | 'loss' | 'draw') => {
    if (!user) return Promise.reject('No user');
    const field =
      result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draw';
    return updateDoc(doc(usersCollection, user.uid), {
      [field]: increment(1),
    }).then(() => {
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
        loginWithApple,
        linkGuestWithGoogle,
        linkGuestWithFacebook,
        logout,
     deleteAccount,
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