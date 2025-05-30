export interface VideoData {
  id: string;
  title: string;
  description?: string;
}

// Sample videos with their IDs and titles
export const sampleVideos: VideoData[] = [
  // {
  //   id: "0peBVJuZXKE",
  //   title: "What is Refractive Index ? CLASS X : CBSE / ICSE : Refraction Of Light 02\n",
  //   description: "What will you get in the Lakshya Batch?\n" +
  //       "(1) Complete Class 12th + JEE Mains/ NEET syllabus - Targeting 95% in Board Exams and Selection in JEE MAINS / NEET  with a Strong Score under Direct Guidance of Alakh Pandey."
  // },
  // {
  //   id: "rLmVC53EwVo",
  //   title: "Vectors - Physics Chapter 4 | Class 11 Physics | Complete Chapter",
  //   description: "Learn about vectors, their representation, magnitude, direction, and various vector operations in this comprehensive physics lesson. Perfect for understanding the fundamentals of vector mathematics in physics."
  // },
  {
    id: "sOYWas_P_F8",
    title: "Snell's Law : Class X CBSE / ICSE : Refraction Of Light 03",
    description: "We provide you the best test series for Class XI,XII, JEE, NEET chapterwise, which will be scheduled for whole year.\n" +
        "The test series follows very  logical sequence of Basic to Advance questions.&\n" +
        "Evaluation of Test and Solution to all the questions at the end of the test."
  }
];

// Function to get a video by ID
export function getVideoById(id: string): VideoData | undefined {
  return sampleVideos.find(video => video.id === id);
}