import React, {useMemo, useCallback} from 'react';
import {StyleSheet, Modal, ImageBackground, FlatList} from 'react-native';
import {useSelector} from 'react-redux';
import {
  View,
  Text,
  Avatar,
  Image,
  Colors,
  TouchableOpacity,
} from 'react-native-ui-lib';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {fullHeight, statusBarHeight} from '../../styles';

const FavoriteModal = React.memo(props => {
  const {
    Visible = false,
    OnClose = () => {},
    BackgroundImg = '',
    Title = '',
    Remark = '',
    CreateAvatar = '',
    CreateName = '',
  } = props;

  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      hardwareAccelerated={true}
      transparent={true}
      visible={Visible}
      onRequestClose={OnClose}>
      <View
        height={fullHeight + statusBarHeight}
        backgroundColor={Colors.hyalineGrey}>
        <ImageBackground
          blurRadius={50}
          style={styles.listBackImage}
          source={{uri: BackgroundImg}}
          resizeMode="cover">
          <TouchableOpacity paddingT-48 paddingL-22 onPress={OnClose}>
            <AntDesign name="close" color={Colors.white} size={24} />
          </TouchableOpacity>
          <View flexS center marginT-20>
            <Image source={{uri: BackgroundImg}} style={styles.image} />
          </View>
          <View row center marginT-20>
            <Avatar
              size={26}
              source={{
                uri: CreateAvatar,
              }}
            />
            <Text text70 marginL-6 white>
              {CreateName}
            </Text>
          </View>
          <View center marginT-20 paddingH-20>
            <Text text60 marginL-6 white>
              {Title}
            </Text>
          </View>
          <View marginT-20 paddingH-20>
            <Text text80 marginL-6 white>
              {Remark}
            </Text>
          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  listBackImage: {
    width: '100%',
    height: fullHeight + statusBarHeight,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  musicBut: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 180,
    height: 180,
    borderRadius: 8,
  },
});

export default FavoriteModal;
