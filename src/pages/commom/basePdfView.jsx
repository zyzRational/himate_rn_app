import React from 'react';
import { StyleSheet } from 'react-native';
import { Colors } from 'react-native-ui-lib';
import Pdf from 'react-native-pdf';
import { fullWidth, fullHeight } from '../../styles';
import { useToast } from '../../components/commom/Toast';

const BasePdfView = ({ route }) => {
  const { url } = route.params || {};
  const { showToast } = useToast();

  return (

    <Pdf style={styles.pdfView} source={{ uri: url, cache: true }} trustAllCerts={false} o
      onError={(error) => {
        showToast('加载pdf失败', 'error');
        console.error(error);
      }}
    />

  );
};
const styles = StyleSheet.create({
  pdfView: {
    flex: 1,
    width: fullWidth,
    height: fullHeight,
    backgroundColor: Colors.$backgroundNeutral,
  },
});

export default BasePdfView;
