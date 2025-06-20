export const API_BASE = "http://localhost:8000";

export async function createUser(data) {
  return fetch(`${API_BASE}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json());
}