import * as React from 'react';
import { StyleSheet, Modal } from 'react-native';
import { useSelector } from 'react-redux';
import {
    View,
    Text,
    Colors,
    TouchableOpacity,
} from 'react-native-ui-lib';
import AntDesign from 'react-native-vector-icons/AntDesign';
import VideoPlayer from 'react-native-video-player';

const VideoModal = props => {
    const {
        Visible = false,
        OnClose = () => { },
        OnPress = () => { },
        OnError = () => { },
        Uri = '',
    } = props;

    // baseConfig
    const { STATIC_URL } = useSelector(
        state => state.baseConfigStore.baseConfig,
    );
    const isFullScreen = useSelector(state => state.settingStore.isFullScreen);

    return (
        <Modal
            animationType="fade"
            transparent={false}
            visible={Visible}
            onRequestClose={OnClose}>
            {isFullScreen ? null : (
                <View padding-12 row center backgroundColor={Colors.Primary}>
                    <TouchableOpacity
                        style={styles.BackBut}
                        onPress={OnPress}>
                        <AntDesign name="close" size={24} color={Colors.white} />
                    </TouchableOpacity>
                    <View paddingT-4>
                        <Text white text70>视频播放器</Text>
                    </View>
                </View>
            )}
            <View height={'100%'} centerV bg-black>
                <VideoPlayer
                    endWithThumbnail
                    thumbnail={{
                        uri: STATIC_URL + 'default_video_thumbnail.jpg',
                    }}
                    source={{
                        uri: Uri,
                    }}
                    autoplay={true}
                    onError={OnError}
                    showDuration={true}
                /></View>
        </Modal>
    );
};
const styles = StyleSheet.create({
    BackBut: {
        position: 'absolute',
        left: 16,
        top: 12,
    },
});

export default VideoModal;
