import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { AVATAR_LIST } from '../avatar/Avatar';
import { Pencil, Check, X, LogOut, Trash2, ShieldCheck } from 'lucide-react-native';
import Layout from '../components/AppLayout/Layout';
import Avatar from '../components/Avatar/Avatar';
import { useGameLogic } from '../Navigation/GameLogicContext';
import Toast from '../components/Toast/Toast';

type Props = { navigation: NativeStackNavigationProp<any> };

const ProfileScreen = ({ navigation }: Props) => {
  const {
    user,
    userProfile,
    updateProfile,
    logout,
    deleteAccount,
    linkGuestWithGoogle,
    linkGuestWithFacebook,
    refreshProfile,
  } = useAuth();
  const {
    myName,
    setMyName,
    renameUsernameEverywhere,
    updateLeaderboardName,
    stopAllFirebaseListeners,
  } = useGameLogic();

  const displayName =
    userProfile?.name ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Guest';
  const photoURL = userProfile?.photoURL || user?.photoURL || null;
  const isGuest = !!user?.isAnonymous;

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [loading, setLoading] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(userProfile?.username || '');

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [linkingProvider, setLinkingProvider] = useState<
    'google' | 'facebook' | null
  >(null);

  const [messageModal, setMessageModal] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ visible: false, type: 'success', title: '', message: '' });

  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });
  const toastAnim = useRef(new Animated.Value(-80)).current;

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    Animated.timing(toastAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: -80,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setToast({ visible: false, message: '' });
      });
    }, 1400);
  };

  const showMessage = (
    type: 'success' | 'error',
    title: string,
    message: string,
  ) => {
    setMessageModal({ visible: true, type, title, message });
  };

  const handleSaveName = () => {
    if (!newName.trim()) {
      showMessage('error', 'Error', 'Name empty!');
      return;
    }
    setLoading(true);
    updateProfile({ name: newName.trim() })
      .then(() => {
        setEditingName(false);
        showMessage('success', 'Success', 'Name is update!');
      })
      .catch(err => showMessage('error', 'Error', err.message))
      .finally(() => setLoading(false));
  };

  const handleSaveUsername = () => {
    const trimmed = newUsername.trim();
    if (!trimmed) {
      showMessage('error', 'Error', 'Username is empty!');
      return;
    }
    if (/\s/.test(trimmed)) {
      showMessage('error', 'Error', 'No space in Username!');
      return;
    }

    const oldName = myName || userProfile?.username || '';

    setLoading(true);
    updateProfile({ username: trimmed })
      .then(() => {
        if (oldName && oldName !== trimmed) {
          renameUsernameEverywhere(oldName, trimmed);
        }
        setMyName(trimmed);

        setEditingUsername(false);
        showMessage('success', 'Success', 'Username is update!');
      })
      .catch(err => showMessage('error', 'Error', err.message))
      .finally(() => setLoading(false));
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };
  const confirmLogout = () => {
    setLogoutModalVisible(false);
    stopAllFirebaseListeners();
    logout()
      .then(() => {
        navigation.replace('Login');
      })
      .catch(err => {
        console.log('Logout FAILED:', err.message);
      });
  };
  

  const confirmDeleteAccount = () => {
    setDeleteModalVisible(false);
    setDeleting(true);
    stopAllFirebaseListeners();

    deleteAccount()
      .then(() => {
        setDeleting(false);
        showToast('Your account is deleted');
        setTimeout(() => {
          navigation.replace('Login');
        }, 1400);
      })
      .catch((err: any) => {
        setDeleting(false);
        if (err?.code === 'auth/requires-recent-login') {
          showMessage(
            'error',
            'Please Log In Again',
            'For your security, please log out and log back in, then try deleting your account again.',
          );
        } else {
          showMessage(
            'error',
            'Error',
            err?.message || 'Failed to delete account. Please try again.',
          );
        }
      });
  };

  const handleDeleteAccount = () => {
    setDeleteModalVisible(true);
  };

  // ---- Guest → permanent account upgrade ----
  const handleUpgradeWithGoogle = () => {
    setLinkingProvider('google');
    linkGuestWithGoogle()
      .then(() => {
        showMessage(
          'success',
          'Account Upgraded',
          'Your account is now linked with Google!',
        );
      })
      .catch((err: any) => {
        if (err?.code === 'auth/credential-already-in-use') {
          showMessage(
            'error',
            'Already Linked',
            'This Google account is already linked to another profile.',
          );
        } else {
          showMessage(
            'error',
            'Error',
            err?.message || 'Failed to link Google account.',
          );
        }
      })
      .finally(() => setLinkingProvider(null));
  };

  const handleUpgradeWithFacebook = () => {
    setLinkingProvider('facebook');
    linkGuestWithFacebook()
      .then(() => {
        showMessage(
          'success',
          'Account Upgraded',
          'Your account is now linked with Facebook!',
        );
      })
      .catch((err: any) => {
        if (err?.message === 'User cancelled the login process') return;
        if (err?.code === 'auth/credential-already-in-use') {
          showMessage(
            'error',
            'Already Linked',
            'This Facebook account is already linked to another profile.',
          );
        } else {
          showMessage(
            'error',
            'Error',
            err?.message || 'Failed to link Facebook account.',
          );
        }
      })
      .finally(() => setLinkingProvider(null));
  };

  const handleSelectAvatar = (avatarId: string) => {
    setAvatarSaving(true);
    updateProfile({ avatarId, photoURL: null })
      .then(() => {
        setAvatarPickerVisible(false);
        const currentName =
          myName || userProfile?.username || userProfile?.name || '';
        if (currentName) updateLeaderboardName(currentName, avatarId, null);
        showMessage('success', 'Success', 'Avatar has been update!');
      })
      .catch(err => showMessage('error', 'Error', err.message))
      .finally(() => setAvatarSaving(false));
  };

  const handleSelectMyPhoto = () => {
    if (!photoURL) return;
    setAvatarSaving(true);
    updateProfile({ avatarId: null })
      .then(() => {
        setAvatarPickerVisible(false);
        const currentName =
          myName || userProfile?.username || userProfile?.name || '';
        if (currentName) updateLeaderboardName(currentName, null, photoURL);
        showMessage('success', 'Success', 'Avatar has been update!');
      })
      .catch(err => showMessage('error', 'Error', err.message))
      .finally(() => setAvatarSaving(false));
  };

  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
    }, []),
  );

  return (
    <Layout
      header={{
        type: 'screen',
        title: 'My Profile',
        onBack: () => navigation.goBack(),
      }}
    >
      {/* Toast    */}
      {toast.visible && (
        <Animated.View
          pointerEvents="none"
          style={[s.toast, { transform: [{ translateY: toastAnim }] }]}
        >
          <Text style={s.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
      {/* ===== Floating avatar ===== */}
      <View style={s.avatarFloatWrap}>
        <TouchableOpacity
          onPress={() => setAvatarPickerVisible(true)}
          style={s.avatarTouchable}
          activeOpacity={0.85}
        >
          <View style={s.avatarRing}>
            <Avatar
              name={displayName}
              photoURL={photoURL}
              avatarId={userProfile?.avatarId}
              size={88}
            />
          </View>
          <View style={s.cameraBadge}>
            <Pencil size={12} color="#12194A" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ===== Info card ===== */}
      <View style={s.card}>
        {/* Name */}
        <View style={s.fieldBlock}>
          <Text style={s.cardLabel}>Name</Text>
          {editingName ? (
            <View style={s.editRow}>
              <TextInput
                style={s.nameInput}
                value={newName}
                onChangeText={setNewName}
                placeholderTextColor="#6B7196"
                autoFocus
              />
              <TouchableOpacity
                style={s.saveBtn}
                onPress={handleSaveName}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#12194A" size="small" />
                ) : (
                  <Check size={17} color="#12194A" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => {
                  setEditingName(false);
                  setNewName(displayName);
                }}
              >
                <X size={17} color="#F5EFE0" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.nameRow}>
              <Text style={s.nameText}>{displayName}</Text>
              <TouchableOpacity
                style={s.editBtn}
                onPress={() => setEditingName(true)}
              >
                <Pencil size={13} color="#E0972A" />
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={s.divider} />

        {/* Email */}
        {user?.email ? (
          <>
            <View style={s.fieldBlock}>
              <Text style={s.cardLabel}>Email</Text>
              <Text style={s.cardValue}>{user.email}</Text>
            </View>
            <View style={s.divider} />
          </>
        ) : null}

        {/* Username */}
        <View style={s.fieldBlock}>
          <Text style={s.cardLabel}>Username</Text>
          {editingUsername ? (
            <View style={s.editRow}>
              <TextInput
                style={s.nameInput}
                value={newUsername}
                onChangeText={setNewUsername}
                autoCapitalize="none"
                placeholderTextColor="#6B7196"
                autoFocus
              />
              <TouchableOpacity
                style={s.saveBtn}
                onPress={handleSaveUsername}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#12194A" size="small" />
                ) : (
                  <Check size={17} color="#12194A" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => {
                  setEditingUsername(false);
                  setNewUsername(userProfile?.username || '');
                }}
              >
                <X size={17} color="#F5EFE0" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.nameRow}>
              <Text style={s.nameText}>
                @{userProfile?.username || 'not set'}
              </Text>
              <TouchableOpacity
                style={s.editBtn}
                onPress={() => setEditingUsername(true)}
              >
                <Pencil size={13} color="#E0972A" />
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* ===== Stats ===== */}
      <View style={s.chipsRow}>
        <View style={[s.chip, s.chipWin]}>
          <Text style={s.chipValue}>{userProfile?.wins ?? 0}</Text>
          <Text style={s.chipLabel}>WINS</Text>
        </View>
        <View style={[s.chip, s.chipLoss]}>
          <Text style={s.chipValue}>{userProfile?.losses ?? 0}</Text>
          <Text style={s.chipLabel}>LOSSES</Text>
        </View>
        <View style={[s.chip, s.chipDraw]}>
          <Text style={s.chipValue}>{userProfile?.draw ?? 0}</Text>
          <Text style={s.chipLabel}>DRAWS</Text>
        </View>
      </View>

      {/* ===== Guest upgrade prompt ===== */}
      {isGuest && (
        <View style={s.upgradeCard}>
          <View style={s.upgradeHeaderRow}>
            <ShieldCheck size={18} color="#E0972A" />
            <Text style={s.upgradeTitle}>Save Your Progress</Text>
          </View>
          <Text style={s.upgradeMessage}>
            You're playing as a guest. Link an account so you don't lose your
            wins, friends, and stats if you switch devices or reinstall.
          </Text>

          <TouchableOpacity
            style={s.upgradeGoogleBtn}
            activeOpacity={0.85}
            onPress={handleUpgradeWithGoogle}
            disabled={linkingProvider !== null}
          >
            {linkingProvider === 'google' ? (
              <ActivityIndicator color="#12194A" size="small" />
            ) : (
              <>
                <Image
                  source={require('../images/icons/gg.png')}
                  style={s.upgradeSocialIcon}
                  resizeMode="contain"
                />
                <Text style={s.upgradeGoogleBtnText}>Link with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.upgradeFacebookBtn}
            activeOpacity={0.85}
            onPress={handleUpgradeWithFacebook}
            disabled={linkingProvider !== null}
          >
            {linkingProvider === 'facebook' ? (
              <ActivityIndicator color="#F5EFE0" size="small" />
            ) : (
              <>
                <Image
                  source={require('../images/icons/fb.png')}
                  style={s.upgradeSocialIcon}
                  resizeMode="contain"
                />
                <Text style={s.upgradeFacebookBtnText}>
                  Link with Facebook
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={s.actionBtnRow}>
        {/* Logout */}
        <TouchableOpacity
          style={s.logoutBtn}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <LogOut size={17} color="#F5EFE0" />
          <Text style={s.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={s.deleteBtn}
          activeOpacity={0.85}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color="#F5EFE0" size="small" />
          ) : (
            <>
              <Trash2 size={17} color="#F5EFE0" />
              <Text style={s.deleteBtnText}>Delete Account</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ---- Logout confirmation popup ---- */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Logout</Text>
            <Text style={s.modalMessage}>Are you sure you want to logout?</Text>
            <View style={s.modalBtnRow}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalDangerBtn}
                onPress={confirmLogout}
              >
                <Text style={s.modalDangerText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* delete account confrimation */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Delete Account</Text>
            <Text style={s.modalMessage}>
              {' '}
              Are you sure you want to delete your account? This will
              permanently remove your profile and cannot be undone.
            </Text>
            <View style={s.modalBtnRow}>
              <TouchableOpacity
                style={s.modalDangerBtn}
                onPress={confirmDeleteAccount}
              >
                <Text style={s.modalDangerText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---- Success / Error popup ---- */}
      <Modal
        visible={messageModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setMessageModal(prev => ({ ...prev, visible: false }))
        }
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View
              style={[
                s.iconCircle,
                messageModal.type === 'success'
                  ? s.iconCircleSuccess
                  : s.iconCircleError,
              ]}
            >
              <Text style={s.iconText}>
                {messageModal.type === 'success' ? '✓' : '!'}
              </Text>
            </View>
            <Text style={s.modalTitle}>{messageModal.title}</Text>
            <Text style={s.modalMessage}>{messageModal.message}</Text>
            <TouchableOpacity
              style={s.modalOkBtn}
              onPress={() =>
                setMessageModal(prev => ({ ...prev, visible: false }))
              }
            >
              <Text style={s.modalOkText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ---- Avatar picker popup ---- */}
      <Modal
        visible={avatarPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarPickerVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.avatarPickerBox}>
            <Text style={s.modalTitle}>Choose Avatar</Text>

            <View style={s.avatarGrid}>
              {photoURL && (
                <TouchableOpacity
                  onPress={handleSelectMyPhoto}
                  disabled={avatarSaving}
                  style={[
                    s.avatarGridItem,
                    !userProfile?.avatarId && s.avatarGridItemSelected,
                  ]}
                >
                  <Image source={{ uri: photoURL }} style={s.avatarGridImage} />
                </TouchableOpacity>
              )}

              {AVATAR_LIST.filter(a => !!a?.source).map(a => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => handleSelectAvatar(a.id)}
                  disabled={avatarSaving}
                  style={[
                    s.avatarGridItem,
                    userProfile?.avatarId === a.id && s.avatarGridItemSelected,
                  ]}
                >
                  <Image source={a.source} style={s.avatarGridImage} />
                </TouchableOpacity>
              ))}
            </View>

            {avatarSaving && (
              <ActivityIndicator color="#E0972A" style={{ marginBottom: 12 }} />
            )}

            <TouchableOpacity
              style={s.modalCloseBtnFull}
              activeOpacity={0.7}
              onPress={() => setAvatarPickerVisible(false)}
            >
              <Text style={s.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Layout>
  );
};

export default ProfileScreen;

const s = StyleSheet.create({
  // toastt

  toast: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: '#7A1128',
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.4)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#F5EFE0',
    fontWeight: '700',
    fontSize: 13.5,
  },
  // ===== Floating avatar =====
  avatarFloatWrap: {
    alignItems: 'center',
    zIndex: 2,
    marginBottom: -46,
  },
  avatarTouchable: { position: 'relative' },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B2560',
    borderWidth: 3,
    borderColor: '#E0972A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0972A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1B2560',
  },

  // ===== Card =====
  card: {
    backgroundColor: '#1B2560',
    borderRadius: 28,
    paddingTop: 58,
    paddingBottom: 22,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.18)',
    marginBottom: 16,
  },
  fieldBlock: { paddingVertical: 12 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cardLabel: {
    fontSize: 11,
    color: '#8B93AE',
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  cardValue: {
    fontSize: 15,
    color: '#F5EFE0',
    fontWeight: '600',
  },

  // Name / username row + edit
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 15,
    color: '#F5EFE0',
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(224,151,42,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  editBtnText: {
    color: '#E0972A',
    fontWeight: '700',
    fontSize: 12.5,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#F5EFE0',
  },
  saveBtn: {
    backgroundColor: '#E0972A',
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats chips (matches player card styling)
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
  },
  chipWin: { borderColor: 'rgba(60,203,127,0.3)' },
  chipLoss: { borderColor: 'rgba(233,135,125,0.3)' },
  chipDraw: { borderColor: 'rgba(139,147,174,0.3)' },
  chipValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F5EFE0',
    marginBottom: 3,
  },
  chipLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8B93AE',
    letterSpacing: 1,
  },

  // ===== Guest upgrade card =====
  upgradeCard: {
    backgroundColor: '#1B2560',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.3)',
    marginBottom: 16,
  },
  upgradeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  upgradeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F5EFE0',
  },
  upgradeMessage: {
    fontSize: 13,
    color: '#8B93AE',
    lineHeight: 18,
    marginBottom: 16,
  },
  upgradeGoogleBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    width: '100%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  upgradeGoogleBtnText: {
    color: '#F5EFE0',
    fontSize: 14,
    fontWeight: '700',
  },
  upgradeFacebookBtn: {
    backgroundColor: 'rgba(24,118,242,0.18)',
    width: '100%',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(24,118,242,0.4)',
  },
  upgradeFacebookBtnText: {
    color: '#F5EFE0',
    fontSize: 14,
    fontWeight: '700',
  },
  upgradeSocialIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },

  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Logout
  logoutBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(233,135,125,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(233,135,125,0.35)',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutBtnText: {
    color: '#F5EFE0',
    fontSize: 15,
    fontWeight: '700',
  },

  // delte tb
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#B31B34',
    borderWidth: 1,
    borderColor: 'rgba(179,27,52,0.6)',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteBtnText: {
    color: '#F5EFE0',
    fontSize: 15,
    fontWeight: '700',
  },

  // ---- Modal / popup styles ----
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: '#1B2560',
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 24,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5EFE0',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13.5,
    color: '#8B93AE',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCancelText: { color: '#F5EFE0', fontWeight: '700', fontSize: 14.5 },
  modalDangerBtn: {
    flex: 1,
    backgroundColor: '#B31B34',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalDangerText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
  modalOkBtn: {
    backgroundColor: '#E0972A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  modalOkText: { color: '#12194A', fontWeight: '800', fontSize: 14.5 },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconCircleSuccess: { backgroundColor: '#1E3A2E' },
  iconCircleError: { backgroundColor: '#3A2226' },
  iconText: { color: '#F5EFE0', fontSize: 24, fontWeight: 'bold' },

  // ---- Avatar picker ----
  avatarPickerBox: {
    backgroundColor: '#1B2560',
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  avatarGridItem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarGridItemSelected: {
    borderColor: '#E0972A',
    borderWidth: 3,
  },
  avatarGridImage: {
    width: '100%',
    height: '100%',
  },

  modalCloseBtnFull: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});