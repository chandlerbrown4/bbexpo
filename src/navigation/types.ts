import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  SignIn: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  NearbyBars: undefined;
};
