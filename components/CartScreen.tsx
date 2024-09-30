import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, Button, Alert } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack'; 
import { RootStackParamList } from './navigation'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cart'>;

interface Cart {
  user_id: string;
  items: CartItem[];
  total_amount: number;
  created_at: string;
  updated_at: number;
  status: string;
  id: string;
}

interface CartItem {
  product_id: string;
  quantity: number;
  total_price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  thumbnail: string;
}

const CartScreen = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [productDetails, setProductDetails] = useState<{ [key: string]: Product }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigation = useNavigation<CartScreenNavigationProp>();

  const fetchCartItems = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const user_id = user?.id;

      if (!user_id) {
        console.error('User not logged in');
        setCart(null);
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`https://66f55e039aa4891f2a24f7c0.mockapi.io/cart/${user_id}`);
      const cartData = response.data;
      setCart(cartData);

      const productRequests = cartData.items.map((item: CartItem) =>
        axios.get(`https://66e7f7adb17821a9d9dac0bc.mockapi.io/products/${item.product_id}`)
      );
      const productsResponse = await Promise.all(productRequests);

      const productDetailsMap: { [key: string]: Product } = {};
      productsResponse.forEach((response) => {
        const product = response.data;
        productDetailsMap[product.id] = product;
      });
      setProductDetails(productDetailsMap);
    } catch (error) {
      console.error('Error fetching cart items or products:', error);
      setCart(null); 
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      fetchCartItems();
    }, [])
  );
  

  const handleRemoveFromCart = async (productId: string) => {
    try {
      const updatedItems = cart?.items.filter(item => item.product_id !== productId) || [];
      const updatedTotalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
      
      setCart({
        ...cart!,
        items: updatedItems,
        total_amount: updatedTotalAmount,
      });
  
      await axios.put(`https://66f55e039aa4891f2a24f7c0.mockapi.io/cart/${cart?.id}`, {
        ...cart,
        items: updatedItems,
        total_amount: updatedTotalAmount,
      });
  
      Alert.alert('Xóa thành công', 'Sản phẩm đã được xóa khỏi giỏ hàng');
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
      Alert.alert('Lỗi', 'Không thể xóa sản phẩm khỏi giỏ hàng');
    }
  };
  
  

  const getTotalQuantity = () => {
    return cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };
  
  const getTotalPrice = () => {
    return cart?.items.reduce((sum, item) => sum + item.total_price, 0) || 0;
  };
  
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Đang tải giỏ hàng...</Text>
      </View>
    );
  }

  const handleProceedToOrder = () => {
    if (cart && cart.items.length > 0) {
      navigation.navigate('OrderScreen', {
        cartItems: cart.items, 
        totalAmount: cart.total_amount,
      });
    } else {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm sản phẩm trước khi đặt hàng');
    }
  };
  
  const formatCurrencyVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Giỏ Hàng</Text>
      {cart && cart.items.length > 0 ? (
  cart.items.map((item) => {
    const product = productDetails[item.product_id];
    return (
      <View key={item.product_id} style={styles.cartItem}>
        {product ? (
          <Image source={{ uri: product.thumbnail }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Text>No Image</Text>
          </View>
        )}
        <View style={styles.productDetails}>
          <Text style={styles.productTitle}>{product?.name || 'Tên sản phẩm'}</Text>
          <Text style={styles.productQuantity}>Số lượng: {item.quantity}</Text>
          <Text style={styles.productPrice}>Giá: {formatCurrencyVND(item.total_price)}</Text>
          <Button
            title="Xóa"
            color="red"
            onPress={() => handleRemoveFromCart(item.product_id)}
          />
        </View>
      </View>
    );
  })
) : (
  <Text>Giỏ hàng của bạn trống</Text>
)}

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Tổng số lượng: {getTotalQuantity()}</Text>
        <Text style={styles.summaryText}>Tổng giá: {formatCurrencyVND(getTotalPrice())}</Text>
      </View>
      <Button title="Tiến đến trang đặt hàng" onPress={handleProceedToOrder} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  productImage: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 10,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 10,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productQuantity: {
    fontSize: 14,
    color: '#555',
  },
  productPrice: {
    fontSize: 14,
    color: '#555',
  },
  summaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CartScreen;
