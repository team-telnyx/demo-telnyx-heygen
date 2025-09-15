// Heygen Streaming Avatar Integration
import StreamingAvatar, {
  AvatarQuality,
  VoiceEmotion,
  StreamingEvents,
  TaskType,
  TaskMode,
  StartAvatarRequest
} from '@heygen/streaming-avatar';

class HeygenAvatarManager {
  constructor() {
    this.avatar = null;
    this.sessionData = null;
    this.isInitialized = false;
    this.isConnected = false;
    this.sessionToken = null;
    this.mediaStream = null;
  }

  // Initialize the avatar with API credentials
  async initialize() {
    try {
      console.log('Initializing Heygen avatar...');

      if (!process.env.NEXT_PUBLIC_HEYGEN_API_KEY) {
        throw new Error('NEXT_PUBLIC_HEYGEN_API_KEY is required');
      }

      // Create avatar instance
      this.avatar = new StreamingAvatar({
        token: process.env.NEXT_PUBLIC_HEYGEN_API_KEY
      });

      this.setupEventListeners();
      this.isInitialized = true;

      console.log('Heygen avatar initialized successfully');
      return true;

    } catch (error) {
      console.error('Error initializing Heygen avatar:', error);
      throw error;
    }
  }

  // Set up event listeners for avatar events
  setupEventListeners() {
    if (!this.avatar) return;

    this.avatar.on(StreamingEvents.AVATAR_START_TALKING, (event) => {
      console.log('Avatar started talking:', event);
    });

    this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (event) => {
      console.log('Avatar stopped talking:', event);
    });

    this.avatar.on(StreamingEvents.STREAM_READY, (event) => {
      console.log('Avatar stream ready:', event);
      this.isConnected = true;
      this.mediaStream = this.avatar.mediaStream;
    });

    this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, (event) => {
      console.log('Avatar stream disconnected:', event);
      this.isConnected = false;
      this.mediaStream = null;
    });

    this.avatar.on(StreamingEvents.USER_START, (event) => {
      console.log('User started speaking:', event);
    });

    this.avatar.on(StreamingEvents.USER_STOP, (event) => {
      console.log('User stopped speaking:', event);
    });
  }

  // Start a new avatar session
  async startSession() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('Starting avatar session...');

      // Step 1: Create session info
      const sessionInfo = await this.avatar.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID || 'Santa_Fireplace_Front_public',
        voice: {
          rate: 1.0,
          emotion: VoiceEmotion.FRIENDLY
        },
        language: 'en',
        disableIdleTimeout: true
      });

      console.log('=== SESSION INFO DEBUG ===');
      console.log('Session info:', sessionInfo);
      console.log('Session info keys:', Object.keys(sessionInfo || {}));
      console.log('=== SESSION INFO DEBUG END ===');

      // Session is already started after createStartAvatar - no need for startAvatar call
      this.sessionData = sessionInfo;

      console.log('=== AVATAR SESSION SUCCESS ===');
      console.log('Avatar session is ready with session ID:', sessionInfo.session_id);
      console.log('LiveKit URL:', sessionInfo.url);
      console.log('=== AVATAR SESSION SUCCESS END ===');

      return this.sessionData;

    } catch (error) {
      console.error('Error starting avatar session:', error);
      throw error;
    }
  }

  // End the current avatar session
  async endSession() {
    try {
      if (this.avatar && this.sessionData) {
        console.log('Ending avatar session...');
        await this.avatar.stopAvatar();
        this.sessionData = null;
        this.isConnected = false;
        this.mediaStream = null;
        console.log('Avatar session ended');
      }
    } catch (error) {
      console.error('Error ending avatar session:', error);
      throw error;
    }
  }

  // Make the avatar speak coaching content
  async deliverCoaching(coachingScript, options = {}) {
    try {
      console.log('=== DELIVER COACHING DEBUG ===');
      console.log('isConnected:', this.isConnected);
      console.log('avatar exists:', !!this.avatar);
      console.log('mediaStream exists:', !!this.mediaStream);
      console.log('=== DELIVER COACHING DEBUG END ===');

      if (!this.isConnected || !this.avatar) {
        throw new Error(`Avatar is not connected - isConnected: ${this.isConnected}, avatar: ${!!this.avatar}`);
      }

      console.log('Avatar delivering coaching:', coachingScript.substring(0, 100) + '...');

      const speakOptions = {
        text: coachingScript,
        task_type: TaskType.TALK,
        taskMode: TaskMode.SYNC,
        ...options
      };

      await this.avatar.speak(speakOptions);
      console.log('Coaching delivery completed');

    } catch (error) {
      console.error('Error delivering coaching:', error);
      throw error;
    }
  }

  // Get the media stream for video display
  getMediaStream() {
    return this.avatar ? this.avatar.mediaStream : null;
  }

  // Start interactive coaching session
  async startInteractiveCoaching(coachingSession) {
    try {
      if (!this.isConnected) {
        await this.startSession();
      }

      const { feedback } = coachingSession;

      // Create a comprehensive coaching script
      const coachingScript = this.generateCoachingScript(feedback);

      // Deliver the coaching content
      await this.deliverCoaching(coachingScript);

      return {
        success: true,
        sessionId: coachingSession.id,
        message: 'Interactive coaching session started'
      };

    } catch (error) {
      console.error('Error starting interactive coaching:', error);
      throw error;
    }
  }

  // Generate a natural coaching script from feedback
  generateCoachingScript(feedback) {
    let script = '';

    // Introduction
    script += 'Hello! I have reviewed your recent call and have some coaching feedback for you. ';

    // Strengths
    if (feedback.strengths && feedback.strengths.length > 0) {
      script += 'First, let me highlight what you did well: ';
      script += feedback.strengths.slice(0, 2).join(', ') + '. ';
    }

    // Improvements
    if (feedback.improvements && feedback.improvements.length > 0) {
      script += 'For areas of improvement, I noticed: ';
      script += feedback.improvements.slice(0, 2).join(', ') + '. ';
    }

    // Suggestions
    if (feedback.suggestions && feedback.suggestions.length > 0) {
      script += 'Here are some specific suggestions: ';
      script += feedback.suggestions.slice(0, 2).join(', ') + '. ';
    }

    // Use custom script if provided
    if (feedback.avatarScript) {
      script = feedback.avatarScript;
    }

    // Closing
    script += ' Keep up the great work, and remember that every call is an opportunity to improve!';

    return script;
  }

  // Get avatar connection status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.isConnected,
      hasActiveSession: !!this.sessionData
    };
  }

  // Enable/disable avatar microphone for interactive sessions
  async toggleMicrophone(enabled = true) {
    try {
      console.log('Toggling microphone:', enabled ? 'enabled' : 'disabled');
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Error toggling microphone:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const heygenAvatarManager = new HeygenAvatarManager();

// Utility functions for coaching integration
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