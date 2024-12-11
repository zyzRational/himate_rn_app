import * as React from 'react';
import {ActionSheet, Button, Colors} from 'react-native-ui-lib';
import {StyleSheet} from 'react-native';

const BaseSheet = props => {
  const {
    Visible = false,
    SetVisible = () => {},
    Title = '',
    Message = '',
    Actions = [],
  } = props;

  // [{label: 'Cancel', onPress: () => {}}];
  return (
    <ActionSheet
      dialogStyle={styles.dialogStyle}
      optionsStyle={styles.optionsStyle}
      visible={Visible}
      onDismiss={() => SetVisible(false)}
      title={Title}
      message={Message}
      renderAction={(butProps, index) => (
        <Button
          {...butProps}
          key={index}
          style={[
            styles.buttonStyle,
            {
              borderBottomWidth: index === Actions.length ? 0 : 1,
            },
          ]}
        />
      )}
      cancelButtonIndex={Actions.length + 1}
      options={[
        ...Actions,
        {
          label: '取消',
          color: Colors.grey30,
          onPress: () => SetVisible(false),
        },
      ]}
    />
  );
};
const styles = StyleSheet.create({
  dialogStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  optionsStyle: {
    width: '100%',
    paddingHorizontal: 16,
  },
  buttonStyle: {
    marginTop: 6,
    backgroundColor: Colors.white,
    borderBottomColor: Colors.grey80,
  },
});

export default BaseSheet;
