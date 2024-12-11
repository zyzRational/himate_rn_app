import * as React from 'react';
import {
  View,
  Text,
  Card,
  Colors,
  Dialog,
  Button,
  PanningProvider,
} from 'react-native-ui-lib';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const BaseDialog = props => {
  const {
    Fun = () => {},
    CancelFun = () => {},
    Visible = false,
    SetVisible = () => {},
    Title = '',
    IsWarning = false,
    MainText = '',
    Body = null,
    IsButton = false,
    Width = '90%',
  } = props;

  return (
    <Dialog
      visible={Visible}
      useSafeArea={true}
      onDismiss={() => SetVisible(false)}
      width={Width}
      panDirection={PanningProvider.Directions.DOWN}>
      <Card flexS padding-16>
        {Title ? (
          <View row>
            <FontAwesome name={'warning'} color={Colors.error} size={22} />
            <Text
              text60
              color={IsWarning ? Colors.error : ''}
              marginB-16
              marginL-8>
              Warning
            </Text>
          </View>
        ) : null}
        <Text text70BL>{MainText}</Text>
        {Body}
        {IsButton ? (
          <View marginT-16 flexS row right>
            <Button
              label={'取消'}
              size={Button.sizes.medium}
              outline={true}
              borderRadius={8}
              marginR-16
              outlineColor={Colors.Primary}
              onPress={() => {
                SetVisible(false);
                CancelFun();
              }}
            />
            <Button
              label={'确认'}
              size={Button.sizes.medium}
              borderRadius={8}
              backgroundColor={Colors.Primary}
              onPress={() => {
                SetVisible(false);
                Fun();
              }}
            />
          </View>
        ) : null}
      </Card>
    </Dialog>
  );
};

export default BaseDialog;
