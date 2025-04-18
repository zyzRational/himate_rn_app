import React, {createContext, useContext, useState, useEffect} from 'react';
import {io} from 'socket.io-client';
import {useDispatch, useSelector} from 'react-redux';
import {setSocketState} from '../stores/store-slice/chatMsgStore';
import {isEmptyObject} from './base';

export const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

let timer = null;

const SocketProvider = props => {
  const {children} = props;
  const userId = useSelector(state => state.userStore.userId);
  const userToken = useSelector(state => state.userStore.userToken);
  const socketReady = useSelector(state => state.chatMsgStore.socketReady);
  // baseConfig
  const baseConfig = useSelector(state => state.baseConfigStore.baseConfig);

  const dispatch = useDispatch();
  const [socket, setSocket] = useState({});
  const socketInit = (socketUrl, Token) => {
    const Socket = io(socketUrl, {
      auth: {
        Authorization: Token,
      },
    });

    /*  监听连接 */
    Socket?.on('connect', () => {
      setSocket(Socket);
      clearInterval(timer);
      console.log('soket已连接', Socket.id);
      dispatch(setSocketState(true));
      Socket.emit(
        'message',
        {
          type: 'init',
          data: {
            uid: userId,
            clientId: Socket.id,
          },
        },
        response => {
          // console.log('发送状态', response.status); // ok
        },
      );
    });
    /* 断线重连 */
    Socket?.on('connect_error', res => {
      console.log('Socket error', res);
      dispatch(setSocketState(false));
      timer = setInterval(() => {
        Socket.connect();
      }, 5000);
    });
  };

  useEffect(() => {
    if (userToken && baseConfig?.SOCKET_URL && !socketReady) {
      socketInit(baseConfig?.SOCKET_URL, userToken);
    }
  }, [userToken, baseConfig?.SOCKET_URL]);

  return (
    <SocketContext.Provider value={{socket}}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
