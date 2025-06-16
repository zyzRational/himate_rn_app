import React from 'react';
import {StyleSheet} from 'react-native';
import {View} from 'react-native-ui-lib';
import {WebView} from 'react-native-webview';
import {useSelector} from 'react-redux';

const BaseWebView = ({navigation, route}) => {
  const {url} = route.params || {};
  // baseConfig
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);

  return (
    <View style={styles.webView}>
      <WebView source={{uri: url ?? STATIC_URL + 'default_assets/index.html'}} />
    </View>
  );
};
const styles = StyleSheet.create({
  webView: {
    flex: 1,
  },
});

export default BaseWebView;
