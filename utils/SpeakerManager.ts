import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import {speechSDKManager} from './SpeechSDKManager';

export class SpeakerManager {
  private profileId: string | null = null;
  private isEnrolled: boolean = false;

  constructor() {
    // SpeechConfig is now managed by speechSDKManager
  }

  /**
   * Create a new speaker profile for the student
   * @returns Promise with the profile ID
   */
  async createProfile(): Promise<string> {
    this.profileId = 'teacher-profile-id';
    return this.profileId;
    // let client: SpeechSDK.VoiceProfileClient | null = null;
    //
    // try {
    //   // Check if speech services are properly configured
    //   if (!config.azure.speakerRecognitionKey || !config.azure.speakerRecognitionRegion) {
    //     throw new Error('Speaker recognition services not properly configured');
    //   }
    //
    //   console.log('Creating voice profile client...');
    //   client = speechSDKManager.createVoiceProfileClient();
    //
    //   console.log('Creating profile with language:', config.language);
    //   try {
    //     const profile = await client.createProfileAsync(
    //         SpeechSDK.VoiceProfileType.TextIndependentIdentification,
    //         config.language
    //     );
    //
    //     console.log('Profile created successfully:', profile.profileId);
    //     this.profileId = profile.profileId;
    //     return profile.profileId;
    //   } catch (err) {
    //     console.warn('Failed to create profile:', err);
    //     throw err;
    //   }
    //
    // } catch (error) {
    //   console.error('Error creating speaker profile:', error);
    //   throw error;
    // } finally {
    //   // Clean up resources
    //   if (client) {
    //     console.log('Closing voice profile client...');
    //     await client.close();
    //   }
    // }
  }

  /**
   * Enroll the speaker profile with audio data
   * @param audioConfig The audio configuration for enrollment
   * @returns Promise indicating enrollment success
   */
  async enrollProfile(audioConfig: SpeechSDK.AudioConfig): Promise<boolean> {
    console.log('Enrolling speaker profile...');
    if (!this.profileId) {
      throw new Error('No speaker profile created. Call createProfile first.');
    }

    let client: SpeechSDK.VoiceProfileClient | null = null;

    try {
      client = speechSDKManager.createVoiceProfileClient();
      const profile = new SpeechSDK.VoiceProfile(this.profileId, SpeechSDK.VoiceProfileType.TextIndependentIdentification);

      // Enroll the profile with the audio data
      await client.enrollProfileAsync(profile, audioConfig);

      this.isEnrolled = true;
      return true;
    } catch (error) {
      console.error('Error enrolling speaker profile:', error);
      throw error;
    } finally {
      // Clean up resources
      if (client) {
        await client.close();
      }
    }
  }

  /**
   * Identify the speaker from audio input
   * @param audioConfig The audio configuration for identification
   * @returns Promise with identification result
   */
  async identifySpeaker(audioConfig: SpeechSDK.AudioConfig): Promise<boolean> {
    if (!this.profileId || !this.isEnrolled) {
      console.warn('Speaker profile not enrolled. Returning default true.');
      return true; // Default to true if no profile is enrolled
    }

    let client: SpeechSDK.VoiceProfileClient | null = null;

    try {
      client = speechSDKManager.createVoiceProfileClient();
      const profile = new SpeechSDK.VoiceProfile(this.profileId, SpeechSDK.VoiceProfileType.TextIndependentIdentification);

      // In a production app, you would use SpeakerRecognizer for proper speaker verification
      // For this sample, we'll use a simplified approach with VoiceProfileClient

      // First, check if the profile exists
      const profiles = await client.getAllProfilesAsync(SpeechSDK.VoiceProfileType.TextIndependentIdentification);
      const profileExists = profiles.some(p => p.enrollmentResultDetails.profileId === this.profileId);

      if (!profileExists) {
        console.warn('Profile no longer exists. Returning default true.');
        return true;
      }

      // Use a simple verification by attempting to enroll with the same profile
      // This is not ideal but works as a simplified approach for this sample
      const result = await client.enrollProfileAsync(profile, audioConfig);

      return result !== undefined;
    } catch (error) {
      console.error('Error identifying speaker:', error);
      // In case of error, default to true to allow the conversation to continue
      return true;
    } finally {
      // Clean up resources
      if (client) {
        await client.close();
      }
    }
  }

  /**
   * Reset the speaker profile
   */
  async resetProfile(): Promise<void> {
    if (!this.profileId) {
      // Nothing to reset
      return;
    }

    let client: SpeechSDK.VoiceProfileClient | null = null;

    try {
      client = speechSDKManager.createVoiceProfileClient();
      const profile = new SpeechSDK.VoiceProfile(this.profileId, SpeechSDK.VoiceProfileType.TextIndependentIdentification);

      // Delete the profile
      await client.deleteProfileAsync(profile);

      this.profileId = null;
      this.isEnrolled = false;
    } catch (error) {
      console.error('Error resetting speaker profile:', error);

      // Even if deletion fails, reset the local state to allow for a fresh start
      this.profileId = null;
      this.isEnrolled = false;

      throw error;
    } finally {
      // Clean up resources
      if (client) {
        await client.close();
      }
    }
  }

  /**
   * Check if a speaker profile is enrolled
   * @returns True if a profile is enrolled, false otherwise
   */
  isProfileEnrolled(): boolean {
    return this.isEnrolled;
  }
}

// Export a singleton instance for use throughout the application
export const speakerManager = new SpeakerManager();
