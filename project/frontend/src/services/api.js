const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("token");
}


async function request(
  endpoint,
  options = {}
) {
  const token = getToken();

  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  );

  const data =
    await response.json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.message ||
      "Something went wrong"
    );
  }

  return data;
}


// =========================
// Authentication
// =========================

export async function register(
  name,
  email,
  password
) {
  return request(
    "/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    }
  );
}


export async function login(
  email,
  password
) {
  return request(
    "/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    }
  );
}


// =========================
// Documents
// =========================

export async function getDocuments() {
  return request(
    "/documents/"
  );
}


export async function uploadDocuments(
  files
) {
  const formData =
    new FormData();

  files.forEach(
    (file) => {
      formData.append(
        "files",
        file
      );
    }
  );

  return request(
    "/documents/upload",
    {
      method: "POST",
      body: formData
    }
  );
}


export async function getDocument(
  documentId
) {
  return request(
    `/documents/${documentId}`
  );
}


export async function renameDocument(
  documentId,
  fileName
) {
  return request(
    `/documents/${documentId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        file_name:
          fileName
      })
    }
  );
}


export async function deleteDocument(
  documentId
) {
  return request(
    `/documents/${documentId}`,
    {
      method: "DELETE"
    }
  );
}


// =========================
// Chat
// =========================

export async function askQuestion(
  query
) {
  return request(
    "/chat/",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        query
      })
    }
  );
}