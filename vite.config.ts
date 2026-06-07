import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const sarvamApiKey = env.SARVAM_API_KEY || "";
  const lyzrApiKey = env.LYZR_API_KEY || "";
  const lyzrAgentId = env.LYZR_AGENT_ID || "";

  return {
    root: ".",
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    server: {
      port: 5173,
    },
    plugins: [
      {
        name: "voice-call-proxy",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === "/api/voice-call/start" && req.method === "POST") {
              try {
                if (!lyzrApiKey || !lyzrAgentId) {
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ error: "LYZR_API_KEY or LYZR_AGENT_ID is not configured in .env" }));
                  return;
                }

                const systemPrompt = `You are Sahyog, the friendly AI Voice Assistant of the Eklavya Career Initiative. Respond in a warm, welcoming mix of Hindi and English (Hinglish) or pure Hindi. Keep your answers brief (1-2 sentences) and suitable for a voice call.
Eklavya Career Initiative is a volunteer-driven forum helping students and job seekers from underserved backgrounds with career guidance, skilling, mentorship, financial literacy, communication skills, and digital education.
Core contact details to share:
- WhatsApp/Phone: +91 7899577788
- WhatsApp Channel: https://whatsapp.com/channel/0029VbCNimtHrDZkR7wx7T2e
- Email: eklavyacareerinitiative@gmail.com
- Instagram: https://www.instagram.com/eklavyainitiative
- LinkedIn: https://www.linkedin.com/company/eklavya-career-initiative
- Website: https://eklavya-website.vercel.app/
- Google Reviews: https://g.page/r/CQ84hAOd5HNNEAE/review
We operate on a modest volunteer budget. If users want to help, ask them to follow our Instagram/LinkedIn and write a review on our Google Review page!
Our programs:
1. Support a Child Build a Dream: financial sponsorship for tuition & competitive exams.
2. Samvaad Se Safalta: 52 weeks of 1-on-1 spoken English mentoring.
3. Love Your Career Mould Your Career: counseling for grades 9-12, resume building, interview prep.
4. Skilling to Learn, Learn to Earn: training in Advanced Excel, Data Analytics, Agile methodology.
5. AI Internship & Practitioner Programs: Curated batch-based programs for students (AI Internship) and working professionals (AI Practitioner) mentored by MCT Amit Kumar Gupta. Covers layman AI/ML/DL, data science, use-cases (Netflix, YouTube, D-Mart, crop & Digit car insurance), LLM architectures, vectorization, Agentic AI, Agentic Workflows, building custom GPTs (Gemini Gems / GPTs), RAG systems (NotebookLM, Claude Skills, Claude Artifacts), and creating curated personal portfolio websites. Clients contact us on WhatsApp to inquire and know more about batches.
6. Expert Lectures & Workshops: Scrum certifications, Advanced Excel, Financial Literacy (markets/investing), and Digital Transformation corporate/academic sessions.
7. Activities, Collaborations & Events: Active engagements at student level (mentorship, conversation clubs), college level (institutional collaborations and formal MOUs), and corporate level (Agile and Advanced Excel skilling). Key partners: Connect Shiksha, Cubicle Buddies, SYJ Roots, Sahara Society, and Naxlogic.
Motto: "No barriers. Just belief. Be Eklavya."`;

                const userIdentity = "visitor_" + Math.random().toString(36).substring(7);
                const apiRes = await fetch("https://voice-livekit.studio.lyzr.ai/v1/sessions/start", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-api-key": lyzrApiKey
                  },
                  body: JSON.stringify({
                    agentId: lyzrAgentId,
                    userIdentity: userIdentity,
                    agentConfig: {
                      prompt: systemPrompt
                    }
                  })
                });

                if (!apiRes.ok) {
                  const errText = await apiRes.text();
                  throw new Error(`Lyzr API error: ${errText}`);
                }

                const data = await apiRes.json();
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(data));
              } catch (error: any) {
                console.error("Voice assistant proxy error:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: error.message || "Internal Server Error" }));
              }
            } else {
              next();
            }
          });
        }
      }
    ]
  };
});
