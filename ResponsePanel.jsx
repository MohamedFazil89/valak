import React, { useEffect, useState } from "react";
import axios from "axios";
import RoutesPng from "../assets/routes.png";

export default function Sidebar({
  setSnippetCode,
  setSnippetFile,
  setUrl,
  setMethod,
  setBody,
  base,
}) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRouteOpen, setIsRouteOpen] = useState(false);

  async function loadRoutes() {
    try {
      setLoading(true);
      const res = await axios.get("/routes");
      setRoutes(res.data || []);
    } catch (err) {
      console.error("❌ Failed to load routes:", err.message);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCode(file, endpoint, methodType) {
    try {
      const res = await axios.get("/code", {
        params: { file, endpoint, method: methodType },
      });

      // Update snippet panel
      setSnippetCode(res.data.code || "// no code found");
      setSnippetFile(file);

      // Update request panel
      const fullUrl = (base || "") + endpoint;
      setUrl(fullUrl);
      const upperMethod = (methodType || "GET").toUpperCase();
      setMethod(upperMethod);

      // ✅ Generate dummy body from AI if needed
      if (["POST", "PUT", "PATCH"].includes(upperMethod)) {
        let exampleBody = res.data.exampleBody;

        // If backend didn't return a body, call AI generation endpoint
        if (!exampleBody) {
          const aiRes = await axios.post("/generate-testcases", {
            endpoint,
            numCases: 1,
          });
          exampleBody = aiRes.data.cases?.[0] || { key: "value" };
        }

        setBody(JSON.stringify(exampleBody, null, 2));
      } else {
        setBody(""); // GET/DELETE has no body
      }
    } catch (err) {
      setSnippetCode("// ❌ Failed to load code: " + err.message);
      setBody("");
    }
  }

  useEffect(() => {
    if (isRouteOpen) {
      loadRoutes();
      document.documentElement.style.setProperty("--navbar-gap-with", "340px");
    } else {
      document.documentElement.style.setProperty("--navbar-gap-with", "100px");
    }
  }, [isRouteOpen]);

  return (
    <div className="sidebar-container" style={{ display: "flex" }}>
      <aside className="sidebar card-style">
        <span
          onClick={() => setIsRouteOpen(!isRouteOpen)}
          className="Router-icon-text"
          style={{ cursor: "pointer" }}
        >
          <img src={RoutesPng} alt="routes logo" />
          <br />
          Routes
        </span>
      </aside>

      {isRouteOpen && (
        <aside
          className="routes-panel card-style"
          style={{
            width: "240px",
            marginLeft: "8px",
            maxHeight: "calc(50vh - 80px)",
            overflowY: "auto",
          }}
        >
          <div className="routes-list">
            <p>
              <img src={RoutesPng} alt="routes logo" /> Routes
            </p>

            {loading && <div className="tiny muted-note">Loading…</div>}
            {!loading && routes.length === 0 && (
              <div className="tiny muted-note">No routes found</div>
            )}

            {routes.map((r, i) => (
              <div
                key={i}
                className="list-item"
                onClick={() => loadCode(r.file, r.path, r.method)}
                style={{ cursor: "pointer", margin: "1rem" }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div
                    className="badge-verb request-method"
                    style={{
                      backgroundColor:
                        r.method === "post"
                          ? "var(--method-color-post)"
                          : r.method === "put"
                          ? "var(--method-color-put)"
                          : r.method === "delete"
                          ? "var(--method-color-delete)"
                          : r.method === "patch"
                          ? "var(--method-color-patch)"
                          : "var(--method-color-get)",
                    }}
                  >
                    {r.method.toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 700 }}>{r.path}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
