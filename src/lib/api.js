import { supabase } from "@/lib/supabase";

// fetch() that sends the signed-in user's token, which every API route requires.
export async function apiFetch(path, init = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
  return fetch(path, { ...init, headers });
}

export function postJSON(path, body) {
  return apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Reads a newline-delimited JSON response (the streamed chat reply) one event at a time.
export async function* readNDJSON(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = done ? "" : lines.pop();
    for (const line of lines) {
      if (line.trim()) yield JSON.parse(line);
    }
    if (done) return;
  }
}
