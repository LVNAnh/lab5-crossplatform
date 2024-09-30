export interface CartItem {
  product_id: string;
  quantity: number;
  total_price: number;
}

export type RootStackParamList = {
  Home: undefined;
  ProductDetail: { productId: string };
  LoginForm: undefined;
  RegisterForm: undefined;
  Cart: undefined;
  OrderScreen: { cartItems: CartItem[]; totalAmount: number }; 
  AccountScreen: undefined;
};

  