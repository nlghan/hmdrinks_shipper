
export type RootStackParamList = {
    Home: undefined;
    Login: undefined;
    Info: undefined;
    Other: undefined;
    Main: undefined;
    LanguageChange:  undefined;
    ShipmentDetails: { shipmentId: number };
    Notification: { userId: number } | undefined;
    ChatWithUser: { shipmentId: number };
  };
  