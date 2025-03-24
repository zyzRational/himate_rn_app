import React from 'react';
import {StyleSheet} from 'react-native';
import {
  Colors,
  TouchableOpacity,
  AnimatedScanner,
  Image,
} from 'react-native-ui-lib';

const ImageMsg = React.memo(props => {
  const {
    Msg = {},
    OnPress = () => {},
    OnLongPress = () => {},
    UploadIds = [],
    NowSendId = null,
    UploadProgress = 0,
  } = props;

  return (
    <TouchableOpacity onPress={OnPress} onLongPress={OnLongPress}>
      <Image style={styles.image} source={{uri: Msg.image}} />
      {UploadIds.includes(Msg._id) ? (
        <AnimatedScanner
          progress={NowSendId === Msg._id ? UploadProgress : 0}
          duration={1200}
          backgroundColor={Colors.black}
          opacity={0.5}
        />
      ) : null}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  image: {
    width: 150,
    height: 100,
    borderRadius: 12,
    margin: 3,
    resizeMode: 'cover',
  },
});

export default ImageMsg;
