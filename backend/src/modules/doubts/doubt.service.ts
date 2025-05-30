import { Injectable, Logger } from "@nestjs/common";
import { DoubtDTO, GetDoubtDTO } from "./doubt.dto";
import { Doubts, DoubtsDocument } from "./doubt.schema";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import * as path from 'path';
import { execFile } from 'child_process';
import * as fs from 'fs';
const FormData = require('form-data');


@Injectable()
export class DoubtService {
    private readonly apiUrl = 'https://litellm-data.penpencil.co/v1/chat/completions';
    private readonly apiKey = 'sk-z6Gd3ZjZcdbEx_x5zrlI6Q';

    private readonly logger = new Logger(DoubtService.name);
    constructor(
        @InjectModel(Doubts.name) private questionModel: Model<DoubtsDocument>,
    ) { }

    async saveDoubt(body: DoubtDTO) {
        const doubt = await this.questionModel.create(body)
        return doubt
    }


    async getDoubts(body: GetDoubtDTO) {
        const { videoId, userId } = body;
        const query: any = {};
        if (videoId) query.videoId = videoId;
        if (userId) query.userId = userId;

        const doubts = await this.questionModel.find(query).exec();
        return doubts;
    }

    async getNotes(body: GetDoubtDTO) {
        const doubts = await this.getDoubts(body);
        const doubtString = JSON.stringify(doubts);

const prompt = `You are given a list of user-submitted doubts related to a video.
Format the following for a professional, interactive PDF:
- Add a title: "Doubts & Answers Summary"
- For each doubt, use the format:
  "Doubt 1:" (bold), then the doubt text.
  "Answer 1:" (bold), then the answer text.
- Add extra spacing between each pair.
- Do not include any headers, footers, or explanations.
- Output should be clean, with clear separation and numbering.
Here is the list of doubts: ${doubtString}`;

        try {
            const response = await axios.post(
                this.apiUrl,
                {
                    model: 'gpt-4.1',
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            const textResponse = response.data.choices[0].message.content;

            const pdfFile = await this.getPDF(textResponse);

            const uploadedFile = await this.uploadFileToS3(pdfFile);

            fs.unlinkSync(pdfFile);
            return { pdfUrl: uploadedFile?.baseUrl + uploadedFile?.key }

        } catch (error) {
            throw error
        }
    }

    async getPDF(text: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const outputFile = 'output.pdf';

            const scriptPath = path.resolve(process.cwd(), '../transcription/pdf.py');
            const pythonCmd = 'python3';

            execFile(pythonCmd, [scriptPath, text], (error, stdout, stderr) => {
                if (error) {
                    console.error('PDF Error:', stderr);
                    reject(error);
                } else {
                    console.log('PDF Output:', stdout);
                    resolve(outputFile);
                }
            });
        });
    }

    async uploadFileToS3(filePath: string) {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        const headers = {
            ...form.getHeaders(),
            'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
            'integration-with': '',
            'sec-ch-ua-mobile': '?0',
            'client-version': '2.3.13',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://www.pw.live/',
            'randomId': '7ec98178-a2c1-47db-b6c3-3d69d390c67f',
            'client-id': '5eb393ee95fab7468a79d189',
            'client-type': 'WEB',
            'sec-ch-ua-platform': '"macOS"',
        };

        try {
            const response = await axios.post('https://api.penpencil.co/v1/files', form, { headers });
            return response?.data?.data;
        } catch (error: any) {
            console.error('Upload failed:', error.response?.data || error.message);
            throw error;
        }
    }
}