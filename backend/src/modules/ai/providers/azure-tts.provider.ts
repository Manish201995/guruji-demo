// src/modules/voice/providers/azure-tts.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

/**
 * Wraps Azure Cognitive-Services Speech-Synthesis.
 * Returns an MP3 buffer ready to stream.
 */
@Injectable()
export class AzureTtsProvider {
  private readonly logger = new Logger(AzureTtsProvider.name);
  private readonly speechConfig: sdk.SpeechConfig;
  private readonly voiceName: string;

  constructor(config: ConfigService) {
    const key = config.get<string>('AZURE_SPEECH_KEY');
    const region = config.get<string>('AZURE_SPEECH_REGION');
    if (!key || !region) throw new Error('Azure Speech credentials missing');

    this.speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    this.speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    // Hinglish neural voice (adjust if needed)
    this.voiceName =
      config.get<string>('AZURE_SPEECH_VOICE') ?? 'en-IN-PrabhatNeural';
  }

  /** Convert plain text to MP3 buffer */
  speak(text: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const audioConfig = sdk.AudioConfig.fromStreamOutput(sdk.AudioOutputStream.createPullStream()); // memory stream
      const synthesizer = new sdk.SpeechSynthesizer(
        this.speechConfig,
        audioConfig,
      );
      this.speechConfig.speechSynthesisVoiceName = this.voiceName;

      synthesizer.speakTextAsync(
        text,
        result => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve(Buffer.from(result.audioData));
          } else {
            this.logger.error(`TTS failed, reason: ${result.reason}`);
            reject(new Error('Azure TTS failure'));
          }
          synthesizer.close();
        },
        err => {
          synthesizer.close();
          reject(err);
        },
      );
    });
  }
}
