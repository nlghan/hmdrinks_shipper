import { StyleSheet } from 'react-native';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  SPACING,
} from '../theme/theme';
const styles = StyleSheet.create({
    container: {
      flex: 1,
      opacity: 1,
      backgroundColor:'fff'
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: COLORS.primaryGreenHex,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 4,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logo: {
      width: 30,
      height: 30,
      marginRight: 8,
      resizeMode: 'contain',
    },
    greeting: {
      fontSize: 16,
      color: '#333',
      fontFamily: FONTFAMILY.lobster_regular
    },
    headerIcons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
      borderWidth: 1,
      borderColor: '#ccc',
      backgroundColor: '#fff',
      borderRadius: 50,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    iconText: {
      marginLeft: 4,
      fontSize: 14,
      fontWeight: 'bold',
    },
    rewardsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      marginTop: 5,
      gap: 10,
    },
    categoryTitle: {
      fontSize: 20,
      color: 'black',
      marginTop: 10,
      marginLeft: 8,
      letterSpacing: 1,
      fontFamily:FONTFAMILY.lobster_regular
    },
    services: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      paddingHorizontal: 14,
      marginTop: 20,
    },
    productHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 8,
      alignItems: 'center',
      marginBottom:10
    },
    productTitle: {
      fontSize: 20,
      color: 'black',
      marginTop: 10,
      marginLeft: 8,
      letterSpacing: 1,
      fontFamily: FONTFAMILY.lobster_regular
    },
    productTitle2: {
      fontSize: 13,
      color: COLORS.primaryGreenHex,
      marginTop: 10,
      marginRight: 8,
      letterSpacing: 1,
      fontFamily:FONTFAMILY.lobster_regular
    },
    serviceItem: {
      alignItems: 'center',
      marginRight: 16,
    },
    serviceImage: {
      width: 65,
      height: 65,
      borderRadius: 33,
    },
    notificationDot: {
      width: 8,
      height: 8,
      backgroundColor: COLORS.primaryGreenHex,
      borderRadius: 4,
      position: 'absolute',
      top: 0,
      right: 0,
    },
    serviceText: {
      fontSize: 20,
      marginTop: 4,
      textAlign: 'center',
      fontFamily:FONTFAMILY.dongle_regular
    },
    notificationCount: {
      position: "absolute",
      top: -6,
      right: -5,
      backgroundColor: COLORS.primaryGreenHex,
      width: 16,
      height: 16,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
  },
  
  notificationText: {
      color: "white",
      fontSize: 10,
      fontWeight: "bold",
  },
  searchBar: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F1F1F1",
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 5,
  marginBottom: 10,
},
searchInput: {
  flex: 1,
  marginLeft: 10,
  fontSize: 16,
},
searchItem: {
  padding: 10,
  borderBottomWidth: 1,
  borderBottomColor: "#ddd",
},
searchItemText: {
  fontSize: 16,
},

    
    
    
  });
  export default styles;