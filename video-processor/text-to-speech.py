import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv
import os
import sys
load_dotenv()

AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")
ENDPOINT = "https://eastus.api.cognitive.microsoft.com/"

def get_tts(text):
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, endpoint=ENDPOINT)
    speech_config.speech_synthesis_voice_name = 'en-US-AriaNeural'

    output_file = "audio_output.wav"
    audio_config = speechsdk.audio.AudioOutputConfig(filename=output_file)

    # Create the speech synthesizer
    speech_synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config,
        audio_config=audio_config
    )

    # Perform synthesis
    result = speech_synthesizer.speak_text_async(text).get()

    # Handle results
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        print(f"✅ Speech synthesized and saved to: {output_file}")
        print("You can now play this file offline using any media player.")
    elif result.reason == speechsdk.ResultReason.Canceled:
        cancellation = result.cancellation_details
        print(f"❌ Speech synthesis canceled: {cancellation.reason}")
        if cancellation.reason == speechsdk.CancellationReason.Error:
            print("Error details:", cancellation.error_details)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        text = sys.argv[1]
    else:
        text = ""
    get_tts(text)