import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Colors } from '../../../shared/theme/colors';
import { walletAPI } from '../../../shared/services/api';
import { 
  BackIcon, 
  CameraIcon
} from '../../../shared/components/CustomIcons';

const QUICK_AMOUNTS = [100, 200, 300, 400, 500, 600, 700, 800];

const TopUpScreen: React.FC = ({ navigation }: any) => {
  const [amount, setAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleQuickAmountSelect = (value: number) => {
    setSelectedAmount(value);
    setAmount(value.toString());
  };

  const handleCustomAmount = (text: string) => {
    // Only allow numbers and single decimal point
    const cleanText = text.replace(/[^0-9.]/g, '');
    const parts = cleanText.split('.');
    if (parts.length > 2) return;
    
    setAmount(cleanText);
    setSelectedAmount(null);
  };

  const validateAmount = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than ₹0');
      return false;
    }
    if (numAmount < 10) {
      Alert.alert('Minimum Amount', 'Minimum top-up amount is ₹10');
      return false;
    }
    if (numAmount > 50000) {
      Alert.alert('Maximum Amount', 'Maximum top-up amount is ₹50,000');
      return false;
    }
    return true;
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera access is needed to take payment screenshots',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library access is needed to select payment screenshots',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const selectImageFromLibrary = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    setUploadLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPaymentScreenshot(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setUploadLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPaymentScreenshot(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Payment Screenshot',
      'How would you like to add your payment screenshot?',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: selectImageFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeScreenshot = () => {
    Alert.alert(
      'Remove Screenshot',
      'Are you sure you want to remove this payment screenshot?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', onPress: () => setPaymentScreenshot(null), style: 'destructive' },
      ]
    );
  };

  const handleSubmitTopUpRequest = async () => {
    if (!validateAmount()) return;
    
    if (!paymentScreenshot) {
      Alert.alert(
        'Payment Screenshot Required',
        'Please upload a payment screenshot for verification',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      // Submit the top-up request with amount and screenshot
      const topUpData = {
        amount: parseFloat(amount),
        screenshot: paymentScreenshot,
        timestamp: new Date().toISOString(),
      };

      // This would be replaced with actual API call
      // await walletAPI.submitTopUpRequest(topUpData);
      
      Alert.alert(
        'Request Submitted',
        `Your top-up request for ₹${amount} has been submitted successfully. You will receive a notification once it's approved.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Request Failed',
        'Failed to submit top-up request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const isValidAmount = amount && parseFloat(amount) >= 10 && parseFloat(amount) <= 50000;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <BackIcon size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Up</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        {/* Amount Input */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Enter amount</Text>
          <View style={styles.amountDisplayContainer}>
            <TextInput
              style={styles.amountDisplay}
              value={amount}
              onChangeText={handleCustomAmount}
              keyboardType="numeric"
              placeholder="1,900"
              placeholderTextColor={Colors.text.secondary}
            />
          </View>
        </View>

        {/* Quick Amount Grid */}
        <View style={styles.quickAmountSection}>
          <View style={styles.quickAmountGrid}>
            {QUICK_AMOUNTS.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickAmountButton,
                  selectedAmount === value && styles.quickAmountButtonSelected
                ]}
                onPress={() => handleQuickAmountSelect(value)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.quickAmountText,
                  selectedAmount === value && styles.quickAmountTextSelected
                ]}>
                  ${value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Screenshot Section */}
        <View style={styles.screenshotSection}>
          {paymentScreenshot ? (
            <View style={styles.screenshotContainer}>
              <Image source={{ uri: paymentScreenshot }} style={styles.screenshotImage} />
              <TouchableOpacity
                style={styles.screenshotRemoveButton}
                onPress={removeScreenshot}
                activeOpacity={0.8}
              >
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={showImagePickerOptions}
              disabled={uploadLoading}
              activeOpacity={0.8}
            >
              {uploadLoading ? (
                <ActivityIndicator color={Colors.text.secondary} size="small" />
              ) : (
                <>
                  <CameraIcon size={20} color={Colors.text.secondary} />
                  <Text style={styles.uploadText}>Add Screenshot</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Fixed Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isValidAmount || loading || !paymentScreenshot) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitTopUpRequest}
          disabled={!isValidAmount || loading || !paymentScreenshot}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.text.white} size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Amount Section
  amountSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  amountDisplayContainer: {
    alignItems: 'center',
  },
  amountDisplay: {
    fontSize: 36,
    fontWeight: '300',
    color: Colors.text.primary,
    textAlign: 'center',
    minWidth: 150,
  },

  // Quick Amount Grid
  quickAmountSection: {
    paddingHorizontal: 10,
  },
  quickAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickAmountButton: {
    width: '22%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
  },
  quickAmountButtonSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + '15',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  quickAmountTextSelected: {
    color: Colors.primary.main,
    fontWeight: '700',
  },

  // Screenshot Section
  screenshotSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  screenshotContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  screenshotImage: {
    width: 120,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
  },
  screenshotRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    height: 80,
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },

  // Submit Button
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  submitButton: {
    backgroundColor: Colors.text.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.text.light,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
  },
});

export default TopUpScreen;
