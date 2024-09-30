import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabs from '@/components/BottomTabs'; 
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import OrderScreen from '@/components/OrderScreen'; 

const Stack = createStackNavigator();

export default function App() {
  return (
      <Stack.Navigator initialRouteName="BottomTabs">
        <Stack.Screen
          name="BottomTabs"
          component={BottomTabs}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen name="LoginForm" component={LoginForm} />

        <Stack.Screen name="RegisterForm" component={RegisterForm} />

        <Stack.Screen name="OrderScreen" component={OrderScreen} />
      </Stack.Navigator>
  );
}
