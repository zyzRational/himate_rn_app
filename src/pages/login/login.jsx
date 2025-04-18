import React, {useState} from 'react';
import {StyleSheet, ActivityIndicator} from 'react-native';
import {
  View,
  TextField,
  Text,
  Button,
  Checkbox,
  Colors,
} from 'react-native-ui-lib';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import {
  AccountuserLogin,
  CodeuserLogin,
  getCodeBymail,
  userRegMail,
} from '../../api/user';
import {useSelector, useDispatch} from 'react-redux';
import {setIsLogin} from '../../stores/store-slice/userStore';
import {useToast} from '../../components/commom/Toast';
import {ValidateMail} from '../../utils/base';
import PasswordEye from '../../components/aboutInput/PasswordEye';
import {displayName as appDisplayName} from '../../../app.json';

const Login = ({navigation}) => {
  const {showToast} = useToast();
  const themeColor = useSelector(state => state.settingStore.themeColor);
  // baseConfig
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);
  /* 验证码倒计时 */
  const [seedflag, setSeedflag] = useState(false);
  const [codetext, setCodetext] = useState('发送验证码');
  let time = 60;
  const addTimer = () => {
    setSeedflag(true);
    const timer = setInterval(() => {
      time -= 1;
      setCodetext(time + 's');
      if (time === 0) {
        clearInterval(timer);
        time = 60;
        setSeedflag(false);
        setCodetext('发送验证码');
      }
    }, 1000);
  };

  /* 发送验证码 */
  const seedCode = async () => {
    if (account === null || account === '') {
      showToast('请输入邮箱！', 'error');
      return;
    }
    if (!emailValidate(account)) {
      return;
    }
    addTimer();
    try {
      const mailRes = await getCodeBymail(account);
      showToast(mailRes.message, mailRes.success ? 'success' : 'error');
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 操作类型
   * 1：账号密码登录
   * 2，注册账号
   * 3，忘记密码（验证码登录）
   */
  const [controlcode, setControlcode] = useState(1);
  const [account, setAccount] = useState(null);
  const [password, setPassword] = useState(null);
  const [repassword, setRepassword] = useState(null);
  const [code, setCode] = useState(null);

  const dispatch = useDispatch();
  /* 保存Token，userId 到redux */
  const saveInfo = userData => {
    dispatch(setIsLogin(userData));
  };

  /* 用户登录 */
  const [Butdisabled, setButdisabled] = useState(false);
  const userLogin = async () => {
    if (!agreeFlag) {
      showToast('请先阅读并同意协议！', 'error');
      return;
    }
    if (controlcode === 1 || controlcode === 2) {
      if (accountValidate(account) && passwordValidate(password)) {
        try {
          setButdisabled(true);
          let res = null;
          if (ValidateMail(account)) {
            res = await AccountuserLogin({account, password});
          } else {
            res = await AccountuserLogin({self_account: account, password});
          }
          if (res.success) {
            saveInfo(res.data);
          }
          showToast(res.message, res.success ? 'success' : 'error');
          setButdisabled(false);
        } catch (error) {
          console.error(error);
          setButdisabled(false);
        }
      }
    }
    if (controlcode === 3) {
      if (emailValidate(account) && codeValidate(code)) {
        try {
          setButdisabled(true);
          const res = await CodeuserLogin({account, code});
          if (res.success) {
            saveInfo(res.data);
          }
          showToast(res.message, res.success ? 'success' : 'error');
          setButdisabled(false);
        } catch (error) {
          console.error(error);
          setButdisabled(false);
        }
      }
    }
  };

  /* 用户注册 */
  const userReg = async () => {
    if (
      emailValidate(account) &&
      codeValidate(code) &&
      passwordValidate(password) &&
      repassValidate(password, repassword)
    ) {
      try {
        setButdisabled(true);
        const regRes = await userRegMail({account, password, code});
        if (regRes.success) {
          const timer = setTimeout(() => {
            userLogin();
            clearTimeout(timer);
          }, 1000);
        }
        showToast(regRes.message, regRes.success ? 'success' : 'error');
        setButdisabled(false);
      } catch (error) {
        console.error(error);
        setButdisabled(false);
      }
    }
  };

  /* 账号校验 */
  const accountValidate = _account => {
    if (!_account) {
      showToast('请输入账号或邮箱！', 'error');
      return false;
    }
    if (_account.length < 6) {
      showToast('请输入正确的账号或邮箱！', 'error');
      return false;
    }
    return true;
  };

  /* 邮箱校验 */
  const emailValidate = mail => {
    if (ValidateMail(mail)) {
      return true;
    }
    showToast('请输入正确的邮箱号！', 'error');
    return false;
  };

  /*  密码校验 */
  const passwordValidate = _password => {
    if (!_password) {
      showToast('请输入密码！', 'error');
      return false;
    }
    if (_password.length < 6) {
      showToast('请输入至少6位密码！', 'error');
      return false;
    }
    return true;
  };

  /* 验证码校验 */
  const codeValidate = _code => {
    if (!_code) {
      showToast('请输入验证码！', 'error');
      return false;
    }
    if (_code.length !== 6) {
      showToast('请输入正确的验证码！', 'error');
      return false;
    }
    return true;
  };

  /* 密码二次确认 */
  const repassValidate = (oldpassword, newpassword) => {
    if (oldpassword !== newpassword) {
      showToast('两次输入的密码不同，请再次确认！', 'warn');
      return false;
    }
    return true;
  };

  // 显示隐藏密码
  const [hideflag, setHideflag] = useState(true);
  const [agreeFlag, setAgreeFlag] = useState(false);

  return (
    <View flexG paddingH-25 paddingT-120 backgroundColor={Colors.white}>
      <View center>
        <View style={[styles.logoBox, {backgroundColor: themeColor}]}>
          <View style={styles.msgBox}>
            <Feather name="message-circle" color={Colors.white} size={84} />
          </View>
          <View style={styles.mouthBox}>
            <Entypo name="dots-two-horizontal" color={Colors.white} size={46} />
          </View>
        </View>
        <Text marginT-12 text40BO>
          {appDisplayName}
        </Text>
      </View>

      <View marginT-20 style={[styles.inputBox, {borderColor: themeColor}]}>
        <FontAwesome name="user-circle-o" color={Colors.grey40} size={20} />
        <TextField
          text70
          style={styles.input}
          placeholder={controlcode === 1 ? '请输入账号/邮箱' : '请输入邮箱'}
          placeholderTextColor={Colors.grey40}
          onChangeText={value => setAccount(value)}
        />
      </View>

      {controlcode !== 1 ? (
        <View marginT-26 style={[styles.inputBox, {borderColor: themeColor}]}>
          <FontAwesome name="key" color={Colors.grey40} size={20} />
          <TextField
            text70
            style={styles.input}
            placeholderTextColor={Colors.grey40}
            placeholder="请输入验证码"
            onChangeText={value => setCode(value)}
          />
          <Button
            style={styles.seedbut}
            size="xSmall"
            link
            disabled={seedflag}
            color={Colors.Primary}
            label={codetext}
            onPress={seedCode}
          />
        </View>
      ) : null}

      {controlcode !== 3 ? (
        <View marginT-26 style={[styles.inputBox, {borderColor: themeColor}]}>
          <FontAwesome name="keyboard-o" color={Colors.grey40} size={20} />
          <TextField
            text70
            style={styles.input}
            placeholderTextColor={Colors.grey40}
            placeholder="请输入密码"
            secureTextEntry={hideflag}
            onChangeText={value => setPassword(value)}
          />
          <PasswordEye Flag={setHideflag} Float={true} right={20} />
        </View>
      ) : null}

      {controlcode === 2 ? (
        <View marginT-26 style={[styles.inputBox, {borderColor: themeColor}]}>
          <FontAwesome name="check-square-o" color={Colors.grey40} size={20} />
          <TextField
            text70
            style={styles.input}
            placeholderTextColor={Colors.grey40}
            placeholder="请再次确认密码"
            onChangeText={value => setRepassword(value)}
            secureTextEntry={true}
          />
        </View>
      ) : null}

      <View marginT-20>
        <View flexG row spread>
          {controlcode === 3 ? (
            <Button
              style={styles.button}
              link
              text80
              grey40
              label="账号登录"
              onPress={() => {
                setControlcode(1);
              }}
            />
          ) : (
            <Button
              style={styles.button}
              link
              text80
              grey30
              label="忘记密码?"
              onPress={() => {
                setControlcode(3);
              }}
            />
          )}

          {controlcode === 2 ? (
            <Button
              style={styles.button}
              link
              text80
              orange30
              label="账号登录"
              onPress={() => {
                setControlcode(1);
              }}
            />
          ) : (
            <Button
              style={styles.button}
              link
              text80
              orange30
              label="注册"
              onPress={() => {
                setControlcode(2);
              }}
            />
          )}
        </View>
        {controlcode !== 2 ? (
          <Button
            marginT-20
            label="登录"
            disabled={Butdisabled}
            backgroundColor={Colors.Primary}
            disabledBackgroundColor={Colors.Primary}
            iconOnRight={true}
            iconSource={
              Butdisabled
                ? () => <ActivityIndicator color={Colors.white} />
                : null
            }
            // iconStyle={{marginLeft: 20}}
            onPress={userLogin}
          />
        ) : (
          <Button
            marginT-20
            label="注册"
            disabled={Butdisabled}
            backgroundColor={Colors.Primary}
            disabledBackgroundColor={Colors.Primary}
            iconOnRight={true}
            iconSource={
              Butdisabled
                ? () => <ActivityIndicator color={Colors.white} />
                : null
            }
            onPress={userReg}
          />
        )}
      </View>
      <View marginT-26 flexS row center>
        <Checkbox
          size={18}
          borderRadius={9}
          color={Colors.Primary}
          label={'已阅读并同意 '}
          labelStyle={styles.label}
          value={agreeFlag}
          onValueChange={value => setAgreeFlag(prv => !prv)}
        />
        <Button
          blue40
          link
          size="small"
          label="用户使用协议"
          onPress={() => {
            navigation.navigate('WebView', {
              title: '用户使用协议',
              url: STATIC_URL + 'user_protocol.html',
            });
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  logoBox: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: Colors.Primary,
  },
  mouthBox: {
    position: 'absolute',
    bottom: 34,
    right: 31,
  },
  msgBox: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  inputBox: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: Colors.Primary,
    padding: 10,
    borderRadius: 12,
    position: 'relative',
  },
  input: {
    padding: 8,
    width: 300,
  },
  seedbut: {
    position: 'absolute',
    right: 16,
  },
  label: {
    color: Colors.grey30,
  },
  button: {
    width: '20%',
  },
});

export default Login;
