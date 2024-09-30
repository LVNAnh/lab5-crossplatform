import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Image, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from './navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OrderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderScreen'>;
type OrderScreenRouteProp = RouteProp<RootStackParamList, 'OrderScreen'>;

interface Product {
  id: string;
  name: string;
  price: number;
  thumbnail: string;
}

interface CartItem {
  product_id: string;
  quantity: number;
  total_price: number;
}

interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  total_amount: number;
}

const OrderScreen = ({ route, navigation }: { route: OrderScreenRouteProp; navigation: OrderScreenNavigationProp }) => {
  const { cartItems, totalAmount } = route.params;
  const [productDetails, setProductDetails] = useState<{ [key: string]: Product }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<Cart | null>(null); 

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const productRequests = cartItems.map((item: CartItem) => 
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
        console.error('Error fetching product details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCart = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        const user_id = user?.id;

        if (!user_id) {
          console.error('User not logged in');
          return;
        }

        const response = await axios.get(`https://66f55e039aa4891f2a24f7c0.mockapi.io/cart?user_id=${user_id}`);
        const cartData = response.data[0]; // Giả sử API trả về một mảng, bạn sẽ lấy phần tử đầu tiên.
        setCart(cartData);
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

    fetchProductDetails();
    fetchCart();
  }, [cartItems]);

  const handlePlaceOrder = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const user_id = user?.id;
  
      if (!user_id) {
        alert('Please log in to place an order');
        return;
      }
  
      const orderData = {
        user_id: user_id, 
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          total_price: item.total_price,
        })),
        total_amount: totalAmount,
        created_at: new Date(),
        status: 'pending',
      };
  
      const response = await axios.post('https://66f55e039aa4891f2a24f7c0.mockapi.io/order', orderData);
      if (response.status === 201) {
        alert('Đặt hàng thành công');
  
        if (cart && cart.id) {
          // Sử dụng cart.id để xóa giỏ hàng
          const deleteResponse = await axios.delete(`https://66f55e039aa4891f2a24f7c0.mockapi.io/cart/${cart.id}`);
          
          if (deleteResponse.status === 200) {
            setCart(null); 
            navigation.navigate('Home');
          } else {
            alert('Không thể xóa giỏ hàng');
          }
        }
      } else {
        alert('Lỗi trong quá trình đặt hàng');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Đã xảy ra lỗi, vui lòng thử lại');
    }
  };
  

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  const formatCurrencyVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };  

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Xác nhận Đơn Hàng</Text>
      {cartItems && cartItems.length > 0 ? (
        cartItems.map((item) => {
          const product = productDetails[item.product_id];
          return (
            <View key={item.product_id} style={styles.cartItem}>
              <Image source={{ uri: product?.thumbnail }} style={styles.productImage} />
              <View style={styles.productDetails}>
                <Text style={styles.productTitle}>{product?.name}</Text>
                <Text>Số lượng: {item.quantity}</Text>
                <Text>Giá: {formatCurrencyVND(item.total_price)}</Text>
              </View>
            </View>
          );
        })
      ) : (
        <Text>Giỏ hàng của bạn trống</Text>
      )}

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Tổng giá: {formatCurrencyVND(totalAmount)}</Text>
      </View>

      <Button title="Xác nhận và đặt hàng" onPress={handlePlaceOrder} />
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
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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

export default OrderScreen;
