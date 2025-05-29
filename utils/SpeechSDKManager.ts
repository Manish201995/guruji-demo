import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import {config} from './config';

/**
 * A singleton class to manage SpeechSDK initialization and configuration
 */
export class SpeechSDKManager {
    private static instance: SpeechSDKManager;
    private speechConfig: SpeechSDK.SpeechConfig | null = null;

    private constructor() {
        // Private constructor to enforce singleton pattern
    }

    /**
     * Get the singleton instance of SpeechSDKManager
     */
    public static getInstance(): SpeechSDKManager {
        if (!SpeechSDKManager.instance) {
            SpeechSDKManager.instance = new SpeechSDKManager();
        }
        return SpeechSDKManager.instance;
    }

    /**
     * Get a speech configuration for speech recognition and synthesis
     */
    public getSpeechConfig(): SpeechSDK.SpeechConfig {
        if (!this.speechConfig) {
            // Initialize the speech config if it doesn't exist
            this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
                // new URL(config.azure.speechUrl),
                config.azure.speechKey,
                config.azure.speechRegion,
            );
            // console.log('Speech config region: ', SpeechSDK.PropertyId.SpeechServiceConnection_Region);
            // this.speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_IntentRegion, config.azure.speechRegion);
        }
        return this.speechConfig;
    }

    /**
     * Create a speech recognizer with the specified audio config
     */
    public createSpeechRecognizer(audioConfig: SpeechSDK.AudioConfig): SpeechSDK.SpeechRecognizer {
        const speechConfig = this.getSpeechConfig();

        // Set the speech recognition language
        speechConfig.speechRecognitionLanguage = config.language;

        // Enable continuous language identification for better Hinglish support
        speechConfig.setProperty(
            SpeechSDK.PropertyId.SpeechServiceConnection_LanguageIdMode,
            'Continuous'
        );

        return new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    }

    /**
     * Create a speech synthesizer with the specified audio config
     */
    public createSpeechSynthesizer(audioConfig: SpeechSDK.AudioConfig): SpeechSDK.SpeechSynthesizer {
        const speechConfig = this.getSpeechConfig();

        // Set the voice name
        speechConfig.speechSynthesisVoiceName = config.voiceSpeakerModel;

        // Set output format to ensure audio is properly streamed
        speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_SynthOutputFormat, 'Audio24Khz96KBitRateMonoMp3');

        // Enable detailed logging
        speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceResponse_RequestDetailedResultTrueFalse, 'true');

        // Set the speech synthesis language
        speechConfig.speechSynthesisLanguage = config.language || 'en-US';

        console.log('Creating speech synthesizer with config:', {
            voice: speechConfig.speechSynthesisVoiceName,
            language: speechConfig.speechSynthesisLanguage,
            region: config.azure.speechRegion
        });

        return new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
    }

    /**
     * Create a voice profile client for speaker recognition
     */
    public createVoiceProfileClient(): SpeechSDK.VoiceProfileClient {
        const speechConfig = this.getSpeechConfig();
        return new SpeechSDK.VoiceProfileClient(speechConfig);
    }
}

// Export a singleton instance for use throughout the application
export const speechSDKManager = SpeechSDKManager.getInstance();
