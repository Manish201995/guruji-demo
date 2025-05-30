/**
 * Seed realistic GuruJi data
 *
 *   npx ts-node --transpile-only scripts/mega-seed.ts
 *
 * Needs:
 *   OPENAI_API_KEY   (proxy key)
 *   OPENAI_BASE_URL  (e.g. https://litellm-data.penpencil.co)
 *   MONGODB_URI      (defaults to mongodb://localhost/guruji)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { createHash, randomBytes } from 'crypto';
import OpenAI from 'openai';

import { Video,     VideoSchema      } from '../src/modules/video/schemas/video.schema';
import { Chunk,     ChunkSchema      } from '../src/modules/chunks/schemas/chunk.schema';
import { Question,  QuestionSchema,
         QuestionType                } from '../src/modules/question/schemas/question.schema';
import { Interaction, InteractionSchema,
         InteractionType             } from '../src/modules/interaction/schemas/interaction.schema';

/* -------------------------------------------------- helpers */
const DIM        = 1536;
const openaiKey  = process.env.OPENAI_API_KEY;
const openaiBase = process.env.OPENAI_BASE_URL;
const openai     = openaiKey ? new OpenAI({ apiKey: openaiKey, baseURL: openaiBase }) : undefined;

/** Try real embeddings – otherwise deterministic pseudo-random */
async function embed(text: string): Promise<number[]> {
  if (openai)
    try {
      const { data } = await openai.embeddings.create({
        model : 'text-embedding-3-small',
        input : text,
      });
      return (data[0] as any).embedding as number[];
    } catch (e) {
      console.warn('⚠️  embedding failed → pseudo-random', (e as Error).message);
    }

  const seed = createHash('sha1').update(text).digest();
  let idx = 0;
  return Array.from({ length: DIM }, () => {
    const val = seed[idx++ % seed.length];
    return (val / 255 - 0.5) * 0.2;
  });
}

/* -------------------------------------------------- real lesson data */
type Lesson = {
  videoId: string;
  title  : string;
  segments: {
    text: string;
    mcq : { q: string; options: string[]; correctIdx: number; hint: string };
    tf  : { q: string; answerT: boolean;  hint : string };
  }[];
};

const lessons: Lesson[] = [
  {
    videoId: 'demo_newton',
    title  : 'Newton’s Laws – Class 8',
    segments: [
      {
        text: `Force is a push or pull that can change the state of motion of an object. Its SI unit is the newton (N).`,
        mcq : {
          q: 'Force ki SI unit kaunsi hai?',
          options: ['Newton', 'Joule', 'Pascal', 'Watt'],
          correctIdx: 0,
          hint: 'Sir Isaac ke naam par hai.',
        },
        tf : {
          q: 'Inertia ek object ki tendency hoti hai apni state ko badalne ki.',
          answerT: false,
          hint: 'Socho—badalna ya banaye rakhna?',
        },
      },
      {
        text: `First Law: An object continues in its state of rest or uniform straight-line motion unless acted upon by an external force. This property is called inertia.`,
        mcq : {
          q: 'First law kis concept ko introduce karta hai?',
          options: ['Momentum', 'Inertia', 'Energy', 'Power'],
          correctIdx: 1,
          hint: 'Gadi rukti kyon nahi turant?',
        },
        tf : {
          q: 'Ek moving bus se achanak jump karne par aap piche ki taraf girte hain—ye First Law ka example hai.',
          answerT: true,
          hint: 'Body motion continue karna chahegi.',
        },
      },
      {
        text: `Second Law: The acceleration produced in an object is directly proportional to the force applied and inversely proportional to its mass (F = m × a).`,
        mcq : {
          q: 'Formula F = m × a me “m” kya represent karta hai?',
          options: ['Momentum', 'Mass', 'Meter', 'Magnitude'],
          correctIdx: 1,
          hint: 'Kilogram wali quantity.',
        },
        tf : {
          q: 'Zyada mass hone par same force se zyada acceleration milta hai.',
          answerT: false,
          hint: 'Second law socho—direct ya inverse?',
        },
      },
      {
        text: `Third Law: For every action, there is an equal and opposite reaction. Rockets move upward because hot gases push downward.`,
        mcq : {
          q: 'Rocket ko upar kis wajah se thrust milta hai?',
          options: [
            'Gravitational pull',
            'Action–reaction of exhaust gases',
            'Air resistance',
            'Magnetic force',
          ],
          correctIdx: 1,
          hint: 'Third law ka direct use.',
        },
        tf : {
          q: 'Action aur reaction forces hamesha ek hi object par lagte hain.',
          answerT: false,
          hint: 'Do alag bodies involved hoti hain.',
        },
      },
    ],
  },

  {
    videoId: 'demo_gravity',
    title  : 'Gravity Explained – Class 8',
    segments: [
      {
        text: `Newton proposed that every mass attracts every other mass with a force called gravity.`,
        mcq : {
          q: 'Gravity ka konse scientist ne law diya?',
          options: ['Einstein', 'Newton', 'Kepler', 'Galileo'],
          correctIdx: 1,
          hint: 'Sir isaac…',
        },
        tf : {
          q: 'Gravity sirf Earth par exist karti hai.',
          answerT: false,
          hint: 'Planets apni gravity se ghoomte hain.',
        },
      },
      {
        text: `Universal Law: F = G × m₁m₂ / r² where G is gravitational constant 6.67 × 10⁻¹¹ N m² kg⁻².`,
        mcq : {
          q: 'Formula me “r” kya denote karta hai?',
          options: ['Relative velocity', 'Distance between masses', 'Radius of Earth', 'Resultant force'],
          correctIdx: 1,
          hint: 'Do masses ke beech ki…',
        },
        tf : {
          q: 'r badhne se gravitational force badh jaati hai.',
          answerT: false,
          hint: 'Inverse-square par dhyan do.',
        },
      },
      {
        text: `On Earth, all objects fall with an acceleration g ≈ 9.8 m s⁻² (ignoring air resistance).`,
        mcq : {
          q: 'g ki approximate value kya hai?',
          options: ['9.8 m/s²', '9.8 km/s²', '8.9 m/s²', '98 m/s²'],
          correctIdx: 0,
          hint: 'Almost 10 m/s².',
        },
        tf : {
          q: 'g ki value Equator par poles se thodi kam hoti hai.',
          answerT: true,
          hint: 'Earth thodi chhatrakar hai.',
        },
      },
      {
        text: `Mass is constant everywhere but weight (W = m g) changes with g.`,
        mcq : {
          q: 'Weight depend karta hai…',
          options: ['Sirf mass', 'Sirf g', 'Mass aur g dono', 'Sirf volume'],
          correctIdx: 2,
          hint: 'Formula dekh lo.',
        },
        tf : {
          q: 'Moon par aapka mass one-sixth ho jaata hai.',
          answerT: false,
          hint: 'Mass scalar hai, constant.',
        },
      },
    ],
  },

  {
    videoId: 'demo_friction',
    title  : 'Friction & Motion – Class 8',
    segments: [
      {
        text: `Friction is a force that opposes motion between two surfaces in contact.`,
        mcq : {
          q: 'Friction ka direction kis taraf hota hai?',
          options: ['Motion ki direction', 'Opposite to motion', 'Vertical', 'Random'],
          correctIdx: 1,
          hint: 'Oppose karta hai.',
        },
        tf : {
          q: 'Bina roughness ke bhi friction ho sakta hai.',
          answerT: true,
          hint: 'Adhesion forces bhi hain.',
        },
      },
      {
        text: `Static friction prevents motion; kinetic (sliding) friction acts when bodies are moving relative to each other.`,
        mcq : {
          q: 'Kaunsa friction zyada hota hai?',
          options: ['Static', 'Kinetic', 'Rolling', 'Fluid'],
          correctIdx: 0,
          hint: 'Start karna mushkil hota hai.',
        },
        tf : {
          q: 'Sliding block ke chal padne ke baad required force badh jaata hai.',
          answerT: false,
          hint: 'Kinetic < static.',
        },
      },
      {
        text: `Rolling friction is smaller than sliding friction; that’s why wheels make movement easier.`,
        mcq : {
          q: 'Wheels ka main benefit kya hai?',
          options: [
            'Zyada weight uthate hain',
            'Rolling friction kam hoti hai',
            'Decoration ke liye',
            'Air resistance kam hoti hai',
          ],
          correctIdx: 1,
          hint: 'Ball bearings bhi isi wajah se use hote.',
        },
        tf : {
          q: 'Rolling friction > sliding friction.',
          answerT: false,
          hint: 'Opposite yaad rakho.',
        },
      },
      {
        text: `Friction produces heat; rubbing palms makes them warm.`,
        mcq : {
          q: 'Matchstick ko jalane ke liye kaunsa effect use hota hai?',
          options: ['Air pressure', 'Heat from friction', 'Magnetism', 'Electric spark'],
          correctIdx: 1,
          hint: 'Rough surface par strike.',
        },
        tf : {
          q: 'Lubricants friction ko badhate hain.',
          answerT: false,
          hint: 'Grease, oil ka kaam?',
        },
      },
    ],
  },
];

/* -------------------------------------------------- seeding routine */
async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://localhost/guruji');
  console.log('⛏️  connected to Mongo');

  const VideoModel       = mongoose.model(Video.name, VideoSchema,       'videos');
  const ChunkModel       = mongoose.model(Chunk.name, ChunkSchema,       'chunks');
  const QuestionModel    = mongoose.model(Question.name, QuestionSchema, 'questions');
  const InteractionModel = mongoose.model(Interaction.name, InteractionSchema, 'interactions');

  /* wipe previous */
  const ids = lessons.map(l => l.videoId);
  await Promise.all([
    VideoModel.deleteMany({ videoId: { $in: ids } }),
    ChunkModel.deleteMany({ videoId: { $in: ids } }),
    QuestionModel.deleteMany({ videoId: { $in: ids } }),
    InteractionModel.deleteMany({ videoId: { $in: ids } }),
  ]);

  for (const lesson of lessons) {
    /* 1️⃣ video row */
    const transcript = lesson.segments.map(s => s.text).join(' ');
    await VideoModel.create({
      videoId  : lesson.videoId,
      title    : lesson.title,
      channelTitle: 'GuruJi Science',
      duration : lesson.segments.length * 60,
      processed: true,
      processingStatus: 'completed',
      transcript,
    });

    /* 2️⃣ chunks + questions */
    const chunkDocs : Partial<Chunk    >[] = [];
    const questionDocs: Partial<Question>[] = [];

    for (const [idx, seg] of lesson.segments.entries()) {
      const start = idx * 60;
      const end   = start + 59;
      const vec   = await embed(seg.text);

      chunkDocs.push({
        videoId : lesson.videoId,
        idx, startSec: start, endSec: end,
        text: seg.text,
        vector: vec,
      });

      /* MCQ */
      questionDocs.push({
        videoId : lesson.videoId,
        chunkIdx: idx,
        text    : seg.mcq.q,
        type    : QuestionType.MULTIPLE_CHOICE,
        options : seg.mcq.options,
        correctAnswer: seg.mcq.correctIdx.toString(),
        timestamp: start + 20,
        feedback : { correct: 'Bilkul sahi!', incorrect: 'Galat jawaab.' },
        hint     : seg.mcq.hint,
      });

      /* True/False */
      questionDocs.push({
        videoId : lesson.videoId,
        chunkIdx: idx,
        text    : seg.tf.q,
        type    : QuestionType.TRUE_FALSE,
        options : ['True', 'False'],
        correctAnswer: seg.tf.answerT ? '0' : '1',
        timestamp: start + 40,
        feedback : { correct: 'Sahi hai 👍', incorrect: 'Nahin, soch ke dekho.' },
        hint     : seg.tf.hint,
      });
    }

    await ChunkModel.insertMany(chunkDocs);
    const savedQs = await QuestionModel.insertMany(questionDocs);

    /* 3️⃣ a few interactions */
    const users = ['u1', 'u2'];
    const inters: Partial<Interaction>[] = [];
    const sample = savedQs.slice(0, 4);           // first two segments

    sample.forEach((q, idx) => {
      users.forEach((u) => {
        const ans = (idx % 2 === 0) ? q.correctAnswer : '99';   // some correct, some wrong
        inters.push({
          userId : u,
          videoId: lesson.videoId,
          questionId: q._id!.toString(),
          type: InteractionType.ANSWER,
          data: { answer: ans, correct: ans === q.correctAnswer },
          videoTimestamp: q.timestamp,
          interactionTime: new Date(Date.now() - randomBytes(1)[0]*60000),
        });
      });
    });

    await InteractionModel.insertMany(inters);
  }

  /* summary */
  console.log(
    `✅  Seeded ${lessons.length} videos, ` +
    `${await ChunkModel.countDocuments({ videoId: { $in: ids } })} chunks, ` +
    `${await QuestionModel.countDocuments({ videoId: { $in: ids } })} questions, ` +
    `${await InteractionModel.countDocuments({ videoId: { $in: ids } })} interactions`
  );

  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
