import openai

# def transcribe_audio(file_path, azure_key, region):
def transcribe_audio():
    """
    file_path: Path to your audio or video file (absolute or relative).
    azure_key: Your Azure Speech service subscription key.
    region: The Azure region where your Speech resource is deployed.
    """
    # speech_config = speechsdk.SpeechConfig(subscription=azure_key, region=region)
    # audio_config = speechsdk.AudioConfig(filename=file_path)
    

    client = openai.OpenAI(
        api_key="sk-z6Gd3ZjZcdbEx_x5zrlI6Q",
        base_url="https://litellm-data.penpencil.co" # LiteLLM Proxy is OpenAI compatible, Read More: https://docs.litellm.ai/docs/proxy/user_keys
    )
    # Enable detailed output
    # speech_config.output_format = speechsdk.OutputFormat.Detailed
    # speech_recognizer = speechsdk.SpeechRecognizer(speech_config, audio_config)

    with open('lecture1.mp3', 'rb') as audio_file:
        transcription = client.audio.speech.create()
        print(transcription)
    all_results = []

    # def handle_final_result(evt):
    #     all_results.append(evt.result)

    # speech_recognizer.recognized.connect(handle_final_result)
    # speech_recognizer.start_continuous_recognition()
    # input("Press Enter to stop...\n")
    # speech_recognizer.stop_continuous_recognition()

    # Extract detailed results
    # full_text = []
    # for result in all_results:
    #     if result.reason == speechsdk.ResultReason.RecognizedSpeech:
    #         # The detailed result is in result.json, which is a JSON string
    #         nbest = json.loads(result.json)["NBest"][0]
    #         full_text.append({
    #             "text": nbest["Display"],
    #             "start": nbest["Offset"] / 10**7,
    #             "duration": nbest["Duration"] / 10**7
    # })
    # return full_text


# transcribe_audio("lecture.mp3","4335UgrJCCOV07pwwxbydJGnGB23v7WE6TY2ZaIgtrK4SXGVc5KLJQQJ99BEACYeBjFXJ3w3AAAYACOG9Znw","eastus")
transcribe_audio()