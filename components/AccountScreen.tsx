import React, { useEffect, useState } from 'react';
import { View, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from './navigation';
import { useFocusEffect } from '@react-navigation/native';

type AccountScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AccountScreen'>;

const AccountScreen = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); 
  const navigation = useNavigation<AccountScreenNavigationProp>();

  const checkLoginStatus = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  };


  useFocusEffect(
    React.useCallback(() => {
      checkLoginStatus();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user'); 
      setIsLoggedIn(false); 
      Alert.alert('Đã đăng xuất thành công');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <View style={styles.container}>
      {!isLoggedIn ? (
        <>
          <Button
            title="Đăng Nhập"
            onPress={() => navigation.navigate('LoginForm')}
          />
          <Button
            title="Đăng Ký"
            onPress={() => navigation.navigate('RegisterForm')}
          />
        </>
      ) : (
        <Button title="Đăng Xuất" onPress={handleLogout} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});

export default AccountScreen;
