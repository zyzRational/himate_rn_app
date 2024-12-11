import React, {useState} from 'react';
import {View, Button, TextField, Card, Colors, Text} from 'react-native-ui-lib';
import ListItem from '../../../components/commom/ListItem';
import {requestFolderPermission} from '../../../stores/store-slice/permissionStore';
import {useToast} from '../../../components/commom/Toast';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useRealm} from '@realm/react';
import {encryptAES, decryptAES} from '../../../utils/cryptoHandle';
import {useSelector, useDispatch} from 'react-redux';
import BaseDialog from '../../../components/commom/BaseDialog';
import PasswordEye from '../../../components/aboutInput/PasswordEye';
import {writeJSONFile, readJSONFile} from '../../../utils/Download';
import DocumentPicker from 'react-native-document-picker';
import {setLocalMsg} from '../../../utils/chatHandle';

const ChatMsg = ({navigation, route}) => {
  const {session_id} = route.params || {};
  const {showToast} = useToast();
  const realm = useRealm();
  const dispatch = useDispatch();
  const userInfo = useSelector(state => state.userStore.userInfo);
  const accessFolder = useSelector(state => state.permissionStore.accessFolder);

  const [hideflag, setHideflag] = useState(true);
  const [inputVisible, setInputVisible] = useState(false);
  const [msgSecret, setMsgSecret] = useState('');

  /* 导出聊天记录 */
  const [handlerType, setHandlerType] = useState('export');
  const exportChatMsgText = async () => {
    let localMsgs = realm.objects('ChatMsg');
    if (session_id) {
      localMsgs = localMsgs.filtered('session_id == $0', session_id);
    }
    const newlist = localMsgs.toJSON();
    const exportData = encryptAES(newlist, msgSecret + userInfo?.id);
    // console.log(exportData);
    const writeRes = await writeJSONFile(
      exportData,
      `chatHistory_${Date.now()}.json`,
    );
    if (writeRes) {
      showToast('导出聊天记录成功！', 'success');
    } else {
      showToast('导出聊天记录失败！', 'error');
    }
  };

  /* 选择文件 */
  const [importFile, setImportFile] = useState([]);
  const selectFile = async () => {
    DocumentPicker.pick({
      type: [DocumentPicker.types.json],
      allowMultiSelection: true,
    })
      .then(JSONfiles => {
        setImportFile(JSONfiles);
        setInputVisible(true);
        // console.log('文件:', JSONfiles);
      })
      .finally();
  };

  /* 导入聊天记录 */
  const importChatMsgText = async () => {
    let successCount = 0;
    for (let i = 0; i < importFile.length; i++) {
      const magData = await readJSONFile(importFile[i].uri);
      if (!magData?.encryptedData && !magData?.iv) {
        showToast('请选择正确的聊天记录文件！', 'error');
        continue;
      }
      const msgList = decryptAES(
        magData.encryptedData,
        magData.iv,
        msgSecret + userInfo?.id,
      );
      if (!msgList) {
        showToast('聊天记录密钥错误！', 'error');
        continue;
      }
      setLocalMsg(realm, msgList);
      successCount += 1;
    }
    if (successCount > 0) {
      showToast(`成功导入${successCount}个聊天记录`, 'success');
    }
  };

  /* 清空聊天记录 */
  const [clearMsgVisible, setClearMsgVisible] = useState(false);
  const clearChatMsg = () => {
    const toDelete = realm.objects('ChatMsg');
    realm.write(() => {
      realm.delete(toDelete);
      showToast('您已清除所有聊天记录！', 'success');
    });
  };

  return (
    <>
      <View flexG paddingH-16 paddingT-18>
        <View marginB-16 flexS center>
          <Text text90L grey30>
            <FontAwesome
              name="exclamation-circle"
              color={Colors.red30}
              size={14}
            />
            &nbsp;请务必牢记您的聊天记录密钥，否则将无法导入!
          </Text>
        </View>
        <Card enableShadow={false}>
          <View>
            <ListItem
              ItemName={session_id ? '导出聊天记录' : '导出所有聊天记录'}
              IconName={'download'}
              IconColor={Colors.grey10}
              IconSize={20}
              RightText={'一键导出'}
              Fun={() => {
                if (!accessFolder) {
                  showToast('请授予应用文件和媒体使用权限', 'warning');
                  dispatch(requestFolderPermission());
                  return;
                }
                setHandlerType('export');
                setInputVisible(true);
              }}
            />
            <View paddingH-16 paddingB-16>
              <Text grey30 text90L>
                温馨提示：只能导出文字类型的聊天记录！
              </Text>
            </View>
          </View>
          {!session_id ? (
            <View>
              <ListItem
                ItemName={'导入聊天记录'}
                IconName={'upload'}
                IconColor={Colors.grey10}
                IconSize={20}
                RightText={'选择导入'}
                Fun={() => {
                  if (!accessFolder) {
                    showToast('请授予应用文件和媒体使用权限', 'warning');
                    dispatch(requestFolderPermission());
                    return;
                  }
                  setHandlerType('import');
                  selectFile();
                }}
              />
              <View paddingH-16 paddingB-16>
                <Text grey30 text90L>
                  请选择本应用导出的标准格式的聊天记录文件进行导入，如果该聊天记录文件非本人的群聊或好友间的聊天记录，则无法正常显示！
                </Text>
              </View>
            </View>
          ) : null}
        </Card>
        {!session_id ? (
          <Card
            flexS
            center
            marginT-16
            enableShadow={false}
            padding-8
            onPress={() => setClearMsgVisible(true)}>
            <Button link text70 red30 label="清除所有聊天记录" />
          </Card>
        ) : null}
      </View>
      <BaseDialog
        IsButton={true}
        Fun={handlerType === 'export' ? exportChatMsgText : importChatMsgText}
        Visible={inputVisible}
        SetVisible={setInputVisible}
        MainText={'聊天记录密钥'}
        Body={
          <View>
            <TextField
              marginT-8
              placeholder={'请输入聊天记录密钥'}
              text70L
              floatingPlaceholder
              secureTextEntry={hideflag}
              onChangeText={value => {
                setMsgSecret(value);
              }}
              maxLength={10}
              showCharCounter={true}
            />
            <PasswordEye Flag={setHideflag} Float={true} right={0} top={30} />
          </View>
        }
      />
      <BaseDialog
        IsWarning={true}
        Title={true}
        IsButton={true}
        Fun={clearChatMsg}
        Visible={clearMsgVisible}
        SetVisible={setClearMsgVisible}
        MainText={'您确定要清除所有聊天记录吗？'}
      />
    </>
  );
};
export default ChatMsg;
