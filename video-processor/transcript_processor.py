import openai
import json
import re

client = openai.OpenAI(
    api_key="sk-z6Gd3ZjZcdbEx_x5zrlI6Q",
    base_url="https://litellm-data.penpencil.co" # LiteLLM Proxy is OpenAI compatible, Read More: https://docs.litellm.ai/docs/proxy/user_keys
)

# response = client.embeddings.create(
#     model="gpt-4.1", # model to send to the proxy
#     messages = [
#         {
#             "role": "user",
#             "content": "this is a test request, write a short poem"
#         }
#     ]
# )

# print(response)

def extract_json_from_string(s):
    """
    Extracts the first valid JSON array from a string.
    """
    # Find the first [ ... ] block (non-greedy)
    match = re.search(r'\[\s*{.*?}\s*\]', s, re.DOTALL)
    if match:
        json_str = match.group(0)
        return json.loads(json_str)
    raise ValueError("No valid JSON array found in the string.")

def analyze_transcript(transcript):
    system_prompt = "You are an expert video content analyst."
    user_prompt = f"""
Analyze the following transcript text, which contains a lecture, along with durations (format: mm.ss).
Your task is to accurately analyze the content and break it down in different topics, according to what is being discussed in the video.
The result format should be a JSON object with the following keys:
-start_time: The start time of the topic in the format mm.ss
-duration: The duration of the topic in the format mm.ss
-topic: A brief description of the topic being discussed
-transcript: The text of the transcript for that topic
Example:
[
    {{
        "start_time": "00.00",
        "duration": "01.30",
        "topic": "Introduction to the topic",
        "transcript": "In this section, we will discuss the basics of the topic..."
    }},
    {{
        "start_time": "01.31",
        "duration": "02.15",
        "topic": "Detailed explanation of a concept",
        "transcript": "Now, let's dive deeper into the concept..."
    }}
]
Use this transcript for analysis:  \"{transcript}\"
"""

    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
    )
    print(response.choices[0].message.content)
    return extract_json_from_string(response.choices[0].message.content)


# res = analyze_transcript("{'start': '0.06', 'end': '0.26', 'text': 'हाँ बच्चों आज हम बात करेंगे रिफ्रक्टिव इंडेक्स की। रिफ्रक्टिव इंडेक्स इसका सिंबल है। म्यू और कई लोग इसका सिंबल लिखते हैं। एन। तो रिफ्रक्टिव इंडेक्स क्या बताता है? हमको जैसे मान लो कोई मीडियम रेरर हैरर मीडियम क्या होता है, जिसमें लाइट धीमे धीमे चले?'}, {'start': '0.27', 'end': '0.40', 'text': 'खाली है। मीडियम तो लाइट को ज्यादा लड़ना भिड़ना नहीं पड़ रहा तो लाइट सीधे चली गई। रेरर एकदम रेयर खाली सा मीडिया तो रेरर मीडियम जिसमें स्पीड ऑफ़ लाइक फास्ट हो लाइट ट्रैवल्स फास्टर।'}, {'start': '0.41', 'end': '1.02', 'text': 'और डेंजर मीडियम डेंजर मतलब डेंसिटी ज्यादा हो, मतलब भरा हुआ मीडियम हो, हर तरफ मॉलेक्यूल्स हो तो लाइट को रास्ते में ज्यादा लड़ना पड़ेगा तो लाइट धीमे धीमे चलेगा। सो इन ना डेंजर मीडियम दी स्पीड ऑफ़ स्लो तो ये जो डेंसिटी है, ये वो वाली डेंसिटी नहीं है जो मास में हम लोग पढ़ते थे।'}, {'start': '1.02', 'end': '1.13', 'text': 'ये एक नई तरह की डेंसिटी है। जीसको बोलते हैं ऑप्टिकल डेंसिटी क्या बोलते हैं ऑप्टिकल ऑप्टिकल मतलब किसके लिए लाइट के लिए कैंपेन सिटी है ऑप्टिक्स?'}, {'start': '1.15', 'end': '1.31', 'text': 'तो लाइट की डेंसिटी को हमने बोला ऑप्टिकल डेंसिटी और इसी का दूसरा नाम रखा गया है रिफ्रक्टिव इंडेक्स। तो रिफ्रक्टिव इंडेक्स इस चीज़ का मेजर है की कौन सा मीडियम कितना ज्यादा डेंस है जितना ज्यादा मीडियम।'}, {'start': '1.32', 'end': '1.50', 'text': 'डांस होगा, स्पीड ऑफ़ लाइट उतनी कम होगी, ठीक है जैसे हमने बोला किसी मीडियम की डेंसिटी बहुत ज्यादा है तो कॉन्सिडेंसिटी ऑप्टिकल डेंसिटी बहुत ज्यादा है तो उस मीडियम में स्पीड ऑफ़ लाइट।'}, {'start': '1.52', 'end': '2.13', 'text': 'क्या होगी? कम होगी तो जितनी ज्यादा डेंसिटी, उतनी कम स्पीड ऑफ़ लाइट तो ऑप्टिकल डेंसिटी को मेजर किस्से करेंगे रिफ्रक्टिव इंडेक्स से तो हमने बोला की ये जो सिम्बल है किसका है ऑप्टिकल डेंसिटी का या यही सिंबल किसका है रिफ्रक्टिव इंडेक्स का?'}, {'start': '2.16', 'end': '2.42', 'text': 'अब जितनी ज्यादा म्यू की वैल्यू उतनी ज्यादा डेंसिटी म्यू है क्या ऑप्टिकल डेंसिटी तो म्यू की वैल्यू जितनी ज्यादा डेंसिटी उतनी ज्यादा मतलब मीडियम उतना डेंस और जितना डेंस मीडियम स्पीड ऑफ़ लाइट उस मीडियम में उतनी कम हो जाएगी तो म्यू जितना ज्यादा स्पीड ऑफ़ लाइट उतनी कम मतलब हम ये बोलेंगे की फिर ऑप्टिकल डेंसिटी या'}, {'start': '2.43', 'end': '3.08', 'text': 'एनिवर्सली प्रोपोशनल टु दी स्पीड ऑफ़ फ्लाइट इन दट मीडियम ठीक है। अब हमने यहाँ पे एक एग्ज़ैम्पल लिया जिसमें लाइट फर्स्ट मीडियम से सेकंड मीडियम में जा रहा है। फर्स्ट मीडियम में लाइट की स्पीड है, वि वॅन और सेकंड मीडियम में लाइक की स्पीड है। वि टू फर्स्ट मीडियम का इंडेक्स है। म्यू वॅन और सेकंड मीडियम का रिफ्रक्टिव इंडेक्स'}, {'start': '3.10', 'end': '3.15', 'text': 'अब हम अगर पूछे कि मुके टु अपॉन म्यू वॅन की क्या वैल्यू होगी।'}, {'start': '3.16', 'end': '3.39', 'text': 'तो प्रपोजल टु विलासिटी उलटे उलटे प्रोपोशनल है। यानी म्यू टू के सामने वि वॅन आएगा और म्यू वॅन के सामने वि टू आएगा। सो म्यूट टू विथ रिस्पेक्ट टु मु वॅन इस इक्वल्स टु स्पीड ऑफ़ लाइट इन फर्स्ट मीडियम अपॉन स्पीड ऑफ़ लाइट इन सेकंड मीडियम उल्टा उल्टा हो जाएगा। अब इसको हम लोग बोलते हैं बच्चों इंडेक्स।'}, {'start': '3.39', 'end': '3.41', 'text': 'ऑफ़ सेकंड मीडियम।'}, {'start': '3.41', 'end': '4.08', 'text': 'विथ रिस्पेक्ट टु फर्स्ट मीडियम सेकंड मीडियम किसके रिस्पेक्ट में फर्स्ट मीडियम से फर्स्ट मीडियम से सेकंड मीडियम कितने गुना भारी है, कितने गुना डेंस है? क्या वैल्यू बनेगी स्पीड ऑफ़ लाइट इन फर्स्ट मीडियम स्पीड ऑफ़ लाइट इन सेकंड मीडियम इसको बोलते हैं इंडेक्स ऑफ़ सेकंड विथ रिस्पेक्ट टू विथ रिस्पेक्ट।'}, {'start': '4.08', 'end': '4.08', 'text': 'टू।'}, {'start': '4.09', 'end': '4.27', 'text': 'रिस्ट्रक्टिव इंडेक्स ऑफ़ सेकंड विथ रिस्पेक्ट टु फर्स्ट और इसका मतलब म्यूट टु अपॉन म्यू वॅन अच्छा सेकंड की विथ रिस्पेक्ट टु फर्स्ट्ली दी स्पीड ऑफ़ लाइक उल्टा हो गया वि वॅन अपॉन वि टू ठीक है तो ये चीज़ हमें बताएगा की लाइट।'}, {'start': '4.27', 'end': '4.52', 'text': 'दूसरे मीडियम में जाकर कैसे अपनी स्पीड को चेंज कर लेगी? कैसे अपनी स्पीड को चेंज कर लेगी? जैसे एक एग्ज़ैम्पल लेते हैं हम स्पीड ऑफ़ लाइट इन एयर इस थ्री इनटू 10 टु दी पावर एयठ मीटर पर सेकंड एंड स्पीड ऑफ़ लाइट इन ग्लास इस टू इनटू 10 टु दी पावर एयठ मीटर पर सेकंड।'}, {'start': '4.53', 'end': '5.16', 'text': 'अगर हम पूछे रिफ्रक्टिव इंडेक्स ऑफ़ ग्लास अपॉन रिफ्रक्टिव इंडेक्स ऑफ़ एयर की क्या वैल्यू होगी? तो स्पीड ऑफ़ फ्लाइट इन एयर अपॉन स्पीड ऑफ़ फ्लाइट इन ग्लास उल्टे उल्टे लिख दिया? अब एयर में थ्री इनटू 10 टु दी पावर एयठ और ग्लास में टू इनटू 10 टु दी पावर एयठ कैंसिल हो गया। कितनी वैल्यू आई थ्री ब्य टू?'}, {'start': '5.17', 'end': '5.45', 'text': 'या हम लोग बोल सकते हैं 1.5 अब रिफ्रक्टिव इंडेक्स ऑफ़ ग्लास किसके रिस्पेक्ट में एयर तो रिफ्रक्टिव इंडेक्स ऑफ़ ग्लास विथ रिस्पेक्ट टु एयर इस 1.5 अब इस लाइन से दो मीनिंग निकल रही है। पहली चीज़ ग्लास एयर से कितना ज्यादा डेंस है 1.5 टाइम्स और जितना ज्यादा डांस होगा उतनी कम स्पीड ऑफ़ लाइक मतलब?'}, {'start': '5.45', 'end': '5.48', 'text': 'स्पीड ऑफ़ लाइट जब एयर से ग्लास में जाती है।'}, {'start': '5.49', 'end': '6.14', 'text': 'तो कम हो जाती है क्योंकि ग्लास कैसा मीडियम है, डेंजर मीडियम है और कितने गुना कम होती है। 1.5 टाइम्स मतलब रिफ्रक्टिव इंडेक्स ये बता रहा है मीडियम कितने टाइम्स डांस है या स्पीड ऑफ़ लाइट, कितने टाइम्स कम हो जाएगी? एस कंपेर्ड टु स्पीड ऑफ़ फ्लाइट इन एयर यहाँ से यहाँ जाने पे स्पीड ऑफ़ लाइट कम हुई कितने गुना कम हुई थ्री ब्य टू 1.5?'}, {'start': '6.15', 'end': '6.31', 'text': 'और मीडियम यहाँ से यहाँ जाने में कैसा हुआ? डेंस हुआ ग्लास इतने गुना ज्यादा डेंस है। 1.5 टाइम्स तो ये मीनिंग होती है रिफ्रक्टिव इंडेक्स की नेक्स्ट वीडियो में हम आपको बताएंगे की स्नेल्स लॉ और लॉस ऑफ़ रिफ्रक्शन क्या होते है।'}")
