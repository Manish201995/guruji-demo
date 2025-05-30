from google.cloud import speech
import os
from dotenv import load_dotenv
import yt_dlp
from pydub import AudioSegment
from dotenv import load_dotenv
import json
from google.oauth2 import service_account
import base64
import requests

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

def transcribe_with_google(wav_path: str):
    # Read audio file and encode in base64
    with open(wav_path, "rb") as audio_file:
        audio_content = base64.b64encode(audio_file.read()).decode("utf-8")

    url = f"https://speech.googleapis.com/v1/speech:recognize?key={api_key}"

    headers = {
        "Content-Type": "application/json"
    }

    data = {
        "config": {
            "encoding": "LINEAR16",
            "sampleRateHertz": 16000,
            "languageCode": "en-US",
            "enableAutomaticPunctuation": True,
        },
        "audio": {
            "content": audio_content
        }
    }

    response = requests.post(url, headers=headers, data=json.dumps(data))
    if response.status_code == 200:
        results = response.json().get("results", [])
        transcripts = []
        for result in results:
            transcripts.append(result["alternatives"][0]["transcript"])
        return " ".join(transcripts)
    else:
        print(f"Error: {response.status_code}, {response.text}")
        return None

def download_youtube_audio(youtube_url: str, out_file="audio.wav") -> str:
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': 'temp_audio.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192',
        }],
        'quiet': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])

        temp_wav = "temp_audio.wav"
        audio = AudioSegment.from_file(temp_wav)
        audio = audio.set_channels(1).set_frame_rate(16000)
        audio.export(out_file, format="wav")
        os.remove(temp_wav)
        return out_file
    except Exception as e:
        print(f"❌ Error downloading or processing audio: {e}")
        return None
    
def process_youtube_video(youtube_url: str):
    wav_path = download_youtube_audio(youtube_url)
    if not wav_path:
        print("🚫 Failed to download or process audio.")
        return

    transcript = transcribe_with_google(wav_path)
    if transcript:
        print("📜 Transcript:\n", json.dumps(transcript, indent=2, ensure_ascii=False))
    else:
        print("⚠️ Transcription returned no results.")

    if os.path.exists(wav_path):
        os.remove(wav_path)

if __name__ == "__main__":
    youtube_link = "https://www.youtube.com/shorts/6nQRVDbzmmY"
    process_youtube_video(youtube_link)