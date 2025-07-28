import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Set-Cookie", "session_token=; HttpOnly; Path=/; Max-Age=0");
  return res.status(204).end();
}
