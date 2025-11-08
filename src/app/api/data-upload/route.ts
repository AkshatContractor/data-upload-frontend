import { GoogleAuth } from "google-auth-library";
import axios from "axios";
import FormData from "form-data";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    const BASE_URL = process.env.BACKEND_SERVICE_URL!;
    const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY!);
    const auth = new GoogleAuth({ credentials });
    const client = await auth.getIdTokenClient(BASE_URL);
    const token = await client.idTokenProvider.fetchIdToken(BASE_URL);

    // Build multipart/form-data body
    const cloudForm = new FormData();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    cloudForm.append("file", buffer, file.name);

    const headers = {
      ...cloudForm.getHeaders(),
      Authorization: `Bearer ${token}`,
    };

    const response = await axios.post(
      `${BASE_URL}/ingest/upload`,
      cloudForm,
      { headers }
    );

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
