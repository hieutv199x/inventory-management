import { NextApiRequest, NextApiResponse } from "next";
import { getSessionServer } from "@/utils/auth";

export default async function session(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = await getSessionServer(req, res);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.status(200).json({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    });
  } catch (error) {
    console.error("Session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
