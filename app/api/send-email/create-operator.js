// pages/api/create-operator.js
import { admin } from "@/lib/firebaseAdminConfig";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password, displayName } = req.body;

  try {
    const user = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    res.status(200).json({ message: "Operator account created", uid: user.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
