class P2P {
  connected = false
  peerConnection
  dataChannel
  myId
  onMessageCallback
  iceServers: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302']

  constructor() {}

  async createPeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection(this.servers);
      this.peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('ICE Candidate:', JSON.stringify(event.candidate));
          // TODO: send this candidate to the other peer via a signaling server
        }
      };

      this.peerConnection.onconnectionstatechange = (event) => {
        console.log("Connection State Change:", this.peerConnection.connectionState);
        if (this.peerConnection.connectionState === 'connected') {
          this.connected = true;
        } else {
          this.connected = false;
        }
      };

      this.peerConnection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel);
      };

      return this.peerConnection;
    } catch (error) {
      console.error(`Error creating peer connection: ${error.message}`);
    }
  }

    // Helper method to set up the datachannel
  setupDataChannel(channel) {
    this.dataChannel = channel;
    this.dataChannel.onmessage = (event) => {
      console.log('Message from Data Channel:', event.data);
      try {
        this.onMessageCallback(JSON.parse(event.data));
      }
      catch(e) {
      this.onMessageCallback(event.data);
    }
  };

  this.dataChannel.onclose = () => {
    this.dataChannel = null;
    this.connected = false;
  };
}

// Creates an offer and sets it as the local description.
async createOffer() {
  const peerConnection = await this.createPeerConnection();
  const channel = peerConnection.createDataChannel('messages');
  this.setupDataChannel(channel);
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log('Offer:', offer);
  return offer;
}

    // Creates an answer to the offer and sets it as the local description.
async createAnswer(offer) {
  const peerConnection = await this.createPeerConnection();
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  console.log('Answer:', answer);
  return answer;
}

// Connects to a peer using the provided offer and answer.
async connect(offer, answer) {
 const peerConnection = this.peerConnection;
 if (!peerConnection) {
  console.error("Peer Connection is not initialized.  Call createOffer or createAnswer first.");
  }
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (error) {
   console.error(`Error setting remote description: ${error.message}`);
  }
}

async setRemoteOffer(offer) {
  const peerConnection = this.peerConnection;
  if (!peerConnection) {
    console.error("Peer Connection is not initialized.  Call createOffer or createAnswer first.");
  }
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
}

async setRemoteAnswer(answer) {
  const peerConnection = this.peerConnection;
  if (!peerConnection) {
    console.error("Peer Connection is not initialized.  Call createOffer or createAnswer first.");
    return;
  }
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }
}

// Sends a message to the connected peer.
sendMessage(message) {
  if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
    console.error("Data channel is not open.  Make sure you are connected to a peer before sending a message.");
    return;
  }
  this.dataChannel.send(message);
}

startSession() {
  this.myId = crypto.randomUUID();
  return this.myId;
}

stopSession() {
  if (this.peerConnection) {
    this.peerConnection.close();
    this.peerConnection = null;
  }
  this.dataChannel = null;
  this.myId = null;
  this.connected = false;
}

isConnected() {
  return this.connected;
}
}