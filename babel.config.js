module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // các plugin khác nếu có
    'react-native-reanimated/plugin', // 👈 phải ở cuối cùng
  ],
};
