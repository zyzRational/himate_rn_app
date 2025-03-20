import * as React from 'react';
import { Modal, ActivityIndicator } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import ImageViewer from 'react-native-image-zoom-viewer';
import { fullWidth } from '../../styles';

const ImgModal = props => {
    const {
        Visible = false,
        OnClose = () => { },
        OnSave = () => { },
        IsSave = false,
        Uri = '',
    } = props;
    return (
        <Modal visible={Visible} animationType="fade" transparent={true}>
            <ImageViewer
                imageUrls={[{ url: Uri }]}
                onClick={OnClose}
                menuContext={{
                    saveToLocal: IsSave ? '保存到相册' : '退出预览',
                    cancel: '取消',
                }}
                onSave={OnSave}
                loadingRender={() => (
                    <View flex center>
                        <ActivityIndicator color="white" size="large" />
                        <Text center grey70 text90 marginT-8>
                            图片加载中...
                        </Text>
                    </View>
                )}
                renderFooter={() => (
                    <View flex center row padding-16 width={fullWidth}>
                        <Text center grey70 text90>
                            单击退出预览
                            {IsSave ? '，长按保存图片' : ''}
                        </Text>
                    </View>
                )}
            />
        </Modal>
    );
};

export default ImgModal;
