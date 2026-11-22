import { getToken } from "./auth";

export async function uploadImage(file: File) {
  const form = new FormData();
  form.append("file", file);

  const token = getToken();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) throw new Error("Upload failed");

  return await res.json();
}
