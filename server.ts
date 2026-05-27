import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set standard limits for larger payloads, e.g. base64 PDFs
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/extract", async (req, res) => {
    const { fileB64, subjects } = req.body;

    if (!fileB64) {
      return res.status(400).json({ error: "Missing PDF data in request" });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(400).json({ 
        error: "GEMINI_API_KEY environment variable is not configured. Please define it in your AI Studio Settings > Secrets panel." 
      });
    }

    try {
      // Lazy initialization of GoogleGenAI
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      // Format subjects as clean list
      const subjectsList = Array.isArray(subjects) ? subjects : ["Physics", "Chemistry", "Biology"];

      // Call Gemini 3.5 Flash Model
      const modelName = "gemini-3.5-flash";
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: fileB64
                }
              },
              {
                text: `You are an expert exam paper parsing agent. 
Analyze this uploaded PDF question paper with extreme meticulousness.
Your mission is to extract EVERY SINGLE multiple-choice question (MCQ) from page 1 to the absolute last page of the document.

CRITICAL INSTRUCTIONS:
1. Do NOT stop after a certain number of questions. Even if there are 20, 30, or 50+ questions, you must extract ALL of them page-by-page.
2. Do NOT summarize, abbreviate, or shorten any questions. Extract every item completely with its full body text.
3. You must actively scan each page of the PDF to locate questions. Even if some pages have more questions, list them all.
4. Each question belongs to one of the following subject compartments: ${subjectsList.join(', ')}. If a question's subject is not explicitly written on the paper, evaluate its scientific concept and categorize it into the correct domain (e.g. Kinematics, Waves, Thermodynamics to "Physics"; Organic reactions, atomic orbitals to "Chemistry"; Genetics, cells to "Biology"; Trigonometry, calculus to "Mathematics").
5. Return exactly 4 options. If a question is a multiple-choice question but has slightly noisy option characters, clean the labels (e.g., "A. Option content" -> "Option content").
6. The correct answer index must be accurate (0 to 3 index corresponding to options 0-3).
7. Preserve original sequence numbers inside the 'question' text if they exist (e.g., "Q12. What is the value of...") so students can correlate with the PDF pages.
8. Render mathematical values, equations, chemical formulas, and indices beautifully in clear readable text formats (such as x^2, H2O, etc.).

Extract absolutely all of them. Do not be lazy. You are rewarded for complete extraction.`
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "A complete exhaustively-extracted list of all multiple-choice questions in the PDF.",
            items: {
              type: Type.OBJECT,
              properties: {
                subject: {
                  type: Type.STRING,
                  description: "Subject name exactly matching one of the requested compartments"
                },
                question: {
                  type: Type.STRING,
                  description: "Full descriptive text of the question"
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Exactly 4 options"
                },
                correct: {
                  type: Type.INTEGER,
                  description: "0-based integer index of the correct option (0-3)"
                },
                page: {
                  type: Type.INTEGER,
                  description: "1-based page number where this question appears in the document"
                }
              },
              required: ["subject", "question", "options", "correct", "page"]
            }
          }
        }
      });

      const responseText = response.text ? response.text.trim() : "";
      
      try {
        const parsedQuestions = JSON.parse(responseText);
        return res.json({ success: true, questions: parsedQuestions });
      } catch (parseErr: any) {
        console.error("Failed to parse AI output as JSON. Raw output:", responseText);
        return res.status(500).json({
          error: "AI returned invalid JSON format. Please try again.",
          rawOutput: responseText
        });
      }

    } catch (err: any) {
      console.error("Gemini server-side error:", err);
      // Propagate exact message or error details back to the client
      const errMsg = err?.message || String(err);
      return res.status(500).json({ 
        error: errMsg,
        details: err?.status || err?.code ? { code: err.code, status: err.status } : undefined
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
