// Heygen Interactive Avatar Integration - V2 with Voice Chat
// Based on official Interactive Avatar demo pattern

import StreamingAvatar, {
  AvatarQuality,
  VoiceEmotion,
  StreamingEvents,
  TaskType,
  TaskMode,
  StartAvatarRequest,
  VoiceChatTransport,
  STTProvider,
  ElevenLabsModel
} from '@heygen/streaming-avatar';

class HeygenInteractiveAvatarManager {
  constructor() {
    this.avatar = null;
    this.sessionData = null;
    this.isInitialized = false;
    this.isConnected = false;
    this.mediaStream = null;
    this.isVoiceChatActive = false;
    this.isMuted = true;
    this.isVoiceChatLoading = false;

    // Default configuration for interactive avatar
    this.defaultConfig = {
      quality: AvatarQuality.Medium,
      avatarName: process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID || 'Santa_Fireplace_Front_public',
      voice: {
        rate: 1.0,
        emotion: VoiceEmotion.FRIENDLY,
        model: ElevenLabsModel.eleven_flash_v2_5
      },
      language: 'en',
      voiceChatTransport: VoiceChatTransport.WEBSOCKET,
      sttSettings: {
        provider: STTProvider.DEEPGRAM,
      },
      disableIdleTimeout: true
    };
  }

  // Get access token (adapted from demo pattern)
  async fetchAccessToken() {
    try {
      // For now, use the API key directly (you might want to create a token endpoint)
      if (!process.env.NEXT_PUBLIC_HEYGEN_API_KEY) {
        throw new Error('NEXT_PUBLIC_HEYGEN_API_KEY is required');
      }
      return process.env.NEXT_PUBLIC_HEYGEN_API_KEY;
    } catch (error) {
      console.error('Error fetching access token:', error);
      throw error;
    }
  }

  // Initialize avatar instance (demo pattern)
  async initAvatar(token) {
    try {
      // console.log('Initializing Heygen interactive avatar...');

      this.avatar = new StreamingAvatar({
        token: token || await this.fetchAccessToken()
      });

      this.setupEventListeners();
      this.isInitialized = true;

      // console.log('Heygen interactive avatar initialized successfully');
      return this.avatar;

    } catch (error) {
      console.error('Error initializing Heygen avatar:', error);
      throw error;
    }
  }

  // Set up comprehensive event listeners (from demo)
  setupEventListeners() {
    if (!this.avatar) return;

    // Avatar talking events
    this.avatar.on(StreamingEvents.AVATAR_START_TALKING, (event) => {
      // console.log('Avatar started talking:', event);
    });

    this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (event) => {
      // console.log('Avatar stopped talking:', event);
    });

    this.avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
      // console.log('Avatar talking message:', event);
    });

    this.avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
      // console.log('Avatar end message:', event);
    });

    // Stream connection events
    this.avatar.on(StreamingEvents.STREAM_READY, (event) => {
      // console.log('Avatar stream ready:', event);
      this.isConnected = true;
      this.mediaStream = this.avatar.mediaStream;
    });

    this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, (event) => {
      // console.log('Avatar stream disconnected:', event);
      this.isConnected = false;
      this.mediaStream = null;
      this.isVoiceChatActive = false;
    });

    // User speech events (for voice chat)
    this.avatar.on(StreamingEvents.USER_START, (event) => {
      // console.log('User started speaking:', event);
    });

    this.avatar.on(StreamingEvents.USER_STOP, (event) => {
      // console.log('User stopped speaking:', event);
    });

    this.avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
      // console.log('User talking message:', event);
    });

    this.avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
      // console.log('User end message:', event);
    });
  }

  // Start avatar session (demo pattern)
  async startAvatar(config = this.defaultConfig) {
    try {
      if (!this.isInitialized || !this.avatar) {
        throw new Error('Avatar not initialized. Call initAvatar() first.');
      }

      // console.log('Starting interactive avatar session...');

      const sessionInfo = await this.avatar.createStartAvatar(config);
      this.sessionData = sessionInfo;

      // console.log('Interactive avatar session started successfully');
      // console.log('Session ID:', sessionInfo?.session_id);

      return sessionInfo;

    } catch (error) {
      console.error('Error starting avatar session:', error);
      throw error;
    }
  }

  // Stop avatar session
  async stopAvatar() {
    try {
      if (this.isVoiceChatActive) {
        this.closeVoiceChat();
      }

      if (this.avatar && this.sessionData) {
        // console.log('Stopping avatar session...');
        await this.avatar.stopAvatar();
        this.sessionData = null;
        this.isConnected = false;
        this.mediaStream = null;
        // console.log('Avatar session stopped');
      }
    } catch (error) {
      console.error('Error stopping avatar session:', error);
      throw error;
    }
  }

  // Voice chat functions (from demo)
  async startVoiceChat(isInputAudioMuted = false) {
    try {
      if (!this.avatar || !this.isConnected) {
        throw new Error('Avatar not connected. Start avatar session first.');
      }

      // console.log('Starting voice chat...');
      this.isVoiceChatLoading = true;

      await this.avatar.startVoiceChat({
        isInputAudioMuted
      });

      this.isVoiceChatLoading = false;
      this.isVoiceChatActive = true;
      this.isMuted = isInputAudioMuted;

      // console.log('Voice chat started successfully');

    } catch (error) {
      console.error('Error starting voice chat:', error);
      this.isVoiceChatLoading = false;
      throw error;
    }
  }

  closeVoiceChat() {
    try {
      if (this.avatar && this.isVoiceChatActive) {
        // console.log('Closing voice chat...');
        this.avatar.closeVoiceChat();
        this.isVoiceChatActive = false;
        this.isMuted = true;
        // console.log('Voice chat closed');
      }
    } catch (error) {
      console.error('Error closing voice chat:', error);
    }
  }

  muteInputAudio() {
    try {
      if (this.avatar && this.isVoiceChatActive) {
        this.avatar.muteInputAudio();
        this.isMuted = true;
        // console.log('Input audio muted');
      }
    } catch (error) {
      console.error('Error muting input audio:', error);
    }
  }

  unmuteInputAudio() {
    try {
      if (this.avatar && this.isVoiceChatActive) {
        this.avatar.unmuteInputAudio();
        this.isMuted = false;
        // console.log('Input audio unmuted');
      }
    } catch (error) {
      console.error('Error unmuting input audio:', error);
    }
  }

  // Text-to-speech (for coaching delivery)
  async speak(text, options = {}) {
    try {
      if (!this.isConnected || !this.avatar) {
        throw new Error('Avatar is not connected');
      }

      // console.log('Avatar speaking:', text.substring(0, 100) + '...');

      const speakOptions = {
        text: text,
        task_type: TaskType.TALK,
        taskMode: TaskMode.SYNC,
        ...options
      };

      await this.avatar.speak(speakOptions);
      // console.log('Speech delivery completed');

    } catch (error) {
      console.error('Error with avatar speech:', error);
      throw error;
    }
  }

  // Complete session management for coaching (maintains existing API)
  async startSession() {
    const token = await this.fetchAccessToken();
    await this.initAvatar(token);
    const session = await this.startAvatar();
    return session;
  }

  async endSession() {
    await this.stopAvatar();
  }

  // Coaching delivery (maintains existing API)
  async deliverCoaching(coachingScript, options = {}) {
    await this.speak(coachingScript, options);
  }

  async startInteractiveCoaching(coachingSession) {
    try {
      if (!this.isConnected) {
        await this.startSession();
      }

      const { feedback } = coachingSession;
      const coachingScript = this.generateCoachingScript(feedback);

      // Start with text delivery
      await this.deliverCoaching(coachingScript);

      // Optionally enable voice chat for Q&A
      await this.startVoiceChat();

      return {
        success: true,
        sessionId: coachingSession.id,
        message: 'Interactive coaching session started with voice chat enabled'
      };

    } catch (error) {
      console.error('Error starting interactive coaching:', error);
      throw error;
    }
  }

  // Generate coaching script (unchanged)
  generateCoachingScript(feedback) {
    let script = '';

    script += 'Hello! I have reviewed your recent call and have some coaching feedback for you. ';

    if (feedback.strengths && feedback.strengths.length > 0) {
      script += 'First, let me highlight what you did well: ';
      script += feedback.strengths.slice(0, 2).join(', ') + '. ';
    }

    if (feedback.improvements && feedback.improvements.length > 0) {
      script += 'For areas of improvement, I noticed: ';
      script += feedback.improvements.slice(0, 2).join(', ') + '. ';
    }

    if (feedback.suggestions && feedback.suggestions.length > 0) {
      script += 'Here are some specific suggestions: ';
      script += feedback.suggestions.slice(0, 2).join(', ') + '. ';
    }

    if (feedback.avatarScript) {
      script = feedback.avatarScript;
    }

    script += ' I am now ready to answer any questions you might have about this feedback. Feel free to speak to me!';

    return script;
  }

  // Status and getters (maintains existing API)
  getMediaStream() {
    return this.avatar ? this.avatar.mediaStream : null;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.isConnected,
      hasActiveSession: !!this.sessionData,
      isVoiceChatActive: this.isVoiceChatActive,
      isMuted: this.isMuted,
      isVoiceChatLoading: this.isVoiceChatLoading
    };
  }

  // Legacy function for compatibility
  async toggleMicrophone(enabled = true) {
    if (enabled && this.isMuted) {
      this.unmuteInputAudio();
    } else if (!enabled && !this.isMuted) {
      this.muteInputAudio();
    }
  }
}

// Export singleton instance
export const heygenAvatarManager = new HeygenInteractiveAvatarManager();

// Maintain existing API for backward compatibility
export const createCoachingSession = async (coachingData) => {
  try {
    const session = await heygenAvatarManager.startInteractiveCoaching(coachingData);
    return session;
  } catch (error) {
    console.error('Error creating coaching session:', error);
    throw error;
  }
};

export const endCoachingSession = async () => {
  try {
    await heygenAvatarManager.endSession();
  } catch (error) {
    console.error('Error ending coaching session:', error);
    throw error;
  }
};