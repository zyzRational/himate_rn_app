import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Colors,
  Image,
  Switch,
  LoaderScreen,
  Card,
  TextField,
  Button,
} from 'react-native-ui-lib';
import {StyleSheet, ScrollView} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useToast} from '../../../components/commom/Toast';
import {getFavoritesDetail, updateFavorites} from '../../../api/music';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import BaseSheet from '../../../components/commom/BaseSheet';
import {
  requestCameraPermission,
  requestFolderPermission,
} from '../../../stores/store-slice/permissionStore';
import ImagePicker from 'react-native-image-crop-picker';
import {UploadFile} from '../../../utils/handle/fileHandle';
import {getfileFormdata} from '../../../utils/base';

const EditFavorites = ({navigation, route}) => {
  const {favoritesId} = route.params || {};

  const {showToast} = useToast();
  const dispatch = useDispatch();

  const userId = useSelector(state => state.userStore.userId);
  const accessCamera = useSelector(state => state.permissionStore.accessCamera);
  const accessFolder = useSelector(state => state.permissionStore.accessFolder);

  // baseConfig
  const {THUMBNAIL_URL} = useSelector(
    state => state.baseConfigStore.baseConfig,
  );

  /* 获取收藏夹详情 */
  const [loading, setLoading] = useState(false);
  const [favoritesForm, setFavoritesForm] = useState({});
  const [favoritesName, setFavoritesName] = useState('');
  const [favoritesRemark, setFavoritesRemark] = useState('');
  const [coverUri, setCoverUri] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const getFavorites = async f_id => {
    setLoading(true);
    try {
      const res = await getFavoritesDetail({id: f_id, is_find_music: false});
      if (res.success) {
        setFavoritesForm(res.data);
        const {favorites_name, favorites_remark, favorites_cover, is_public} =
          res.data;
        setFavoritesName(favorites_name);
        setFavoritesRemark(favorites_remark);
        setCoverUri(THUMBNAIL_URL + favorites_cover);
        setIsPublic(is_public === 1);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  /* 编辑收藏夹 */
  const [showDialog, setShowDialog] = useState(false);

  // 是否需要保存
  const [isSave, setIsSave] = useState(false);
  const isNeedSave = value => {
    if (Object.values(favoritesForm).includes(value)) {
      setIsSave(false);
      return false;
    }
    setIsSave(true);
    return true;
  };

  // 提交编辑
  const submitForm = async () => {
    setLoading(true);
    let cover = favoritesForm.favorites_cover;
    try {
      // 修改头像
      if (THUMBNAIL_URL + favoritesForm.favorites_cover !== coverUri) {
        const res = await UploadFile(fileData, () => {}, {
          uid: userId,
          fileType: 'image',
          useType: 'music',
        });
        const upRes = JSON.parse(res.text());
        if (upRes.success) {
          cover = upRes.data.file_name;
        }
        ImagePicker.clean()
          .then(() => {
            console.log('清除缓存的图片成功!');
          })
          .catch(error => {
            console.error(error);
          });
      }
      const updateRes = await updateFavorites({
        id: favoritesForm.id,
        favorites_name: favoritesName,
        favorites_remark: favoritesRemark,
        favorites_cover: cover,
        is_public: isPublic ? 1 : 0,
      });
      showToast(updateRes.message, updateRes.success ? 'success' : 'error');
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // 提交头像 setCoverfile
  const [coverfile, setCoverfile] = useState(null);
  const [fileData, setFileData] = useState(null);

  useEffect(() => {
    if (coverfile) {
      const fileRes = getfileFormdata('music', coverfile);
      setCoverUri(fileRes.uri);
      setFileData(fileRes.file);
      isNeedSave(fileRes.uri);
    }
  }, [coverfile]);

  useEffect(() => {
    if (favoritesId) {
      getFavorites(favoritesId);
    }
  }, [favoritesId]);

  return (
    <ScrollView>
      <View padding-16>
        <Card
          flexS
          left
          row
          center
          padding-16
          onPress={() => setShowDialog(true)}>
          <View flex>
            <Text grey10 text70>
              收藏夹封面
            </Text>
          </View>
          <View marginR-12>
            <Image source={{uri: coverUri}} style={styles.image} />
          </View>
          <FontAwesome name="angle-right" color={Colors.grey50} size={26} />
        </Card>
        <Card marginT-12 padding-16>
          <TextField
            labelColor={Colors.grey10}
            text70
            enableErrors
            placeholder={'收藏夹名称'}
            floatingPlaceholder
            color={Colors.grey10}
            placeholderTextColor={Colors.grey50}
            validate={[value => value.length !== 0]}
            validationMessage={['收藏夹名称不能为空！']}
            maxLength={20}
            showCharCounter
            value={favoritesName}
            validateOnChange={true}
            onChangeText={value => {
              setFavoritesName(value);
              isNeedSave(value);
            }}
          />
          <View marginT-10>
            <TextField
              labelColor={Colors.grey10}
              text70
              enableErrors
              floatingPlaceholder
              placeholder={'收藏夹简介'}
              color={Colors.grey10}
              placeholderTextColor={Colors.grey50}
              multiline
              numberOfLines={3}
              maxLength={1000}
              showCharCounter
              value={favoritesRemark}
              validateOnChange={true}
              onChangeText={value => {
                setFavoritesRemark(value);
                isNeedSave(value);
              }}
            />
          </View>
          <View marginT-10 row centerV>
            <Text grey40>是否公开</Text>
            <View marginL-12>
              <Switch
                onColor={Colors.Primary}
                offColor={Colors.grey50}
                value={isPublic}
                onValueChange={value => {
                  setIsPublic(value);
                  isNeedSave(value);
                }}
              />
            </View>
          </View>
        </Card>
        <Card marginT-16 center backgroundColor={Colors.Primary}>
          <Button
            label={'保存'}
            link
            linkColor={Colors.white}
            style={styles.button}
            disabled={!isSave}
            onPress={() => {
              submitForm();
            }}
          />
        </Card>
      </View>
      <BaseSheet
        Title={'选择收藏夹封面'}
        Visible={showDialog}
        SetVisible={setShowDialog}
        Actions={[
          {
            label: '相机',
            color: Colors.Primary,
            onPress: () => {
              if (!accessCamera) {
                showToast('请授予应用相机使用权限', 'warning');
                dispatch(requestCameraPermission());
                return;
              }
              ImagePicker.openCamera({
                mediaType: 'photo',
                cropperActiveWidgetColor: Colors.Primary,
              })
                .then(image => {
                  setCoverfile(image);
                })
                .finally(() => {
                  setShowDialog(false);
                });
            },
          },
          {
            label: '图库',
            color: Colors.Primary,
            onPress: () => {
              if (!accessFolder) {
                showToast('请授予应用文件和媒体使用权限', 'warning');
                dispatch(requestFolderPermission());
                return;
              }
              ImagePicker.openPicker({
                cropping: true,
                mediaType: 'photo',
                cropperActiveWidgetColor: Colors.Primary,
              })
                .then(image => {
                  setCoverfile(image);
                })
                .finally(() => {
                  setShowDialog(false);
                });
            },
          },
        ]}
      />
      {loading ? (
        <LoaderScreen
          message={'加载中...'}
          color={Colors.Primary}
          backgroundColor={Colors.hyalineWhite}
          overlay={true}
        />
      ) : null}
      <View height={120}/>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  image: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderColor: Colors.white,
    borderWidth: 1,
  },
  button: {
    width: '100%',
    height: 42,
  },
});
export default EditFavorites;
