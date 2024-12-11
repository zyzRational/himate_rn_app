import Realm from 'realm';

export class ChatMsg extends Realm.Object {
  static schema = {
    name: 'ChatMsg',
    primaryKey: 'clientMsg_id',
    properties: {
      _id: 'int',
      clientMsg_id: 'string',
      session_id: {type: 'string', indexed: true},
      send_uid: 'int',
      text: 'string',
      chat_type: 'string',
      msg_type: 'string',
      msg_status: 'string',
      createdAt: 'date',
      status: 'string',
    },
  };
}

export class UsersInfo extends Realm.Object {
  static schema = {
    name: 'UsersInfo',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      uid: {type: 'int', indexed: true},
      remark: 'string',
      avatar: 'string',
      session_id: {type: 'string', indexed: true},
      session_name: 'string?',
    },
  };
}

export class MusicInfo extends Realm.Object {
  static schema = {
    name: 'MusicInfo',
    primaryKey: 'id',
    properties: {
      id: 'int',
      file_name: 'string',
      sampleRate: 'int?',
      bitrate: 'int?',
      title: 'string',
      artists: 'string?[]',
      album: 'string?',
      createdAt: 'string',
      updateAt: 'string',
    },
  };
}

export class LocalMusic extends Realm.Object {
  static schema = {
    name: 'LocalMusic',
    primaryKey: 'id',
    properties: {
      id: 'string',
      title: 'string',
      file_name: 'string',
    },
  };
}
