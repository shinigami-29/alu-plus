// // import React, { useState } from 'react';
// // import {
// //   View,
// //   Text,
// //   TouchableOpacity,
// //   StyleSheet,
// //   Image,
// //   TextInput,
// //   ScrollView,
// //   ActivityIndicator,
// //   Modal,
// // } from 'react-native';
// // import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// // import { useAuth } from '../context/AuthContext';
// // import { useFocusEffect } from '@react-navigation/native';
// // import { AVATAR_LIST, getAvatarSource } from '../avatar/Avatar';

// // type Props = { navigation: NativeStackNavigationProp<any> };

// // const ProfileScreen = ({ navigation }: Props) => {
// //   const { user, userProfile, updateProfile, logout, refreshProfile } =
// //     useAuth();

// //   const displayName =
// //     userProfile?.name ||
// //     user?.displayName ||
// //     user?.email?.split('@')[0] ||
// //     'Guest';
// //   const photoURL = userProfile?.photoURL || user?.photoURL || null;
// //   const avatarSource = getAvatarSource(userProfile?.avatarId);

// //   const [editingName, setEditingName] = useState(false);
// //   const [newName, setNewName] = useState(displayName);
// //   const [loading, setLoading] = useState(false);
// //   const [editingUsername, setEditingUsername] = useState(false);
// //   const [newUsername, setNewUsername] = useState(userProfile?.username || '');

// //   const [logoutModalVisible, setLogoutModalVisible] = useState(false);
// //   const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
// //   const [avatarSaving, setAvatarSaving] = useState(false);

// //   const [messageModal, setMessageModal] = useState<{
// //     visible: boolean;
// //     type: 'success' | 'error';
// //     title: string;
// //     message: string;
// //   }>({ visible: false, type: 'success', title: '', message: '' });

// //   const showMessage = (
// //     type: 'success' | 'error',
// //     title: string,
// //     message: string,
// //   ) => {
// //     setMessageModal({ visible: true, type, title, message });
// //   };

// //   const handleSaveName = () => {
// //     if (!newName.trim()) {
// //       showMessage('error', 'Error', 'Name empty!');
// //       return;
// //     }
// //     setLoading(true);
// //     updateProfile({ name: newName.trim() })
// //       .then(() => {
// //         setEditingName(false);
// //         showMessage('success', 'Success', 'Name is update!');
// //       })
// //       .catch(err => showMessage('error', 'Error', err.message))
// //       .finally(() => setLoading(false));
// //   };

// //   const handleSaveUsername = () => {
// //     const trimmed = newUsername.trim();
// //     if (!trimmed) {
// //       showMessage('error', 'Error', 'Username is empty!');
// //       return;
// //     }
// //     if (/\s/.test(trimmed)) {
// //       showMessage('error', 'Error', 'No space in Username!');
// //       return;
// //     }
// //     setLoading(true);
// //     updateProfile({ username: trimmed })
// //       .then(() => {
// //         setEditingUsername(false);
// //         showMessage('success', 'Success', 'Username is update!');
// //       })
// //       .catch(err => showMessage('error', 'Error', err.message))
// //       .finally(() => setLoading(false));
// //   };

// //   const handleLogout = () => {
// //     setLogoutModalVisible(true);
// //   };

// //   const confirmLogout = () => {
// //     setLogoutModalVisible(false);
// //     logout().then(() => {
// //       navigation.replace('Login');
// //     });
// //   };

// //   const handleSelectAvatar = (avatarId: string) => {
// //     setAvatarSaving(true);
// //     updateProfile({ avatarId, photoURL: null })
// //       .then(() => {
// //         setAvatarPickerVisible(false);
// //         showMessage('success', 'Success', 'Avatar has been update!');
// //       })
// //       .catch(err => showMessage('error', 'Error', err.message))
// //       .finally(() => setAvatarSaving(false));
// //   };

// //   useFocusEffect(
// //     React.useCallback(() => {
// //       refreshProfile();
// //     }, []),
// //   );

// //   return (
// //     <ScrollView contentContainerStyle={s.container}>
// //       {/* Header */}
// //       <View style={s.header}>
// //         <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
// //           <Text style={s.backText}>Back</Text>
// //         </TouchableOpacity>
// //         <Text style={s.headerTitle}>Profile</Text>
// //         <View style={{ width: 50 }} />
// //       </View>

// //       {/* Avatar */}
// //       <View style={s.avatarSection}>
// //         <TouchableOpacity
// //           onPress={() => setAvatarPickerVisible(true)}
// //           style={s.avatarTouchable}
// //         >
// //           {avatarSource ? (
// //             <Image source={avatarSource} style={s.avatarImage} />
// //           ) : photoURL ? (
// //             <Image source={{ uri: photoURL }} style={s.avatarImage} />
// //           ) : (
// //             <View style={s.avatarCircle}>
// //               <Text style={s.avatarLetter}>
// //                 {displayName?.[0]?.toUpperCase() ?? 'G'}
// //               </Text>
// //             </View>
// //           )}
// //           <View style={s.cameraBadge}>
// //             <Text style={s.cameraBadgeText}>✏️</Text>
// //           </View>
// //         </TouchableOpacity>
// //       </View>

// //       {/* Name section */}
// //       <View style={s.card}>
// //         <Text style={s.cardLabel}>Name</Text>
// //         {editingName ? (
// //           <View style={s.editRow}>
// //             <TextInput
// //               style={s.nameInput}
// //               value={newName}
// //               onChangeText={setNewName}
// //               autoFocus
// //             />
// //             <TouchableOpacity
// //               style={s.saveBtn}
// //               onPress={handleSaveName}
// //               disabled={loading}
// //             >
// //               {loading ? (
// //                 <ActivityIndicator color="#fff" size="small" />
// //               ) : (
// //                 <Text style={s.saveBtnText}>Save</Text>
// //               )}
// //             </TouchableOpacity>
// //             <TouchableOpacity
// //               style={s.cancelBtn}
// //               onPress={() => {
// //                 setEditingName(false);
// //                 setNewName(displayName);
// //               }}
// //             >
// //               <Text style={s.cancelBtnText}>Cancel</Text>
// //             </TouchableOpacity>
// //           </View>
// //         ) : (
// //           <View style={s.nameRow}>
// //             <Text style={s.nameText}>{displayName}</Text>
// //             <TouchableOpacity
// //               style={s.editBtn}
// //               onPress={() => setEditingName(true)}
// //             >
// //               <Text style={s.editBtnText}>Edit</Text>
// //             </TouchableOpacity>
// //           </View>
// //         )}
// //       </View>

// //       {/* Email */}
// //       {user?.email ? (
// //         <View style={s.card}>
// //           <Text style={s.cardLabel}>Email</Text>
// //           <Text style={s.cardValue}>{user.email}</Text>
// //         </View>
// //       ) : null}

// //       {/* Username */}
// //       <View style={s.card}>
// //         <Text style={s.cardLabel}>Username</Text>
// //         {editingUsername ? (
// //           <View style={s.editRow}>
// //             <TextInput
// //               style={s.nameInput}
// //               value={newUsername}
// //               onChangeText={setNewUsername}
// //               autoCapitalize="none"
// //               autoFocus
// //             />
// //             <TouchableOpacity
// //               style={s.saveBtn}
// //               onPress={handleSaveUsername}
// //               disabled={loading}
// //             >
// //               {loading ? (
// //                 <ActivityIndicator color="#fff" size="small" />
// //               ) : (
// //                 <Text style={s.saveBtnText}>Save</Text>
// //               )}
// //             </TouchableOpacity>
// //             <TouchableOpacity
// //               style={s.cancelBtn}
// //               onPress={() => {
// //                 setEditingUsername(false);
// //                 setNewUsername(userProfile?.username || '');
// //               }}
// //             >
// //               <Text style={s.cancelBtnText}>Cancel</Text>
// //             </TouchableOpacity>
// //           </View>
// //         ) : (
// //           <View style={s.nameRow}>
// //             <Text style={s.nameText}>
// //               @{userProfile?.username || 'not set'}
// //             </Text>
// //             <TouchableOpacity
// //               style={s.editBtn}
// //               onPress={() => setEditingUsername(true)}
// //             >
// //               <Text style={s.editBtnText}>Edit</Text>
// //             </TouchableOpacity>
// //           </View>
// //         )}
// //       </View>

// //       {/* Stats */}
// //       <View style={s.statsRow}>
// //         <View style={s.statCard}>
// //           <Text style={s.statNumber}>{userProfile?.wins ?? 0}</Text>
// //           <Text style={s.statLabel}>Wins</Text>
// //         </View>
// //         <View style={s.statCard}>
// //           <Text style={s.statNumber}>{userProfile?.losses ?? 0}</Text>
// //           <Text style={s.statLabel}>Losses</Text>
// //         </View>
// //         <View style={s.statCard}>
// //           <Text style={s.statNumber}>{userProfile?.draw ?? 0}</Text>
// //           <Text style={s.statLabel}>Draws</Text>
// //         </View>
// //       </View>

// //       {/* Logout */}
// //       <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
// //         <Text style={s.logoutBtnText}>Logout</Text>
// //       </TouchableOpacity>

// //       {/* ---- Logout confirmation popup ---- */}
// //       <Modal
// //         visible={logoutModalVisible}
// //         transparent
// //         animationType="fade"
// //         onRequestClose={() => setLogoutModalVisible(false)}
// //       >
// //         <View style={s.modalOverlay}>
// //           <View style={s.modalBox}>
// //             <Text style={s.modalTitle}>Logout</Text>
// //             <Text style={s.modalMessage}>Logout garne?</Text>
// //             <View style={s.modalBtnRow}>
// //               <TouchableOpacity
// //                 style={s.modalCancelBtn}
// //                 onPress={() => setLogoutModalVisible(false)}
// //               >
// //                 <Text style={s.modalCancelText}>Cancel</Text>
// //               </TouchableOpacity>
// //               <TouchableOpacity
// //                 style={s.modalDangerBtn}
// //                 onPress={confirmLogout}
// //               >
// //                 <Text style={s.modalDangerText}>Logout</Text>
// //               </TouchableOpacity>
// //             </View>
// //           </View>
// //         </View>
// //       </Modal>

// //       {/* ---- Success / Error popup ---- */}
// //       <Modal
// //         visible={messageModal.visible}
// //         transparent
// //         animationType="fade"
// //         onRequestClose={() =>
// //           setMessageModal(prev => ({ ...prev, visible: false }))
// //         }
// //       >
// //         <View style={s.modalOverlay}>
// //           <View style={s.modalBox}>
// //             <View
// //               style={[
// //                 s.iconCircle,
// //                 messageModal.type === 'success'
// //                   ? s.iconCircleSuccess
// //                   : s.iconCircleError,
// //               ]}
// //             >
// //               <Text style={s.iconText}>
// //                 {messageModal.type === 'success' ? '✓' : '!'}
// //               </Text>
// //             </View>
// //             <Text style={s.modalTitle}>{messageModal.title}</Text>
// //             <Text style={s.modalMessage}>{messageModal.message}</Text>
// //             <TouchableOpacity
// //               style={s.modalOkBtn}
// //               onPress={() =>
// //                 setMessageModal(prev => ({ ...prev, visible: false }))
// //               }
// //             >
// //               <Text style={s.modalOkText}>OK</Text>
// //             </TouchableOpacity>
// //           </View>
// //         </View>
// //       </Modal>

// //       {/* ---- Avatar picker popup ---- */}
// //       <Modal
// //         visible={avatarPickerVisible}
// //         transparent
// //         animationType="fade"
// //         onRequestClose={() => setAvatarPickerVisible(false)}
// //       >
// //         <View style={s.modalOverlay}>
// //           <View style={s.avatarPickerBox}>
// //             <Text style={s.modalTitle}>Choose Avatar</Text>

// //             <View style={s.avatarGrid}>
// //               {AVATAR_LIST.filter(a => !!a?.source).map(a => (
// //                 <TouchableOpacity
// //                   key={a.id}
// //                   onPress={() => handleSelectAvatar(a.id)}
// //                   disabled={avatarSaving}
// //                   style={[
// //                     s.avatarGridItem,
// //                     userProfile?.avatarId === a.id && s.avatarGridItemSelected,
// //                   ]}
// //                 >
// //                   <Image source={a.source} style={s.avatarGridImage} />
// //                 </TouchableOpacity>
// //               ))}
// //             </View>

// //             {avatarSaving && (
// //               <ActivityIndicator color="#182992" style={{ marginBottom: 12 }} />
// //             )}

// //             <TouchableOpacity
// //               style={s.modalCloseBtnFull}
// //               activeOpacity={0.7}
// //               onPress={() => setAvatarPickerVisible(false)}
// //             >
// //               <Text style={s.modalCancelText}>Close</Text>
// //             </TouchableOpacity>
// //           </View>
// //         </View>
// //       </Modal>
// //     </ScrollView>
// //   );
// // };

// // export default ProfileScreen;

// // const s = StyleSheet.create({
// //   container: {
// //     flexGrow: 1,
// //     backgroundColor: '#F5F4F0',
// //     paddingBottom: 40,
// //   },
// //   header: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'space-between',
// //     paddingHorizontal: 20,
// //     paddingTop: 50,
// //     paddingBottom: 16,
// //     backgroundColor: '#fff',
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#dde3f0',
// //   },
// //   backBtn: { padding: 8 },
// //   backText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
// //   headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#182992' },

// //   // Avatar
// //   avatarSection: {
// //     alignItems: 'center',
// //     paddingVertical: 32,
// //   },
// //   avatarTouchable: {
// //     position: 'relative',
// //   },
// //   avatarCircle: {
// //     width: 90,
// //     height: 90,
// //     borderRadius: 45,
// //     backgroundColor: '#189292',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //   },
// //   avatarLetter: {
// //     color: '#fff',
// //     fontSize: 36,
// //     fontWeight: 'bold',
// //   },
// //   avatarImage: {
// //     width: 90,
// //     height: 90,
// //     borderRadius: 45,
// //   },
// //   cameraBadge: {
// //     position: 'absolute',
// //     bottom: 0,
// //     right: 0,
// //     width: 28,
// //     height: 28,
// //     borderRadius: 14,
// //     backgroundColor: '#182992',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     borderWidth: 2,
// //     borderColor: '#F5F4F0',
// //   },
// //   cameraBadgeText: {
// //     fontSize: 13,
// //   },

// //   // Card
// //   card: {
// //     backgroundColor: '#fff',
// //     marginHorizontal: 20,
// //     marginBottom: 12,
// //     borderRadius: 14,
// //     padding: 16,
// //     borderWidth: 1,
// //     borderColor: '#dde3f0',
// //   },
// //   cardLabel: {
// //     fontSize: 12,
// //     color: '#999',
// //     fontWeight: '600',
// //     marginBottom: 6,
// //     textTransform: 'uppercase',
// //     letterSpacing: 1,
// //   },
// //   cardValue: {
// //     fontSize: 16,
// //     color: '#182992',
// //     fontWeight: '600',
// //   },

// //   // Name edit
// //   nameRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'space-between',
// //   },
// //   nameText: {
// //     fontSize: 16,
// //     color: '#182992',
// //     fontWeight: '600',
// //   },
// //   editBtn: {
// //     backgroundColor: '#dde3f0',
// //     paddingHorizontal: 14,
// //     paddingVertical: 6,
// //     borderRadius: 8,
// //   },
// //   editBtnText: {
// //     color: '#182992',
// //     fontWeight: '600',
// //     fontSize: 13,
// //   },
// //   editRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 8,
// //   },
// //   nameInput: {
// //     flex: 1,
// //     borderWidth: 1,
// //     borderColor: '#dde3f0',
// //     borderRadius: 8,
// //     paddingHorizontal: 10,
// //     paddingVertical: 6,
// //     fontSize: 16,
// //     color: '#182992',
// //   },
// //   saveBtn: {
// //     backgroundColor: '#182992',
// //     paddingHorizontal: 12,
// //     paddingVertical: 8,
// //     borderRadius: 8,
// //   },
// //   saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
// //   cancelBtn: {
// //     backgroundColor: '#dde3f0',
// //     paddingHorizontal: 12,
// //     paddingVertical: 8,
// //     borderRadius: 8,
// //   },
// //   cancelBtnText: { color: '#182992', fontWeight: '600', fontSize: 13 },

// //   // Stats
// //   statsRow: {
// //     flexDirection: 'row',
// //     gap: 12,
// //     marginHorizontal: 20,
// //     marginBottom: 24,
// //     marginTop: 4,
// //   },
// //   statCard: {
// //     flex: 1,
// //     backgroundColor: '#fff',
// //     borderRadius: 14,
// //     padding: 16,
// //     alignItems: 'center',
// //     borderWidth: 1,
// //     borderColor: '#dde3f0',
// //   },
// //   statNumber: {
// //     fontSize: 22,
// //     fontWeight: 'bold',
// //     color: '#182992',
// //     marginBottom: 4,
// //   },
// //   statLabel: {
// //     fontSize: 12,
// //     color: '#999',
// //     fontWeight: '600',
// //   },

// //   // Logout
// //   logoutBtn: {
// //     marginHorizontal: 20,
// //     backgroundColor: '#e57373',
// //     paddingVertical: 16,
// //     borderRadius: 14,
// //     alignItems: 'center',
// //   },
// //   logoutBtnText: {
// //     color: '#fff',
// //     fontSize: 16,
// //     fontWeight: 'bold',
// //   },

// //   // ---- Modal / popup styles ----
// //   modalOverlay: {
// //     flex: 1,
// //     backgroundColor: 'rgba(0,0,0,0.5)',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //   },
// //   modalBox: {
// //     backgroundColor: '#fff',
// //     borderRadius: 20,
// //     paddingVertical: 28,
// //     paddingHorizontal: 24,
// //     width: '80%',
// //     alignItems: 'center',
// //   },
// //   modalTitle: {
// //     fontSize: 20,
// //     fontWeight: 'bold',
// //     color: '#182992',
// //     marginBottom: 6,
// //     textAlign: 'center',
// //   },
// //   modalMessage: {
// //     fontSize: 14,
// //     color: '#666',
// //     textAlign: 'center',
// //     marginBottom: 20,
// //   },
// //   modalBtnRow: {
// //     flexDirection: 'row',
// //     gap: 10,
// //     width: '100%',
// //   },
// //   modalCancelBtn: {
// //     flex: 1,
// //     backgroundColor: '#dde3f0',
// //     paddingVertical: 14,
// //     borderRadius: 12,
// //     alignItems: 'center',
// //   },
// //   modalCancelText: { color: '#182992', fontWeight: '600', fontSize: 15 },
// //   modalDangerBtn: {
// //     flex: 1,
// //     backgroundColor: '#e57373',
// //     paddingVertical: 14,
// //     borderRadius: 12,
// //     alignItems: 'center',
// //   },
// //   modalDangerText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
// //   modalOkBtn: {
// //     backgroundColor: '#182992',
// //     paddingVertical: 14,
// //     borderRadius: 12,
// //     alignItems: 'center',
// //     width: '100%',
// //   },
// //   modalOkText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

// //   iconCircle: {
// //     width: 56,
// //     height: 56,
// //     borderRadius: 28,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     marginBottom: 12,
// //   },
// //   iconCircleSuccess: { backgroundColor: '#28C76F' },
// //   iconCircleError: { backgroundColor: '#e57373' },
// //   iconText: { color: '#fff', fontSize: 26, fontWeight: 'bold' },

// //   // ---- Avatar picker ----
// //   avatarPickerBox: {
// //     backgroundColor: '#fff',
// //     borderRadius: 20,
// //     paddingVertical: 24,
// //     paddingHorizontal: 20,
// //     width: '85%',
// //     alignItems: 'center',
// //   },
// //   avatarGrid: {
// //     flexDirection: 'row',
// //     flexWrap: 'wrap',
// //     gap: 14,
// //     justifyContent: 'center',
// //     marginTop: 8,
// //     marginBottom: 16,
// //   },
// //   avatarGridItem: {
// //     width: 64,
// //     height: 64,
// //     borderRadius: 32,
// //     overflow: 'hidden',
// //     borderWidth: 2,
// //     borderColor: '#dde3f0',
// //   },
// //   avatarGridItemSelected: {
// //     borderColor: '#182992',
// //     borderWidth: 3,
// //   },
// //   avatarGridImage: {
// //     width: '100%',
// //     height: '100%',
// //   },

// //   modalCloseBtnFull: {
// //     width: '100%',
// //     backgroundColor: '#dde3f0',
// //     paddingVertical: 14,
// //     borderRadius: 12,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //   },
// // });
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  ImageBackground,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { AVATAR_LIST, getAvatarSource } from '../avatar/Avatar';
import { ArrowLeft, Pencil, Check, X, LogOut } from 'lucide-react-native';

type Props = { navigation: NativeStackNavigationProp<any> };

const ProfileScreen = ({ navigation }: Props) => {
  const { user, userProfile, updateProfile, logout, refreshProfile } =
    useAuth();

  const displayName =
    userProfile?.name ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Guest';
  const photoURL = userProfile?.photoURL || user?.photoURL || null;
  const avatarSource = getAvatarSource(userProfile?.avatarId);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [loading, setLoading] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(userProfile?.username || '');

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  const [messageModal, setMessageModal] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ visible: false, type: 'success', title: '', message: '' });

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
    setLoading(true);
    updateProfile({ username: trimmed })
      .then(() => {
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
    logout().then(() => {
      navigation.replace('Login');
    });
  };

  const handleSelectAvatar = (avatarId: string) => {
    setAvatarSaving(true);
    updateProfile({ avatarId, photoURL: null })
      .then(() => {
        setAvatarPickerVisible(false);
        showMessage('success', 'Success', 'Avatar has been update!');
      })
      .catch(err => showMessage('error', 'Error', err.message))
      .finally(() => setAvatarSaving(false));
  };

  // "My Photo" option — email/Google/Facebook login bata aaeko photo
  // lai wapas select garna milos bhanera. photoURL field lai chuँdaina
  // (userProfile.photoURL ma already save vaisakeko cha), matra
  // avatarId lai null garincha taki avatarSource fallback huna
  // rokिiyos ra photo dekhinchha (ProfileScreen ko `photoURL` variable
  // ko logic: avatarSource > photoURL > letter, teso huँda avatarId
  // null vayepachi photoURL automatically dekhincha).
  const handleSelectMyPhoto = () => {
    if (!photoURL) return;
    setAvatarSaving(true);
    updateProfile({ avatarId: null })
      .then(() => {
        setAvatarPickerVisible(false);
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
    <ImageBackground
      source={require('../images/bg3.png')}
      style={s.bg}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.iconBtn}
          >
            <ArrowLeft size={19} color="#F5EFE0" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>My Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ===== Floating avatar ===== */}
        <View style={s.avatarFloatWrap}>
          <TouchableOpacity
            onPress={() => setAvatarPickerVisible(true)}
            style={s.avatarTouchable}
            activeOpacity={0.85}
          >
            <View style={s.avatarRing}>
              {avatarSource ? (
                <Image source={avatarSource} style={s.avatarImage} />
              ) : photoURL ? (
                <Image source={{ uri: photoURL }} style={s.avatarImage} />
              ) : (
                <View style={s.avatarFallback}>
                  <Text style={s.avatarLetter}>
                    {displayName?.[0]?.toUpperCase() ?? 'G'}
                  </Text>
                </View>
              )}
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

        {/* Logout */}
        <TouchableOpacity
          style={s.logoutBtn}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <LogOut size={17} color="#F5EFE0" />
          <Text style={s.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

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
              <Text style={s.modalMessage}>Logout garne?</Text>
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
                {/* "My Photo" option — email/Google/Facebook login bata aaeko
                    photo, sadhai grid ko sabai bhanda pahilo option ma dekhincha,
                    photoURL cha bhane matra */}
                {photoURL && (
                  <TouchableOpacity
                    onPress={handleSelectMyPhoto}
                    disabled={avatarSaving}
                    style={[
                      s.avatarGridItem,
                      !userProfile?.avatarId && s.avatarGridItemSelected,
                    ]}
                  >
                    <Image
                      source={{ uri: photoURL }}
                      style={s.avatarGridImage}
                    />
                  </TouchableOpacity>
                )}

                {AVATAR_LIST.filter(a => !!a?.source).map(a => (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => handleSelectAvatar(a.id)}
                    disabled={avatarSaving}
                    style={[
                      s.avatarGridItem,
                      userProfile?.avatarId === a.id &&
                        s.avatarGridItemSelected,
                    ]}
                  >
                    <Image source={a.source} style={s.avatarGridImage} />
                  </TouchableOpacity>
                ))}
              </View>

              {avatarSaving && (
                <ActivityIndicator
                  color="#E0972A"
                  style={{ marginBottom: 12 }}
                />
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
      </ScrollView>
    </ImageBackground>
  );
};

export default ProfileScreen;

const s = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#aeb3c1',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
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
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#F5EFE0',
    fontSize: 34,
    fontWeight: '800',
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

  // Logout
  logoutBtn: {
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