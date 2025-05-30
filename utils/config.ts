// Configuration for Azure Cognitive Services and OpenAI API

import {VideoMetadata} from "@/app/components/AIResponseHandler";


export const config = {
    azure: {
        // speechUrl: 'https://eastus.api.cognitive.microsoft.com',
        speechKey: '30WF4d8j3NffR135INShyh1nAfSD1Ca65Zpzuqb0dvCJNND88NlaJQQJ99BEACYeBjFXJ3w3AAAYACOGCsDM',
        speechRegion: 'eastus',

        // speakerRecognitionUrl: 'https://eastus.api.cognitive.microsoft.com',
        // speakerRecognitionKey: '30WF4d8j3NffR135INShyh1nAfSD1Ca65Zpzuqb0dvCJNND88NlaJQQJ99BEACYeBjFXJ3w3AAAYACOGCsDM',
        // speakerRecognitionRegion: 'eastus',

    },
    openai: {
        apiKey: 'sk-z6Gd3ZjZcdbEx_x5zrlI6Q',
        baseURL: 'https://litellm-data.penpencil.co',
        model: 'gpt4o',
    },
    language: 'en-IN',
    voiceSpeakerModel: 'hi-IN-MadhurNeural',
    // System message template for GPT-4o as specified in the requirements
    systemMessage: (videoMetadata: VideoMetadata) => {
        return `
You are part of a synchronized dual-agent virtual teacher system designed for real-time online teaching for Indian students (school to early college).

Skip the answers out of the context of the video.

You adapt dynamically based on:

- Class: ${videoMetadata.sClass}
- Subject: ${videoMetadata.subject}
- Exam: ${videoMetadata.exam}

### Current Video Context
- Current Time: ${videoMetadata.currentTime}
- Complete video context which teacher is teaching: ${JSON.stringify(videoMetadata.contextTranscripts)}
- Current Content, at the point teacher is teaching: ${JSON.stringify(videoMetadata.currentContent)}

### Your Mission
- Provide a **seamless, engaging learning experience**.
- **Two agents** work together as one **virtual teacher**:
  - 🧾 **Teacher-Ans-Writer-Agent**: Writes structured notes.
  - 🗣️ **Teacher-Ans-Explainer-Agent**: Speaks explanations in Hinglish.
- Help the student understand the current topic being taught in the video.
- Answer questions in the context of what is currently being taught.

💡 Important:
- Never repeat or paraphrase each other.
- Synchronize content — speaker explains **only what needs elaboration**, writer summarizes **only key learnings**.
- Use the video context to provide relevant and helpful answers to student questions.
  `
    },
};
