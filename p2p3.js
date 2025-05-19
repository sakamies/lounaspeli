class P2P {
    constructor(signalingUrl) {
        this.peerConnection = null;
        this.dataChannel = null;
        this.myId = null;
        this.onMessageCallback = null;
        this.onErrorCallback = null;
        this.connected = false;
        this.signalingUrl = signalingUrl;  // URL of the WebSocket server
        this.signalingSocket = null;
        this.isInitiator = false;
        this.peerId = null; // Store the ID of the connected peer
        this.localDescription = null;
        this.remoteDescription = null;

        this.servers = {
            iceServers: [
                {
                    urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
            },
            ],
        };
    }

    // Generates a unique ID for the user.
    generateId() {
        return crypto.randomUUID();
    }

    // Sets a callback function to handle received messages.
    onMessage(callback) {
        this.onMessageCallback = callback;
    }

    // Sets a callback function to handle errors.
    onError(callback) {
        this.onErrorCallback = callback;
    }

    // Initialize the WebSocket connection to the signaling server.
    async initializeSignaling() {
        if (!this.signalingUrl) {
            this.handleError("Signaling URL is not set.");
            return;
        }

        this.signalingSocket = new WebSocket(this.signalingUrl);

        this.signalingSocket.onopen = () => {
            console.log('Signaling connection opened.');
            //  Register with the server with a unique ID
            this.signalingSocket.send(JSON.stringify({ type: 'register', id: this.myId }));
        };

        this.signalingSocket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            console.log('Received signaling message:', message);

            switch (message.type) {
                case 'offer':
                    this.peerId = message.sender;
                    this.remoteDescription = message.offer;
                    await this.handleOffer(message.offer);
                    break;
                case 'answer':
                    this.remoteDescription = message.answer;
                    await this.handleAnswer(message.answer);
                    break;
                case 'candidate':
                     if (this.peerConnection) {
                        await this.peerConnection.addIceCandidate(message.candidate);
                     }
                    break;
                case 'connected':
                    console.log("connected message", message);
                    this.peerId = message.peerId;
                    break;
                case 'error':
                    this.handleError(`Signaling server error: ${message.message}`);
                    break;
                case 'joined':
                    this.peerId = message.peerId;
                    console.log(`Peer ${this.myId} joined session with peer ${this.peerId}`);
                    break;
                case 'register_ack':
                    console.log("Registered with server.  My ID: ", message.id)
                    this.myId = message.id;
                    break;
                default:
                    console.warn('Unknown signaling message type:', message.type);
            }
        };

        this.signalingSocket.onclose = () => {
            console.log('Signaling connection closed.');
        };

        this.signalingSocket.onerror = (error) => {
            this.handleError(`Signaling socket error: ${error.message}`);
        };
    }

    // Creates the RTCPeerConnection and sets up the data channel.
    async createPeerConnection() {
        try {
            this.peerConnection = new RTCPeerConnection(this.servers);

            this.peerConnection.onicecandidate = async (event) => {
                if (event.candidate) {
                    console.log('ICE Candidate:', JSON.stringify(event.candidate));
                    // Send ICE candidate to the other peer through the signaling server
                    this.signalingSocket.send(JSON.stringify({
                        type: 'candidate',
                        sender: this.myId,
                        recipient: this.peerId,
                        candidate: event.candidate,
                    }));
                }
            };

            this.peerConnection.onconnectionstatechange = (event) => {
                console.log("Connection State Change:", this.peerConnection.connectionState);
                if (this.peerConnection.connectionState === 'connected') {
                    console.log('Peer connected!');
                    this.connected = true;
                     this.signalingSocket.send(JSON.stringify({
                        type: 'connected',
                        sender: this.myId,
                        peerId: this.peerId
                    }));
                } else {
                    this.connected = false;
                }
            };

            this.peerConnection.ondatachannel = (event) => {
                this.setupDataChannel(event.channel);
            };

            return this.peerConnection;
        } catch (error) {
            this.handleError(`Error creating peer connection: ${error.message}`);
            return null;
        }
    }

    // Helper method to set up the datachannel
    setupDataChannel(channel) {
        this.dataChannel = channel;
        this.dataChannel.onmessage = (event) => {
            console.log('Message from Data Channel:', event.data);
            if (this.onMessageCallback) {
                try {
                    this.onMessageCallback(JSON.parse(event.data));
                } catch (e) {
                    this.onMessageCallback(event.data);
                }
            }
        };

        this.dataChannel.onopen = () => {
            console.log('Data Channel Opened');
        };

        this.dataChannel.onclose = () => {
            console.log('Data Channel Closed');
            this.dataChannel = null;
            this.connected = false;
        };
    }

    // Creates an offer and sets it as the local description.
    async createOffer() {
        const pc = await this.createPeerConnection();
        if (!pc) return null;
        this.isInitiator = true;

        const channel = pc.createDataChannel('chatChannel');
        this.setupDataChannel(channel);

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.localDescription = offer;
            console.log('Offer:', offer);
             // Send the offer through the signaling server
            this.signalingSocket.send(JSON.stringify({
                type: 'offer',
                sender: this.myId,
                recipient: this.peerId,
                offer: offer,
            }));
            return offer;
        } catch (error) {
            this.handleError(`Error creating offer: ${error.message}`);
            return null;
        }
    }

    // Creates an answer to the offer and sets it as the local description.
    async createAnswer(offer) {
        const pc = await this.createPeerConnection();
        if (!pc) return null;

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            this.localDescription = answer;
            console.log('Answer:', answer);
             // Send the answer through the signaling server
            this.signalingSocket.send(JSON.stringify({
                type: 'answer',
                sender: this.myId,
                recipient: this.peerId,
                answer: answer,
            }));
            return answer;
        } catch (error) {
            this.handleError(`Error creating answer: ${error.message}`);
            return null;
        }
    }

     async handleOffer(offer) {
        const answer = await this.createAnswer(offer);
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    }

    async handleAnswer(answer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }

    // Connects to a peer using the provided offer and answer.  -- REMOVE THIS
    async connect(offer, answer) {
        const pc = this.peerConnection;
        if (!pc) {
            this.handleError("Peer Connection is not initialized.  Call createOffer or createAnswer first.");
            return;
        }
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            this.handleError(`Error setting remote description: ${error.message}`);
        }
    }



    async setRemoteOffer(offer) {
         const pc = this.peerConnection;
         if (!pc) {
            this.handleError("Peer Connection is not initialized.  Call createOffer or createAnswer first.");
            return;
         }
         try{
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
         }
         catch(error){
            this.handleError(`Error setting remote offer: ${error}`);
         }

    }

    async setRemoteAnswer(answer) {
        const pc = this.peerConnection;
         if (!pc) {
            this.handleError("Peer Connection is not initialized.  Call createOffer or createAnswer first.");
            return;
         }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch(error) {
           this.handleError(`Error setting remote answer: ${error}`);
        }

    }

    // Sends a message to the connected peer.
    sendMessage(message) {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            this.handleError("Data channel is not open.  Make sure you are connected to a peer before sending a message.");
            return;
        }
        this.dataChannel.send(message);
    }

    handleError(message) {
        console.error(message);
        if (this.onErrorCallback) {
            this.onErrorCallback(message);
        }
    }

    startSession() {
        this.myId = this.generateId();
        return this.myId;
    }

    async joinSession(peerId) {
        this.peerId = peerId;
        await this.initializeSignaling(); //start signaling
        const offer = await this.createOffer();
        this.localDescription = offer;

    }

    stopSession() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        if (this.signalingSocket) {
            this.signalingSocket.close();
            this.signalingSocket = null;
        }
        this.dataChannel = null;
        this.myId = null;
        this.connected = false;
        this.isInitiator = false;
        this.peerId = null;
        this.localDescription = null;
        this.remoteDescription = null;
    }

    isConnected() {
        return this.connected;
    }

    //create a link
    createLink() {
        if (!this.myId) {
            this.handleError("Session not started. Call startSession() first.");
            return null;
        }
        return `${window.location.origin}${window.location.pathname}?id=${this.myId}`;
    }

    async handleIncomingLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const peerId = urlParams.get('id');
        if (peerId) {
            this.peerId = peerId;
            await this.initializeSignaling();
            this.signalingSocket.onopen =  async () => {
                 //send a message to the server to join.
                this.signalingSocket.send(JSON.stringify({ type: 'join', sender: this.myId, peerId: this.peerId }));
            }
        }
    }
}