import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const GEMINI_MODEL = "gemini-2.5-flash";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function extractText(resp) {
    try {
        const text =
            resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
            resp?.candidates?.[0]?.content?.parts?.[0]?.text ??
            resp?.response?.candidates?.[0]?.content?.text;
        return text ?? JSON.stringify(resp, null, 2);
    } catch (err) {
        console.error("Error extracting text:", err);
        return JSON.stringify(resp, null, 2);
    }
}

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, files, model } = req.body; // Diubah dari 'file' ke 'files'

        // Penanganan API Key Dinamis
        const apiKey = req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(400).json({ error: "API Key is missing. Please set it in Settings." });
        }
        const ai = new GoogleGenAI({ apiKey });

        if (!Array.isArray(messages)) throw new Error("messages must be an array");

        const userMessage = messages[messages.length - 1].content;
        const lowerMsg = userMessage.toLowerCase();

        // Heuristik sederhana untuk deteksi permintaan generate gambar
        if (lowerMsg.includes('create image') ||
            lowerMsg.includes('generate image') ||
            lowerMsg.includes('draw') ||
            lowerMsg.includes('buat gambar') ||
            lowerMsg.includes('buatkan gambar')) {

            console.log("Attempting to generate image for:", userMessage);

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash-exp',  // Model eksperimental
                    contents: userMessage,
                });

                console.log("Gemini Image Response:", JSON.stringify(response, null, 2));

                // Ekstrak gambar dari response parts
                let imageBytes = null;
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        imageBytes = part.inlineData.data;
                        break;
                    }
                }

                if (imageBytes) {
                    res.json({ image: imageBytes });
                } else {
                    console.error("No image data found in response");
                    res.status(500).json({ error: "Failed to generate image: No image data returned." });
                }
                return; // Berhenti di sini, jangan lanjut ke bawah
            } catch (imgErr) {
                console.error("Error calling Gemini Image:", imgErr);
                let errorMsg = imgErr.message;
                if (imgErr.message.includes("RESOURCE_EXHAUSTED")) {
                    errorMsg = "Quota Exceeded (RESOURCE_EXHAUSTED). Please try again later or check your API limits.";
                }
                res.status(500).json({ error: errorMsg });
                return; // Berhenti di sini
            }
        }


        // Bangun array contents (multimodal jika ada file)
        let contents;
        if (files && files.length > 0) {
            console.log(`Processing multimodal request with ${files.length} file(s)`);

            // Bangun array parts dengan teks dan semua file
            const parts = [{ text: userMessage }];
            files.forEach(file => {
                parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
            });

            contents = [
                {
                    role: 'user',
                    parts
                }
            ];

            // Jika ada pesan sebelumnya, sertakan dalam history
            if (messages.length > 1) {
                const previousMessages = messages.slice(0, -1).map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.content }]
                }));
                contents = [...previousMessages, ...contents];
            }
        } else {
            contents = messages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            }));
        }

        const resp = await ai.models.generateContent({
            model: model || GEMINI_MODEL, // Gunakan model yang dipilih atau default
            contents
        });

        res.json({ result: extractText(resp) });
    } catch (err) {
        console.error("Error generating content:", err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));
