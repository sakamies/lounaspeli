let removeChannel

async function connect() {
  try {
    const dataChannelParams = {ordered: true};
    localConnection = new RTCPeerConnection();
    localConnection.addEventListener('icecandidate', async e => {
      await remoteConnection.addIceCandidate(e.candidate);
    });
    remoteConnection = new RTCPeerConnection();
    remoteConnection.addEventListener('icecandidate', async e => {
      await localConnection.addIceCandidate(e.candidate);
    });

    localChannel = localConnection
        .createDataChannel('messaging-channel', dataChannelParams);
    localChannel.binaryType = 'arraybuffer';
    localChannel.addEventListener('open', () => {
      console.log('Local channel open!');
      this.connected = true;
    });
    localChannel.addEventListener('close', () => {
      console.log('Local channel closed!');
      this.connected = false;
    });
    localChannel.addEventListener('message', onLocalMessageReceived.bind(this));

    remoteConnection.addEventListener('datachannel', onRemoteDataChannel.bind(this));

    const initLocalOffer = async () => {
      const localOffer = await localConnection.createOffer();
      const localDesc = localConnection.setLocalDescription(localOffer);
      const remoteDesc = remoteConnection.setRemoteDescription(localOffer);
      return Promise.all([localDesc, remoteDesc]);
    };

    const initRemoteAnswer = async () => {
      const remoteAnswer = await remoteConnection.createAnswer();
      const localDesc = remoteConnection.setLocalDescription(remoteAnswer);
      const remoteDesc = localConnection.setRemoteDescription(remoteAnswer);
      return Promise.all([localDesc, remoteDesc]);
    };

    await initLocalOffer();
    await initRemoteAnswer();
  } catch (e) {
    console.log(e);
  }
}

function onLocalMessageReceived(event) {
  this.localMessages += event.data + '\n';
}

function onRemoteDataChannel(event) {
  console.log(`onRemoteDataChannel: ${JSON.stringify(event)}`);
  remoteChannel = event.channel;
  remoteChannel.binaryType = 'arraybuffer';
  remoteChannel.addEventListener('message', onRemoteMessageReceived.bind(this));
  remoteChannel.addEventListener('close', () => {
    connected = false;
  });
}

function sendMessage(channel, message) {
  console.log('Send: ', message);
  channel.send(value);
}