export interface Transcript {
  text: string;
  start: number;
  duration: number;
  topic: string;
}

export interface VideoContextRequest {
  videoId: string;
  queryText: string;
  duration: string;
}

export interface VideoContextResponse {
  videoId: string;
  subject: string;
  exam: string;
  class: string;
  topicTranscripts: Transcript[];
  contextTranscripts: Transcript[];
}

export async function fetchVideoContext(
  request: VideoContextRequest
): Promise<VideoContextResponse> {
  const baseURL = "localhost:8000";
  const endpoint = "vector-search";

  const res = await fetch(`http://${baseURL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    next: { revalidate: 60 }, // Optional for Next.js
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch video context: ${res.statusText}`);
  }

  return res.json();
}