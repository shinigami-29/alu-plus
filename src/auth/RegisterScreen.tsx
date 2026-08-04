import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import Layout from '../components/AppLayout/Layout';
import { AuthHeader } from '../components/headers';

type Props = { navigation: NativeStackNavigationProp<any> };

const RegisterScreen = ({ navigation }: Props) => {
  const { registerWithEmail } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleRegister = () => {
    if (!name || !username || !email || !password || !confirmPassword) {
      showAlert('Error', 'Please fill all the fields!');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Error', 'Password not matched!');
      return;
    }
    if (password.length < 6) {
      showAlert('Error', 'Password must have at least 6 Character!');
      return;
    }
    setLoading(true);
    registerWithEmail(email, password, name, username)
      .then(() => {
        showAlert(
          'Registration Successful',
          'A verification email has been sent to your inbox. Please check and verify your email.',
        );
        setTimeout(() => {
          navigation.replace('Mode');
        }, 2000);
      })
      .catch(err => {
        showAlert('Register Failed', err.message);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Layout>
      <View style={{ marginTop: 50 }} />
      <AuthHeader
        appName="आलु प्लस"
        title="Create Account"
        subtitle="Sign up to get started"
      />

      {/* ===== Register card ===== */}
      <View style={s.card}>
        {/* Name */}
        <TextInput
          style={s.input}
          placeholder="Full Name"
          placeholderTextColor="#6B7196"
          value={name}
          onChangeText={setName}
        />

        {/* Username */}
        <TextInput
          style={s.input}
          placeholder="Username"
          placeholderTextColor="#6B7196"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        {/* Email */}
        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor="#6B7196"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password */}
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

        {/* Confirm Password */}
        <View style={s.passwordWrap}>
          <TextInput
            style={s.passwordInput}
            placeholder="Confirm Password"
            placeholderTextColor="#6B7196"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            style={s.eyeBtn}
            onPress={() => setShowConfirmPassword(prev => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color="#8B93AE" />
            ) : (
              <Eye size={20} color="#8B93AE" />
            )}
          </TouchableOpacity>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={s.registerBtn}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#12194A" />
          ) : (
            <Text style={s.registerBtnText}>Register</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Login Link — only the "Login" word itself is pressable */}
      <View style={s.loginRow}>
        <Text style={s.loginLinkText}>Have Account? </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
        >
          <Text style={s.loginLinkBold}>Login</Text>
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

export default RegisterScreen;

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
  registerBtn: {
    backgroundColor: '#E0972A',
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#E0972A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  registerBtnText: {
    color: '#12194A',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 18,
    width: '100%',
    justifyContent: 'center',
  },
  loginLinkText: {
    color: '#8B93AE',
    fontSize: 14,
    textAlign: 'center',
  },
  loginLinkBold: {
    color: '#E0972A',
    fontWeight: '800',
    fontSize: 14,
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
    padding: 26,
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
    fontSize: 14,
    color: '#8B93AE',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
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
});
