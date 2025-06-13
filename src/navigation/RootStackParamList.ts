
export type RootStackParamList = {
    Home: undefined;
    Login: undefined;
    Info: undefined;
    Analytics: undefined;
    Other: undefined;
    Main: undefined;
    LanguageChange:  undefined;
    ShipmentDetails: { shipmentId: number };
    ShipmentGroupDetails: { shipmentId: number };
    Notification: { userId: number } | undefined;
    ChatWithUser: { shipmentId: number };
    DirectionScreen: { shipmentId: number, status:string };
    Register: undefined;
    ForgotPassword: undefined;
    AbsenceRequest: undefined;
    DirectionGroupScreen: { shipmentId: number, status:string };
  };
  