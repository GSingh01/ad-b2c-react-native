module.exports = {
  setupFiles: ["../../setupJest.js"],
  preset: "react-native",
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  transform: {
    "^.+\\.(ts|js)x?$": "babel-jest",
  },
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(react-clone-referenced-element|@react-native-community|react-navigation|@react-navigation/.*|@unimodules/.*|native-base|react-native-code-push)",
  ],
  roots: ["<rootDir>"],
  testPathIgnorePatterns: ["dist"],
};
