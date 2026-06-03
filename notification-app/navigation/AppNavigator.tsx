import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OrderDetailScreen from '../screens/OrderDetailScreen';
import OrderListScreen from '../screens/OrderListScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="Orders"
        component={OrderListScreen}
        options={{ title: 'Order Updates' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Order Detail' }}
      />
    </Stack.Navigator>
  );
}
