import os
import yt_dlp
from pydub import AudioSegment
import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv
import threading
import json
from db import save_document
import uuid
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
# from new_poc import *  # Imp/ort functions from new_poc folder
from transcript_processor import analyze_transcript
from embedding_generator import addDataToDb
from embedding_generator import vector_search_by_text
import db
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()

AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")
app = FastAPI()


app = FastAPI()

# Add CORS support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with the specific origins you want to allow
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods, including OPTIONS
    allow_headers=["*"],  # Allow all headers
)


class YouTubeRequest(BaseModel):
    url: str

class VectorRequest(BaseModel):
    videoId: str
    queryText: str = None
    duration: str = None  # Optional duration in mm.ss format



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
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])
    # Find the downloaded wav file
    temp_wav = "temp_audio.wav"
    audio = AudioSegment.from_file(temp_wav)
    audio = audio.set_channels(1).set_frame_rate(16000)
    audio.export(out_file, format="wav")
    os.remove(temp_wav)
    return out_file

def transcribe_with_azure(audio_file: str) -> str:
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
    audio_config = speechsdk.audio.AudioConfig(filename=audio_file)
    recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    print("Transcribing...")
    result = recognizer.recognize_once()

    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        return result.text
    else:
        print(f"Transcription error: {result.reason}")
        return ""
    
def transcribe_with_azure_full(audio_file: str) -> str:
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
    audio_config = speechsdk.audio.AudioConfig(filename=audio_file)
    recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    full_transcript = []
    done = threading.Event()

    def recognized_handler(evt):
        print(f"Recognized: {evt.result.text}")
        full_transcript.append(evt.result.text)

    def canceled_handler(evt):
        print(f"Canceled: {evt}")
        done.set()

    def session_stopped_handler(evt):
        print("Session stopped.")
        done.set()

    recognizer.recognized.connect(recognized_handler)
    recognizer.canceled.connect(canceled_handler)
    recognizer.session_stopped.connect(session_stopped_handler)

    print("Starting continuous recognition...")
    recognizer.start_continuous_recognition()

    # Wait max 15 minutes or until recognition session stops
    done.wait(timeout=900)

    recognizer.stop_continuous_recognition()

    return " ".join(full_transcript)

def transcribe_with_timestamps(audio_file: str):
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
    audio_config = speechsdk.audio.AudioConfig(filename=audio_file)
    recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    full_transcript = []
    done = threading.Event()

    def recognized_handler(evt):
        if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
            start_sec = evt.result.offset / 10_000_000  # Convert from ticks to seconds
            end_sec = (evt.result.offset + evt.result.duration) / 10_000_000
            text = evt.result.text
            print(f"[{start_sec:.2f} - {end_sec:.2f}] {text}")
            full_transcript.append({
                "start": round(start_sec, 2),
                "end": round(end_sec, 2),
                "text": text
            })

    def canceled_handler(evt):
        print(f"Canceled: {evt}")
        done.set()

    def session_stopped_handler(evt):
        print("Session stopped.")
        done.set()

    recognizer.recognized.connect(recognized_handler)
    recognizer.canceled.connect(canceled_handler)
    recognizer.session_stopped.connect(session_stopped_handler)

    print("Starting continuous recognition...")
    recognizer.start_continuous_recognition()
    done.wait(timeout=900)  # Wait up to 15 minutes
    recognizer.stop_continuous_recognition()

    return full_transcript

def format_timestamp(seconds: float) -> str:
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins}.{secs:02d}"

def transcribe_with_timestamps_exact(audio_file: str):
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
    audio_config = speechsdk.audio.AudioConfig(filename=audio_file)
    recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
    
    speech_config.speech_recognition_language = "en-IN"
    
    full_transcript = []
    done = threading.Event()

    def recognized_handler(evt):
        if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
            start_sec = evt.result.offset / 10_000_000
            end_sec = (evt.result.offset + evt.result.duration) / 10_000_000
            text = evt.result.text
            start_ts = format_timestamp(start_sec)
            end_ts = format_timestamp(end_sec)
            print(f"[{start_ts} - {end_ts}] {text}")
            full_transcript.append({
                "start": start_ts,
                "end": end_ts,
                "text": text
            })

    def canceled_handler(evt):
        print(f"❌ Canceled: {evt}")
        done.set()

    def session_stopped_handler(evt):
        print("✅ Session stopped.")
        done.set()

    recognizer.recognized.connect(recognized_handler)
    recognizer.canceled.connect(canceled_handler)
    recognizer.session_stopped.connect(session_stopped_handler)

    print("🔁 Starting continuous recognition...")
    recognizer.start_continuous_recognition()
    done.wait(timeout=900)
    recognizer.stop_continuous_recognition()

    return full_transcript

def transcribe_with_sentence_timestamps(audio_file: str):
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
    audio_config = speechsdk.audio.AudioConfig(filename=audio_file)
    speech_config.output_format = speechsdk.OutputFormat.Detailed
    speech_config.speech_recognition_language = "en-IN"

    recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    transcript = []
    done = threading.Event()

    def recognized_handler(evt):
        if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
            detailed = evt.result.json
            data = json.loads(detailed)

            nbest_list = data.get("NBest", [])
            if nbest_list:
                nbest = nbest_list[0]  # Only use the top (first) alternative
                words = nbest.get("Words", [])
                sentence = nbest.get("Display", "").strip()
                if words:
                    start_sec = words[0]["Offset"] / 10_000_000
                    end_sec = (words[-1]["Offset"] + words[-1]["Duration"]) / 10_000_000

                    print(f"[{format_timestamp(start_sec)} - {format_timestamp(end_sec)}] {sentence}")
                    transcript.append({
                        "start": format_timestamp(start_sec),
                        "end": format_timestamp(end_sec),
                        "text": sentence
                    })

    def canceled_handler(evt):
        print(f"❌ Canceled: {evt}")
        done.set()

    def session_stopped_handler(evt):
        print("✅ Session stopped.")
        done.set()

    recognizer.recognized.connect(recognized_handler)
    recognizer.canceled.connect(canceled_handler)
    recognizer.session_stopped.connect(session_stopped_handler)

    print("🔁 Starting continuous recognition...")
    recognizer.start_continuous_recognition()
    done.wait(timeout=900)
    recognizer.stop_continuous_recognition()

    return transcript

def transcribe_with_sentence(audio_file: str):
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
    audio_config = speechsdk.audio.AudioConfig(filename=audio_file)
    speech_config.output_format = speechsdk.OutputFormat.Detailed
    speech_config.speech_recognition_language = "en-IN"

    recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    transcript = []
    done = threading.Event()

    def recognized_handler(evt):
        if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
            detailed = evt.result.json
            data = json.loads(detailed)

            nbest_list = data.get("NBest", [])
            if nbest_list:
                nbest = nbest_list[0]  # Only use the top (first) alternative
                sentence = nbest.get("Display", "").strip()
                if sentence:
                    print(f"Recognized: {sentence}")
                    transcript.append(sentence)

    def canceled_handler(evt):
        print(f"❌ Canceled: {evt}")
        done.set()

    def session_stopped_handler(evt):
        print("✅ Session stopped.")
        done.set()

    recognizer.recognized.connect(recognized_handler)
    recognizer.canceled.connect(canceled_handler)
    recognizer.session_stopped.connect(session_stopped_handler)

    print("🔁 Starting continuous recognition...")
    recognizer.start_continuous_recognition()
    done.wait(timeout=900)
    recognizer.stop_continuous_recognition()

    # Join all recognized sentences into one continuous string
    return " ".join(transcript)

@app.post("/transcribe")
def process_youtube_video(request: YouTubeRequest):
    try:
        wav = download_youtube_audio(request.url)
        transcript = transcribe_with_sentence_timestamps(wav)
        text_with_duration = ", ".join(str(entry) for entry in transcript)
        text = " ".join(entry["text"] for entry in transcript)
        print(f"Transcript: {text_with_duration}")
        youtubeVideoId = request.url.split("v=")[-1].split("&")[0] if "v=" in request.url else request.url.split("/")[-1]
        # youtubeVideoId = "ICHMWOFTlV8"
        uuidValue = uuid.uuid4()
        print(f"Video ID: {youtubeVideoId}")
        transcriptByTopic = analyze_transcript(text_with_duration)
        if text:
            save_document({"uuid": str(uuidValue), "transcript": text, "transcriptWithTimestamps": text_with_duration, "transcriptArray": transcript, "url": request.url, "videoId": youtubeVideoId, "subject": "Physics", "exam": "BOARD_EXAM", "class": "11", "transcriptByTopic": transcriptByTopic})
        addDataToDb(uuidValue, transcriptByTopic, youtubeVideoId)
        # os.remove(wav)
        return { "transcript": text, "transcriptWithTimestamps": text_with_duration, "transcriptArray": transcript, "videoId": youtubeVideoId, "transcriptByTopic": transcriptByTopic }
    except Exception as e:
        print(f"Error during transcription:", e)
        raise HTTPException(status_code=500, detail=str(e))
        

@app.post("/vector-search")
def vector_search(request: VectorRequest):
    try:
        data = vector_search_by_text(request.videoId, request.queryText)
        mongoData = db.get_document_by_videoid(request.videoId)
        getDuration = extract_transcript_item(mongoData['transcriptArray'], request.duration) if mongoData and 'transcriptArray' in mongoData else None
        return {
            "videoId": request.videoId,
            "topicTranscripts": getDuration,
            "contextTranscripts": data,
        }
    except Exception as e:
        print(f"Error during vector search:", e)
        raise HTTPException(status_code=500, detail=str(e))

def mmss_to_seconds(mmss):
    """Convert mm.ss string to seconds (float)."""
    minutes, seconds = map(float, mmss.split('.'))
    return minutes * 60 + seconds

def extract_transcript_item(transcript_array, timestamp_mmss):
    """
    Extract the transcript block that includes the given timestamp.
    
    Args:
        transcript_array (list): List of transcript blocks with 'start', 'end', and 'text'.
        timestamp_mmss (str): Timestamp in mm.ss format.
    
    Returns:
        dict or None: Matching transcript block or None if not found.
    """
    target_time = mmss_to_seconds(timestamp_mmss)
    
    for item in transcript_array:
        try:
            start = float(item['start'])
            end = float(item['end'])
            if start <= target_time <= end:
                return item
        except (KeyError, ValueError):
            continue

    return None

# Example usage
transcript_array = [
    {"start": "0.06", "end": "0.26", "text": "Sample 1"},
    {"start": "0.27", "end": "0.40", "text": "Sample 2"},
    {"start": "0.41", "end": "1.02", "text": "Sample 3"},
    # ... your actual data
]

timestamp = "0.30"  # mm.ss format
result = extract_transcript_item(transcript_array, timestamp)

if result:
    print("Transcript Found:", result)
else:
    print("No transcript segment found for given timestamp.")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)