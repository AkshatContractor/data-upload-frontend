import { GoogleAuth } from "google-auth-library";
import axios from "axios";
import FormData from "form-data";

export async function POST(req: Request) {
  const allowedIps = process.env.ALLOWED_IPS
  ? process.env.ALLOWED_IPS.split(",").map(ip => ip.trim())
  : [];

  const ipHeader = req.headers.get("x-forwarded-for");
  const clientIp = ipHeader ? ipHeader.split(",")[0].trim() : "unknown";

  if (!allowedIps.includes(clientIp)) {
    console.log("Upload attempt from non-allowed IP:", clientIp);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Uploads are temporarily disabled — feature under development.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file)
      return new Response("No file provided", { status: 400 });

    const BASE_URL = process.env.BACKEND_SERVICE_URL!;
    const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY!);
    const auth = new GoogleAuth({ credentials });
    const client = await auth.getIdTokenClient(BASE_URL);
    const token = await client.idTokenProvider.fetchIdToken(BASE_URL);

    const cloudForm = new FormData();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    cloudForm.append("file", buffer, file.name);

    const headers = {
      ...cloudForm.getHeaders(),
      Authorization: `Bearer ${token}`,
    };

    const response = await axios.post(`${BASE_URL}/ingest/upload`, cloudForm, { headers });

    return new Response(JSON.stringify(response.data), {
      status: response.status,
    });
  } catch (err: any) {
    console.error("Upload failed:", err.response?.data || err.message);
    return new Response(
      JSON.stringify({ error: err.response?.data || err.message }),
      { status: err.response?.status || 500 }
    );
  }
}
