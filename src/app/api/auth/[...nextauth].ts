import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { generateToken, verifyToken } from "../../../utils/auth"; // Correct the import path
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case "POST":
      try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user || !bcrypt.compareSync(password, user.password)) {
          return res.status(401).json({ error: "Invalid username or password" });
        }

        const token = generateToken(user.id);
        res.setHeader(
          "Set-Cookie",
          `session_token=${token}; HttpOnly; Path=/; Max-Age=3600`
        ); // Token expires in 1 hour
        return res.status(200).json(user);
      } catch (error) {
        console.error("Error during authentication:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

    case "GET":
      try {
        const token = req.cookies["session_token"];
        if (!token) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const authenticatedUser = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });
        return res.status(200).json(authenticatedUser);
      } catch (error) {
        console.error("Error during authentication:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

    case "DELETE":
      try {
        res.setHeader(
          "Set-Cookie",
          "session_token=; HttpOnly; Path=/; Max-Age=0"
        );
        return res.status(204).end();
      } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

    default:
      res.setHeader("Allow", ["POST", "GET", "DELETE"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
};

