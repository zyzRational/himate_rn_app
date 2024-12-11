import React, {useEffect, useState} from 'react';
import {View, Text, Card, Colors, Button, Avatar} from 'react-native-ui-lib';
import {useSelector} from 'react-redux';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import QRCode from 'react-native-qrcode-svg';

const BaseQRCode = ({navigation, route}) => {
  //   const {showToast} = useToast();
  const {qrInfo, isMusic} = route.params || {};
  const userInfo = useSelector(state => state.userStore.userInfo);

  // baseConfig
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);

  const [qrCodeInfo, setQrCodeInfo] = useState({});
  useEffect(() => {
    if (qrInfo) {
      setQrCodeInfo(qrInfo);
    } else if (userInfo) {
      setQrCodeInfo({
        value: userInfo.self_account,
        avatar: STATIC_URL + userInfo.user_avatar,
        name: userInfo.user_name,
        account: userInfo.self_account,
        tips: '扫描二维码，加我为好友',
      });
    }
  }, [qrInfo, userInfo]);

  return (
    <View flexG top paddingH-16 paddingT-16>
      <Card flexS centerV enableShadow={false} marginT-32 paddingV-32 center>
        <Avatar
          source={{
            uri: qrCodeInfo?.avatar,
          }}
          size={80}
        />
        <Text text60 marginT-12>
          {qrCodeInfo?.name}
        </Text>
        {qrCodeInfo?.account ? (
          <Text text80 grey30>
            账号: {qrCodeInfo.account}
          </Text>
        ) : null}
        <View marginT-16 center>
          <QRCode
            size={200}
            logo={{uri: qrCodeInfo?.avatar}}
            logoBorderRadius={20}
            logoBackgroundColor="white"
            value={qrCodeInfo?.value}
          />
        </View>
        <Text grey30 marginT-16>
          {qrCodeInfo?.tips}
        </Text>
        {qrCodeInfo?.account && !isMusic ? (
          <View marginT-16 row center>
            <Button
              label="去添加好友"
              link
              color={Colors.Primary}
              size="small"
              onPress={() => {
                navigation.navigate('Addmate');
              }}
            />
            <View marginL-4>
              <FontAwesome
                name="angle-right"
                size={20}
                color={Colors.Primary}
              />
            </View>
          </View>
        ) : null}
      </Card>
    </View>
  );
};

export default BaseQRCode;
