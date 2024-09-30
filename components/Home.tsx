import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Button } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Product {
  id: string;
  name: string;
  price: number;
  thumbnail: string;
  description: string;
  createdAt: string;
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

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]); 
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]); 
  const [cart, setCart] = useState<Cart | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(''); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null); 
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setIsLoggedIn(true);
          setUserId(user.id); 
          await fetchCart(user.id); 
        } else {
          setIsLoggedIn(false);
          setCart(null); 
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await axios.get('https://66e7f7adb17821a9d9dac0bc.mockapi.io/products');
        setProducts(response.data);
        setFilteredProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCart = async (userId: string) => {
      try {
        const response = await axios.get(`https://66f55e039aa4891f2a24f7c0.mockapi.io/cart/${userId}`);
        setCart(response.data); 
      } catch (error) {
        console.error('Error fetching cart:', error);
        setCart(null);
      }
    };

    checkLoginStatus();
    fetchProducts();
  }, []);

  const normalizeString = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query) {
      setFilteredProducts(products); 
      return;
    }

    const normalizedQuery = normalizeString(query);

    const results = products.filter((product) => {
      const normalizedProductName = normalizeString(product.name);
      const normalizedProductDescription = normalizeString(product.description);

      return (
        normalizedProductName.includes(normalizedQuery) ||
        normalizedProductDescription.includes(normalizedQuery)
      );
    });

    setFilteredProducts(results); 
  };

  const handleAddToCart = async (product: Product) => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const user_id = user?.id;
  
      if (!user_id) {
        alert('Hãy đăng nhập để thêm sản phẩm vào giỏ hàng');
        return;
      }
  
      if (!cart || cart.items.length === 0) { 
        const newCart: Cart = {
          id: '',
          user_id: user_id,
          items: [
            {
              product_id: product.id,
              quantity: 1,
              total_price: product.price,
            },
          ],
          total_amount: product.price,
        };
  
        try {
          const response = await axios.post('https://66f55e039aa4891f2a24f7c0.mockapi.io/cart', newCart);
          if (response.status === 201) {
            alert('Sản phẩm đã được thêm vào giỏ hàng');
            setCart(response.data); 
          } else {
            alert('Không thể thêm sản phẩm vào giỏ hàng');
          }
        } catch (error) {
          console.error('Error adding product to cart:', error);
        }
      } else {
    
        const existingCartItem = cart.items.find(item => item.product_id === product.id);
        if (existingCartItem) {
          const updatedItems = cart.items.map((item: CartItem) =>
            item.product_id === product.id
              ? { ...item, quantity: item.quantity + 1, total_price: item.total_price + product.price }
              : item
          );
  
          const updatedCart = {
            ...cart,
            items: updatedItems,
            total_amount: updatedItems.reduce((sum, item) => sum + item.total_price, 0),
          };
  
          try {
            const response = await axios.put(`https://66f55e039aa4891f2a24f7c0.mockapi.io/cart/${cart.id}`, updatedCart);
            if (response.status === 200) {
              alert('Giỏ hàng đã được cập nhật');
              setCart(updatedCart); 
            } else {
              alert('Could not update cart');
            }
          } catch (error) {
            console.error('Error updating cart:', error);
          }
        } else {
          const updatedItems = [
            ...cart.items,
            { product_id: product.id, quantity: 1, total_price: product.price },
          ];
  
          const updatedCart = {
            ...cart,
            items: updatedItems,
            total_amount: updatedItems.reduce((sum, item) => sum + item.total_price, 0),
          };
  
          try {
            const response = await axios.put(`https://66f55e039aa4891f2a24f7c0.mockapi.io/cart/${cart.id}`, updatedCart);
            if (response.status === 200) {
              alert('Đã thêm sản phẩm vào giỏ hàng');
              setCart(updatedCart); 
            } else {
              alert('Could not add product to cart');
            }
          } catch (error) {
            console.error('Error adding product to cart:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user ID:', error);
    }
  };

  

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  if (isLoading) {
    return (
      <View>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Đang tải sản phẩm...</Text>
      </View>
    );
  }

  const formatCurrencyVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.searchBarContainer}>
          <Icon name="search" size={24} color="#999" style={styles.searchIcon} />
          <TextInput
            placeholder="Tìm kiếm sản phẩm"
            style={styles.searchBar}
            value={searchQuery}
            onChangeText={handleSearch} 
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        <TouchableOpacity style={styles.categoryCard}>
          <Image source={{ uri: 'https://storage-asset.msi.com/global/picture/article/article_16009243955f6c2aeb2f2c8.jpg' }} style={styles.categoryIcon} />
          <Text style={styles.categoryText}>Điện tử</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryCard}>
          <Image source={{ uri: 'https://www.elleman.vn/wp-content/uploads/2018/06/01/nguoi-mau-nam-co-anh-huong-nhat-hanh-tinh-1b-elleman.jpg' }} style={styles.categoryIcon} />
          <Text style={styles.categoryText}>Thời trang</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryCard}>
          <Image source={{ uri: 'https://cdn.chanhtuoi.com/uploads/2021/08/dung-cu-lam-vuon-1.jpg' }} style={styles.categoryIcon} />
          <Text style={styles.categoryText}>Làm vườn</Text>
        </TouchableOpacity>
      </ScrollView>

      <Text style={styles.sectionTitle}>Sản phẩm đặc trưng</Text>
      <View style={styles.productGrid}>
        {products && products.length > 0 ? (
          products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <TouchableOpacity onPress={() => handleProductPress(product.id)}>
                <Image source={{ uri: product.thumbnail }} style={styles.productImage} />
                <Text style={styles.productTitle}>{product.name}</Text>
                <Text style={styles.productPrice}>{formatCurrencyVND(product.price)}</Text>
              </TouchableOpacity>
              <Button
                title="Thêm vào giỏ"
                onPress={() => handleAddToCart(product)} 
              />
            </View>
          ))
        ) : (
          <Text>Không có sản phẩm nào để hiển thị</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Ưu đãi đặc biệt</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.offerCard}>
          <Image source={{ uri: 'https://www.shopbase.com/blog/wp-content/uploads/2022/01/shopbase-aliexpress-banner.jpg' }} style={styles.offerImage} />
          <Text style={styles.offerText}>Giảm 50% cho tất cả thời trang</Text>
        </View>
        <View style={styles.offerCard}>
          <Image source={{ uri: 'https://www.shopbase.com/blog/wp-content/uploads/2022/01/shopbase-aliexpress-banner.jpg' }} style={styles.offerImage} />
          <Text style={styles.offerText}>Mua 1 tặng 1 điện tử</Text>
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    flex: 1,
    marginRight: 15,
  },
  searchBar: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 5,
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 15,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    height: 'auto',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  productImage: {
    width: '100%',
    height: 120,
    marginBottom: 10,
    borderRadius: 10,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    width: '100%',
    height: 90,
  },
  productPrice: {
    fontSize: 14,
    color: '#555',
  },
  offerCard: {
    marginRight: 15,
    width: 300,
    marginBottom: 20,
  },
  offerImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  offerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4500',
  },
});

export default Home;
