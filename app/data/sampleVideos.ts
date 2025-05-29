export interface VideoData {
  id: string;
  title: string;
  description?: string;
}

// Sample videos with their IDs and titles
export const sampleVideos: VideoData[] = [
  {
    id: "rLmVC53EwVo",
    title: "VECTOR in 87 Minutes || Full Chapter Revision || Class 11th JEE",
    description :"We present \"Vector in 87 Minutes: Full Chapter Revision for Class 11th JEE\". Covering all essential concepts, calculations, and problem-solving techniques related to vectors, this tutorial is tailored specifically to help you excel in the Class 11th Joint Entrance Examination (JEE)."}

];

// Function to get a video by ID
export function getVideoById(id: string): VideoData | undefined {
  return sampleVideos.find(video => video.id === id);
}