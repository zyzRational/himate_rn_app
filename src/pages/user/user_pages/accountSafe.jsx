import React, {useEffect, useState} from 'react';
import {StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {
  View,
  Text,
  Card,
  Colors,
  TextField,
  Button,
  LoaderScreen,
} from 'react-native-ui-lib';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useToast} from '../../../components/commom/Toast';
import PasswordEye from '../../../components/aboutInput/PasswordEye';
import {
  getUserdetail,
  EditUserInfo,
  mailValidate,
  getCodeBymail,
  userLogOff,
} from '../../../api/user';
import {useDispatch} from 'react-redux';
import {setUserInfo as setUserData} from '../../../stores/store-slice/userStore';
import {ValidateMail} from '../../../utils/base';
import BaseDialog from '../../../components/commom/BaseDialog';
import {clearStorage} from '../../../utils/Storage';
import {clearUserStore} from '../../../stores/store-slice/userStore';

let timer = {};
const Edituser = ({navigation, route}) => {
  const {userId} = route.params;

  const {showToast} = useToast();
  const [userInfo, setUserInfo] = useState({});
  const [usermail, setUsermail] = useState(null);
  const [code, setCode] = useState(null);
  const [oldpassword, setOldpassword] = useState(null);
  const [newpassword, setNewpassword] = useState(null);

  const dispatch = useDispatch();
  // 初始化数据
  const dataInit = async () => {
    setRefreshing(true);
    try {
      const res = await getUserdetail({id: userId});
      // console.log(res);
      if (res.success) {
        const {account} = res.data;
        setUserInfo({account});
        dispatch(setUserData(userId));
        setUsermail(account);
        setRefreshing(false);
      }
    } catch (error) {
      console.error(error);
      setRefreshing(false);
    }
  };
  // 是否需要保存
  const isNeedSave = value => {
    if (Object.values(userInfo).includes(value)) {
      return true;
    }
    return false;
  };

  // 保存修改
  const [mailshow, setMailshow] = useState(false);
  const [passwordshow, setPasswordshow] = useState(false);

  // 发送验证码
  const [codeTime, setCodeTime] = useState(60);
  let sendtime = 60;
  const sendCode = async () => {
    try {
      if (codeTime === 60) {
        timer = setInterval(() => {
          sendtime -= 1;
          setCodeTime(sendtime);
          if (sendtime === 0) {
            sendtime = 60;
            setCodeTime(sendtime);
            clearInterval(timer);
          }
        }, 1000);
        const mailRes = await getCodeBymail(userInfo?.account);
        if (mailRes.success) {
          showToast('已向您发送验证码', 'success');
        } else {
          showToast(mailRes.message, 'error');
        }
      } else {
        showToast('请勿重复操作', 'warning');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 提交修改
  const [uploading, setUploading] = useState(false);
  const submitData = async value => {
    const trueKey = Object.keys(value)[0];
    const trueValue = Object.values(value)[0];
    if (trueValue === null || trueValue === '') {
      showToast('请输入要修改的内容！', 'error');
      return;
    }
    if (trueKey === 'account' && !ValidateMail(trueValue)) {
      showToast('请输入正确的邮箱号', 'error');
      return;
    }
    if (trueKey === 'password' && trueValue.length < 6) {
      showToast('请输入至少六位密码', 'error');
      return;
    }
    value.id = userId;
    try {
      setUploading(true);
      if (trueKey === 'account') {
        const validateRes = await mailValidate({
          account: userInfo?.account,
          code,
        });
        showToast(
          validateRes.message,
          validateRes.success ? 'success' : 'error',
        );
        if (!validateRes.success) {
          setUploading(false);
          return;
        }
      }
      if (trueKey === 'password') {
        value.oldpassword = oldpassword;
      }
      const res = await EditUserInfo(value);
      if (res.success) {
        dataInit();
        if (trueKey === 'account') {
          setMailshow(false);
          setShowCodeDialog(false);
          setCode(null);
        }
        if (trueKey === 'password') {
          setPasswordshow(false);
          setShowPassDialog(false);
          setNewpassword(null);
          setOldpassword(null);
        }
      }
      showToast(res.message, res.success ? 'success' : 'error');
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // 刷新页面
  const [refreshing, setRefreshing] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [showPassDialog, setShowPassDialog] = useState(false);

  // 下划线
  const rederLine = () => {
    const arr = [1, 2, 3, 4, 5, 6];
    return arr.map(item => {
      return <View key={item} style={styles.codeboxline} />;
    });
  };

  // 显示隐藏密码
  const [hideflag, setHideflag] = useState(true);
  const [hideflagold, setHideflagold] = useState(true);

  // 退出登录
  const [showLoginOut, setShowLoginOut] = useState(false);
  const loginOut = () => {
    dispatch(clearUserStore());
    clearStorage();
    showToast('您已退出登录！', 'success');
  };

  // 注销账号
  const [showLogOff, setShowLogOff] = useState(false);
  const logOff = async () => {
    try {
      const res = await userLogOff({ids: [userId]});
      if (res.success) {
        dispatch(clearUserStore());
        clearStorage();
        showToast('您已注销账号！', 'success');
      }
    } catch (error) {
      console.error(error);
      showToast('注销账号失败！', 'error');
    }
  };

  useEffect(() => {
    dataInit();
  }, []);

  return (
    <>
      <ScrollView
        refreshControl={
          <RefreshControl
            colors={[Colors.Primary]}
            refreshing={refreshing}
            onRefresh={dataInit}
          />
        }>
        <View flexG paddingH-16 paddingT-16>
          <View marginB-16 flexG center>
            <Text text90L grey30>
              <FontAwesome
                name="exclamation-circle"
                color={Colors.yellow40}
                size={14}
              />
              &nbsp;更换邮箱时请先确保新邮箱为可用状态!
            </Text>
          </View>
          <Card flexS padding-16>
            <View flexG row spread centerV style={styles.inputLine}>
              <TextField
                label={'绑定邮箱'}
                labelColor={Colors.grey40}
                text70
                enableErrors={mailshow}
                style={styles.input}
                placeholder={'请输入新邮箱'}
                placeholderTextColor={Colors.grey50}
                validate={[
                  value => value.length !== 0,
                  value => ValidateMail(value),
                ]}
                validationMessage={['账号不能为空！', '请输入正确的邮箱号']}
                value={usermail}
                validateOnChange={true}
                onChangeText={value => {
                  setUsermail(value);
                  setMailshow(!isNeedSave(value));
                }}
                onBlur={() => {
                  setMailshow(!isNeedSave(usermail));
                }}
              />
              <View marginB-20 style={{display: mailshow ? 'flex' : 'none'}}>
                <Button
                  label={'保存'}
                  size={Button.sizes.small}
                  borderRadius={8}
                  backgroundColor={Colors.Primary}
                  onPress={() => {
                    setShowCodeDialog(true);
                    sendCode();
                  }}
                />
              </View>
            </View>
            <View flexG row spread centerV marginT-16>
              <TextField
                label={'新密码'}
                labelColor={Colors.grey40}
                text70
                enableErrors={passwordshow}
                style={styles.input}
                placeholder={'请输入新密码'}
                placeholderTextColor={Colors.grey50}
                validate={[selfaccount => selfaccount.length > 5]}
                validationMessage={['请至少输入六位密码！']}
                validateOnChange={true}
                value={newpassword}
                secureTextEntry={hideflag}
                onChangeText={value => {
                  setNewpassword(value);
                  setPasswordshow(true);
                }}
                // onBlur={() => {
                //   setTimeout(() => {
                //     setPasswordshow(false);
                //   }, 1000);
                // }}
              />
              <PasswordEye Flag={setHideflag} />
              <View style={{display: passwordshow ? 'flex' : 'none'}}>
                <Button
                  label={'保存'}
                  size={Button.sizes.small}
                  borderRadius={8}
                  backgroundColor={Colors.Primary}
                  onPress={() => {
                    setShowPassDialog(true);
                  }}
                />
              </View>
            </View>
          </Card>

          <Card
            flexS
            center
            marginT-16
            enableShadow={false}
            padding-8
            bg-red40
            onPress={() => setShowLogOff(true)}>
            <Button link text70 red30 label="注销账号" />
          </Card>
          <Card
            flexS
            center
            marginT-16
            enableShadow={false}
            padding-8
            onPress={() => setShowLoginOut(true)}>
            <Button link text70 orange40 label="退出登录" />
          </Card>
        </View>
      </ScrollView>
      <BaseDialog
        IsButton={true}
        Fun={() => {
          submitData({account: usermail});
        }}
        CancelFun={() => {
          setUploading(false);
        }}
        Visible={showCodeDialog}
        SetVisible={setShowCodeDialog}
        MainText={'修改邮箱'}
        Body={
          <>
            <View>
              <TextField
                style={{letterSpacing: 34}}
                label={'验证码'}
                text40
                value={code}
                onChangeText={value => {
                  if (value.length > 6) {
                    return;
                  }
                  setCode(value);
                }}
              />
            </View>
            <View flexS row spread paddingH-8>
              {rederLine()}
            </View>
          </>
        }
      />
      <BaseDialog
        IsButton={true}
        Fun={() => {
          submitData({password: newpassword});
        }}
        CancelFun={() => {
          setUploading(false);
        }}
        Visible={showPassDialog}
        SetVisible={setShowPassDialog}
        MainText={'修改密码'}
        Body={
          <View style={styles.inputLine}>
            <View>
              <TextField
                label={'旧密码'}
                text70
                style={styles.input}
                value={oldpassword}
                secureTextEntry={hideflagold}
                onChangeText={value => {
                  setOldpassword(value);
                }}
              />
              <PasswordEye
                Flag={setHideflagold}
                Float={true}
                right={20}
                bottom={6}
              />
            </View>
          </View>
        }
      />
      <BaseDialog
        IsWarning={true}
        Title={true}
        IsButton={true}
        Fun={loginOut}
        Visible={showLoginOut}
        SetVisible={setShowLoginOut}
        MainText={'您确定要退出登录吗？'}
      />
      <BaseDialog
        IsWarning={true}
        Title={true}
        IsButton={true}
        Fun={logOff}
        Visible={showLogOff}
        SetVisible={setShowLogOff}
        MainText={'您确定要注销账号吗？'}
      />
      {uploading ? (
        <LoaderScreen
          message={'修改中...'}
          color={Colors.Primary}
          backgroundColor={Colors.hyalineWhite}
          overlay={true}
        />
      ) : null}
    </>
  );
};
const styles = StyleSheet.create({
  image: {width: 60, height: 60, borderRadius: 8, marginRight: 12},
  input: {
    width: 200,
  },
  inputLine: {
    borderBottomColor: Colors.grey60,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  codeboxline: {
    width: 40,
    borderBottomColor: Colors.grey50,
    borderBottomWidth: 1,
  },
});
export default Edituser;
