import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal, Image
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Eye, EyeOff, User } from 'lucide-react-native';
import Layout from '../components/AppLayout/Layout';
import { AuthHeader } from '../components/headers';

type Props = { navigation: NativeStackNavigationProp<any> };

const LoginScreen = ({ navigation }: Props) => {
  const { loginWithEmail, loginWithGoogle, loginAsGuest, loginWithFacebook } =
    useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [fbLoading, setFbLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const getFriendlyAuthError = (code: string) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Incorrect email or password. Please try again.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      default:
        return 'Login failed. Please try again.';
    }
  };

  const handleEmailLogin = () => {
    if (!email || !password) {
      showAlert('Error', 'Enter Email and Password!');
      return;
    }
    setLoading(true);
    loginWithEmail(email, password)
      .then(() => {
        navigation.replace('Mode');
      })
      .catch(err => {
        showAlert('Login Failed', getFriendlyAuthError(err.code));
      })
      .finally(() => setLoading(false));
  };
  const handleGoogleLogin = () => {
    setLoading(true);
    loginWithGoogle()
      .then(() => {
        navigation.replace('Mode');
      })
      .catch(err => {
        console.log('GOOGLE LOGIN ERROR CODE:', err.code);
        console.log('GOOGLE LOGIN ERROR MESSAGE:', err.message);
        showAlert('Google Login Failed', getFriendlyAuthError(err.code));
      })
      .finally(() => setLoading(false));
  };

  const handleGuestLogin = () => {
    setLoading(true);
    loginAsGuest()
      .then(() => {
        navigation.replace('Mode');
      })
      .catch(err => {
        showAlert('Guest Login Failed', getFriendlyAuthError(err.code));
      })
      .finally(() => setLoading(false));
  };

  const handleFacebookLogin = () => {
    setFbLoading(true);
    loginWithFacebook()
      .then(() => {
        navigation.replace('Mode');
      })
      .catch(err => {
        if (err.message !== 'User cancelled the login process') {
          showAlert('Login Failed', err.message ?? 'Something went wrong');
        }
      })
      .finally(() => setFbLoading(false));
  };

  return (
    <Layout>
      <View style={{ marginTop: 50 }} />
      <AuthHeader
        appName="आलु प्लस"
        title="Welcome Back"
        subtitle="Login to continue playing"
      />

      {/* ===== Login card ===== */}
      <View style={s.card}>
        {/* Email Input */}
        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor="#6B7196"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password Input */}
        <View style={s.passwordWrap}>
          <TextInput
            style={s.passwordInput}
            placeholder="Password"
            placeholderTextColor="#6B7196"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={s.eyeBtn}
            onPress={() => setShowPassword(prev => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={20} color="#8B93AE" />
            ) : (
              <Eye size={20} color="#8B93AE" />
            )}
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={s.loginBtn}
          onPress={handleEmailLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#12194A" />
          ) : (
            <Text style={s.loginBtnText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={s.dividerRow}>
          <View style={s.divider} />
          <Text style={s.dividerText}>Or</Text>
          <View style={s.divider} />
        </View>

        {/* Google Login */}
        <TouchableOpacity
          style={s.googleBtn}
          onPress={handleGoogleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Image
            source={require('../images/icons/gg.png')}
            style={s.socialIcon}
            resizeMode="contain"
          />
          <Text style={s.googleBtnText}>Sign in with Google</Text>
        </TouchableOpacity>

        {/* Facebook Login */}
        <TouchableOpacity
          style={s.facebookButton}
          onPress={handleFacebookLogin}
          disabled={fbLoading}
          activeOpacity={0.85}
        >
          {fbLoading ? (
            <ActivityIndicator color="#F5EFE0" />
          ) : (
            <>
              <Image
                source={require('../images/icons/fb.png')}
                style={s.socialIcon}
                resizeMode="contain"
              />
              <Text style={s.facebookButtonText}>Continue with Facebook</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Guest Login */}
        <TouchableOpacity
          style={s.guestBtn}
          onPress={handleGuestLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#F5EFE0" />
          ) : (
            <>
              <User size={18} color="#F5EFE0" style={{ marginRight: 8 }} />
              <Text style={s.guestBtnText}>Login as Guest</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Register Link — only the "Register" word itself is pressable */}
      <View style={s.registerRow}>
        <Text style={s.registerLinkText}>Don't Have Account? </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
        >
          <Text style={s.registerLinkBold}>Register</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Alert Popup */}
      <Modal
        visible={alertVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.alertCard}>
            <View style={s.alertIconWrap}>
              <AlertCircle size={28} color="#E9877D" />
            </View>
            <Text style={s.alertTitle}>{alertTitle}</Text>
            <Text style={s.alertMessage}>{alertMessage}</Text>
            <TouchableOpacity
              style={s.alertBtn}
              onPress={() => setAlertVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={s.alertBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Layout>
  );
};

export default LoginScreen;

const s = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  // ===== Card wrapping the whole form =====
  card: {
    width: '100%',
    backgroundColor: '#1B2560',
    borderRadius: 28,
    paddingVertical: 26,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.18)',
  },

  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    width: '100%',
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
    color: '#F5EFE0',
  },
  loginBtn: {
    backgroundColor: '#E0972A',
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#E0972A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  loginBtnText: {
    color: '#12194A',
    fontSize: 17,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#8B93AE',
    fontSize: 13,
    fontWeight: '600',
  },
  googleBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  googleBtnText: {
    color: '#F5EFE0',
    fontSize: 15,
    fontWeight: '700',
  },
  facebookButton: {
    backgroundColor: 'rgba(24,118,242,0.18)',
    width: '100%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(24,118,242,0.4)',
    marginBottom: 12,
  },
  facebookButtonText: {
    color: '#F5EFE0',
    fontSize: 15,
    fontWeight: '700',
  },
  guestBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  guestBtnText: {
    color: '#F5EFE0',
    fontSize: 15,
    fontWeight: '700',
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 18,
    width: '100%',
    justifyContent: 'center',
  },
  registerLinkText: {
    color: '#8B93AE',
    fontSize: 14,
    textAlign: 'center',
  },
  registerLinkBold: {
    color: '#E0972A',
    fontWeight: '800',
    fontSize: 14,
  },
  passwordWrap: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#F5EFE0',
  },
  eyeBtn: {
    paddingLeft: 8,
  },

  // ---- Custom Alert ----
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  alertCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1B2560',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  alertIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3A2226',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#F5EFE0',
    marginBottom: 6,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 13,
    color: '#8B93AE',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
  },
  alertBtn: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    backgroundColor: '#B31B34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
