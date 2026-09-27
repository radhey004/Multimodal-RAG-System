const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api";

const token = () => localStorage.getItem("token");


// =====================================================
// Existing request function
// =====================================================

async function request(endpoint, options = {}) {

  const headers = {
    ...(options.headers || {})
  };

  if (token()) {
    headers.Authorization =
      `Bearer ${token()}`;
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  );

  const data =
    await response.json().catch(() => ({}));

  if (!response.ok) {

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    throw new Error(
      data.detail ||
      data.message ||
      "Request failed"
    );
  }

  return data;
}


// =====================================================
// Your existing APIs
// =====================================================

const json = (body) => ({
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});


export const register = (
  full_name,
  email,
  password,
  confirm_password
) =>
  request(
    "/auth/register",
    json({
      full_name,
      email,
      password,
      confirm_password
    })
  );


export const login = (
  email,
  password
) =>
  request(
    "/auth/login",
    json({
      email,
      password
    })
  );


export const googleLogin = (
  id_token
) =>
  request(
    "/auth/google",
    json({
      id_token
    })
  );


export const forgotPassword = (
  email
) =>
  request(
    "/auth/forgot-password",
    json({
      email
    })
  );


export const resetPassword = (
  tokenValue,
  password,
  confirm_password
) =>
  request(
    "/auth/reset-password",
    json({
      token: tokenValue,
      password,
      confirm_password
    })
  );


export const updateProfile = (data) =>
  request(
    "/auth/profile",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    }
  );


export const getDocuments = () =>
  request("/documents/");


export async function uploadDocuments(files) {

  const form = new FormData();

  files.forEach(file =>
    form.append("files", file)
  );

  return request(
    "/documents/upload",
    {
      method: "POST",
      body: form
    }
  );
}


export const getDocument = id =>
  request(`/documents/${id}`);


export const renameDocument = (
  id,
  file_name
) =>
  request(
    `/documents/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        file_name
      })
    }
  );


export const deleteDocument = id =>
  request(
    `/documents/${id}`,
    {
      method: "DELETE"
    }
  );


export const askQuestion = query =>
  request(
    "/chat/",
    json({
      query
    })
  );


// =====================================================
// PDF VIEWER
// =====================================================

export async function getDocumentPdf(documentId) {

  const authToken =
    localStorage.getItem("token");

  if (!authToken) {
    throw new Error(
      "Authentication required"
    );
  }

  const response = await fetch(
    `${API_URL}/documents/${documentId}/pdf`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${authToken}`
      }
    }
  );

  const data =
    await response.json()
      .catch(() => ({}));

  if (!response.ok) {

    throw new Error(
      data.detail ||
      "Failed to load PDF"
    );

  }

  if (!data.url) {

    throw new Error(
      "PDF URL not found"
    );

  }

  return data.url;
}