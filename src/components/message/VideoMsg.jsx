import React, {useEffect, useState} from 'react';
import {StyleSheet, ActivityIndicator} from 'react-native';
import {
  View,
  Colors,
  Text,
  TouchableOpacity,
  AnimatedScanner,
  Image,
} from 'react-native-ui-lib';
import {createVideoThumbnail} from 'react-native-compressor';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Video from 'react-native-video';
import {formatSeconds} from '../../utils/base';

const VideoMsg = props => {
  const {
    Msg = '',
    OnPress = () => {},
    OnLongPress = () => {},
    UploadIds = [],
    NowSendId = null,
    UploadProgress = 0,
  } = props;

  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoLoading, setVideoLoading] = useState(true);

  useEffect(() => {
    if (Msg?.video) {
      createVideoThumbnail(Msg?.video)
        .then(res => {
          setVideoLoading(false);
          setVideoThumbnail(res.path);
        })
        .catch(error => {
          setVideoLoading(false);
          console.log(error);
        });
    }
  }, [Msg]);

  return (
    <View>
      <Video
        source={{uri: Msg?.video}}
        paused={true}
        onLoad={e => {
          // console.log('onLoad', e.duration);
          setVideoDuration(e.duration);
        }}
      />
      <Image
        key={videoThumbnail}
        style={styles.video}
        source={{uri: videoThumbnail}}
        resizeMode="cover"
      />
      {videoLoading ? (
        <View style={styles.videoControl}>
          <ActivityIndicator color={Colors.white} />
          <Text text90L white marginT-4>
            视频加载中...
          </Text>
        </View>
      ) : videoThumbnail ? (
        <TouchableOpacity
          style={styles.videoControl}
          onLongPress={OnLongPress}
          onPress={OnPress}>
          <AntDesign name="playcircleo" color={Colors.white} size={32} />
          <Text style={styles.videoTime}>{formatSeconds(videoDuration)}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.videoControl}>
          <Text text90L white>
            视频加载失败
          </Text>
        </View>
      )}
      {UploadIds.includes(Msg._id) ? (
        <AnimatedScanner
          progress={NowSendId === Msg._id ? UploadProgress : 0}
          duration={1200}
          backgroundColor={Colors.black}
          opacity={0.5}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  video: {
    width: 150,
    height: 100,
    borderRadius: 12,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  videoControl: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    borderRadius: 12,
  },
  videoTime: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    color: Colors.white,
    fontSize: 12,
  },
});

export default VideoMsg;
