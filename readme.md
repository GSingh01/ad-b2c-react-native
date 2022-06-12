[![codecov](https://img.shields.io/codecov/c/github/GSingh01/ad-b2c-react-native)](https://codecov.io/gh/GSingh01/ad-b2c-react-native)

React Native Azure AD B2C solution using Pure JS. If you are using expo you dont need to eject.

Thanks to https://github.com/sonyarouje/react-native-ad-b2c and https://github.com/wkh237/react-native-azure-ad packages for the inspiration.

Feel free to contribute or sponsor. :)

## Contribute

Create a fork and after cloning locally, do following

1. Yarn install
2. Create packages/b2c-sample/env/config.js with following

```
export default config = {
  authTenant: "<B2CTenantID>",
  authAppId: "<B2CAppID>",
};
```

3. Add your changes to packages/lib
4. Run packages/b2c-sample to do runtime test, by

```
//cmd in root folder

yarn start

//for more options: root -> package.json -> scripts
```

## Installation

> Don't forget to **install peer dependencies** "expo-web-browser": "^10.1.0", "react": "^17.0.1"

```
npm i ad-b2c-react-native -S
```

## API

[View here](/packages/lib/readme.md)
