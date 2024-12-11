import React from 'react';
import {StyleSheet} from 'react-native';
import {View} from 'react-native-ui-lib';
import {WebView} from 'react-native-webview';

const BaseWebView = ({navigation, route}) => {
  const {url} = route.params || {};

  return (
    <View style={styles.webView}>
      <WebView source={{uri: url}} />
    </View>
  );
};
const styles = StyleSheet.create({
  webView: {
    flex: 1,
  },
});

export default BaseWebView;
