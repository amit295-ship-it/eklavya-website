export default async function handler(req: any, res: any) {
  try {
    const lyzrApiKey = process.env.LYZR_API_KEY;
    const lyzrAgentId = process.env.LYZR_AGENT_ID;

    if (!lyzrApiKey || !lyzrAgentId) {
      return res.status(500).json({
        error: "LYZR_API_KEY or LYZR_AGENT_ID missing"
      });
    }

    const userIdentity =
      "visitor_" + Math.random().toString(36).substring(2, 10);

    const apiRes = await fetch(
      "https://voice-livekit.studio.lyzr.ai/v1/sessions/start",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": lyzrApiKey
        },
        body: JSON.stringify({
          agentId: lyzrAgentId,
          userIdentity: userIdentity
        })
      }
    );

    const data = await apiRes.json();

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Internal Server Error"
    });
  }
}