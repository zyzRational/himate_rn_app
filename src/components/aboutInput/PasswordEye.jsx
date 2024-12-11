import * as React from 'react';
import {TouchableOpacity, Colors} from 'react-native-ui-lib';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const PasswordEye = props => {
  const {Flag: setParentflag, Float: isfloat, top, bottom, left, right} = props;

  /* 显示隐藏密码 */
  const [hideflag, setHideflag] = React.useState(true);
  const hideandshowPass = () => {
    if (hideflag) {
      setHideflag(false);
      setParentflag(false);
    } else {
      setHideflag(true);
      setParentflag(true);
    }
  };
  return (
    <TouchableOpacity
      style={
        isfloat
          ? {
              position: 'absolute',
              right,
              bottom,
              top,
              left,
            }
          : null
      }
      onPress={hideandshowPass}>
      {hideflag ? (
        <FontAwesome name="eye-slash" color={Colors.grey40} size={20} />
      ) : (
        <FontAwesome name="eye" color={Colors.grey40} size={20} />
      )}
    </TouchableOpacity>
  );
};
export default PasswordEye;
