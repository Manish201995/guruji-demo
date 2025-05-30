import os
import yt_dlp
from pydub import AudioSegment
from dotenv import load_dotenv
import whisper
import json

# Load environment variables from .env
load_dotenv()

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

def transcribe(audio_path):
    try:
        model = whisper.load_model("tiny")
        # result = model.transcribe(audio_path, word_timestamps=True)
        result = model.transcribe(audio_path, task="translate")

        transcriptions = [
            {
                "start": round(segment['start'], 2),
                "end": round(segment['end'], 2),
                "text": segment['text'].strip()
            }
            for segment in result['segments']
        ]

        return transcriptions
    except Exception as e:
        print(f"❌ Error during transcription: {e}")
        return []

def process_youtube_video(youtube_url: str):
    wav_path = download_youtube_audio(youtube_url)
    if not wav_path:
        print("🚫 Failed to download or process audio.")
        return

    transcript = transcribe(wav_path)
    if transcript:
        print("📜 Transcript:\n", json.dumps(transcript, indent=2, ensure_ascii=False))
    else:
        print("⚠️ Transcription returned no results.")

    if os.path.exists(wav_path):
        os.remove(wav_path)

if __name__ == "__main__":
    youtube_link = "https://www.youtube.com/watch?v=WiuQ1hPDiQQ"
    process_youtube_video(youtube_link)
