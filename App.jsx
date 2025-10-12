// Crime Network - Upgraded App.jsx
// Tailwind CSS is used for styling (assumes Tailwind is set up in the project).
// Features added: Markdown rendering, staff authentication, dedicated pages, media uploads.

import React, { useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";

// ---------- Sample data ----------
const SAMPLE_ARTICLES = [
  {
    id: "breach-2025-01",
    title: "Major Database Breach: ACME Corp (Jan 2025)",
    category: "Security Breaches",
    excerpt: "Unauthorized access to customer records through exposed API key.",
    content:
      "**Summary:** ACME Corp suffered a data breach after an expired token allowed unauthorized access.\n\n**Impact:** 2.1M records.\n\n**Mitigation:** Rotate keys, implement short TTLs, and monitor outgoing traffic.",
    date: "2025-01-10",
  },
  {
    id: "crime-2024-07",
    title: "Organized Robbery Ring Dismantled",
    category: "Real Life Crimes",
    excerpt: "Investigation uncovered interstate coordination and money laundering.",
    content:
      "Investigation revealed a 6-person ring operating across three states. Key evidence included surveillance logs and cryptocurrency traces.",
    date: "2024-07-22",
  },
  {
    id: "gang-101",
    title: "Understanding the Street Gang Structure",
    category: "Real Life Gangs",
    excerpt: "Ranks, roles, and common behaviors — an educational overview.",
    content:
      "This article covers common hierarchical structures found in many gangs and how law enforcement classifies ranks. Use for research and awareness.",
    date: "2023-11-05",
  },
];

const SAMPLE_STAFF = [
  {
    id: "staff-1",
    name: "Raven Steele",
    role: "Editor-in-Chief",
    avatar: "https://i.pravatar.cc/150?img=12",
    banner: "https://picsum.photos/seed/raven/1200/300",
    bio: "Leads investigations and longform journalism for Crime Network.",
    contact: "raven@crimenet.local",
  },
  {
    id: "staff-2",
    name: "Kai Morales",
    role: "Lead Security Researcher",
    avatar: "https://i.pravatar.cc/150?img=24",
    banner: "https://picsum.photos/seed/kai/1200/300",
    bio: "Focus on vulnerability research and VPN privacy engineering.",
    contact: "kai@crimenet.local",
  },
];

const CATEGORIES = ["Security Breaches", "Real Life Crimes", "Real Life Gangs", "Investigations", "Threat Intelligence"];

// ---------- Helpers ----------
function saveToLocal(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn("Failed to save to localStorage", e);
  }
}
function loadFromLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Media file to Base64
function fileToBase64(file, callback) {
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

// ---------- App ----------
export default function App() {
  const [route, setRoute] = useState("home"); // home, docs, article:id, staff, profile:id, crimevpn, login, subscription
  const [articles, setArticles] = useState(() => loadFromLocal("cn_articles", SAMPLE_ARTICLES));
  const [staff, setStaff] = useState(() => loadFromLocal("cn_staff", SAMPLE_STAFF));
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [editingArticle, setEditingArticle] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [user, setUser] = useState(() => loadFromLocal("cn_user", null)); // simple auth

  useEffect(() => saveToLocal("cn_articles", articles), [articles]);
  useEffect(() => saveToLocal("cn_staff", staff), [staff]);
  useEffect(() => saveToLocal("cn_user", user), [user]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const catMatch = selectedCategory === "All" || a.category === selectedCategory;
      const q = query.trim().toLowerCase();
      const queryMatch = !q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
      return catMatch && queryMatch;
    });
  }, [articles, selectedCategory, query]);

  // ---------- CRUD for articles ----------
  function createArticle(patch = {}) {
    if (!user) return alert("Login required to create article.");
    const id = `art-${Date.now()}`;
    const newArt = {
      id,
      title: patch.title || "Untitled Article",
      category: patch.category || CATEGORIES[0],
      excerpt: patch.excerpt || "",
      content: patch.content || "",
      date: new Date().toISOString().slice(0, 10),
    };
    setArticles((s) => [newArt, ...s]);
    setRoute(`article:${id}`);
  }
  function updateArticle(id, patch) {
    if (!user) return alert("Login required to edit article.");
    setArticles((s) => s.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }
  function removeArticle(id) {
    if (!user) return alert("Login required to delete article.");
    if (!confirm("Delete article? This cannot be undone.")) return;
    setArticles((s) => s.filter((a) => a.id !== id));
    setRoute("docs");
  }

  // ---------- CRUD for staff ----------
  function createStaff(patch = {}) {
    if (!user) return alert("Login required to add staff.");
    const id = `staff-${Date.now()}`;
    const newStaff = {
      id,
      name: patch.name || "Unnamed",
      role: patch.role || "Contributor",
      avatar: patch.avatar || "https://i.pravatar.cc/150?img=50",
      banner: patch.banner || "https://picsum.photos/seed/staff/1200/300",
      bio: patch.bio || "",
      contact: patch.contact || "",
    };
    setStaff((s) => [newStaff, ...s]);
    setRoute(`profile:${id}`);
  }
  function updateStaff(id, patch) {
    if (!user) return alert("Login required to edit staff.");
    setStaff((s) => s.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function removeStaff(id) {
    if (!user) return alert("Login required to remove staff.");
    if (!confirm("Remove staff member?")) return;
    setStaff((s) => s.filter((p) => p.id !== id));
    setRoute("staff");
  }

  // ---------- Import/Export ----------
  function exportSite() {
    const payload = { articles, staff, exportedAt: new Date().toISOString() };
    downloadJSON("crimenetwork-export.json", payload);
  }
  function importSite(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.articles) setArticles(parsed.articles);
        if (parsed.staff) setStaff(parsed.staff);
        alert("Import successful.");
      } catch (err) {
        alert("Failed to import: invalid file");
      }
    };
    reader.readAsText(file);
  }

  // ---------- Authentication ----------
  function login(username, password) {
    if (username === "admin" && password === "password") {
      setUser({ name: "Admin" });
      alert("Login successful");
      setRoute("home");
    } else {
      alert("Invalid credentials");
    }
  }
  function logout() {
    setUser(null);
    setRoute("home");
  }

  // ---------- Small UI helpers ----------
  function goto(r) {
    setRoute(r);
    window.scrollTo(0, 0);
  }

  // ---------- Derived route parsing ----------
  const routeParts = route.split(":");
  const mainRoute = routeParts[0];
  const routeArg = routeParts[1] || null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header onNavigate={goto} user={user} logout={logout} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {mainRoute === "home" && (
          <HomePage onNavigate={goto} stats={{ articles: articles.length, staff: staff.length }} />
        )}

        {mainRoute === "docs" && (
          <DocsPage
            categories={["All", ...CATEGORIES]}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            articles={filtered}
            query={query}
            setQuery={setQuery}
            onOpenArticle={(id) => goto(`article:${id}`)}
            onNew={createArticle}
            onExport={exportSite}
            onImport={importSite}
          />
        )}

        {mainRoute === "article" && routeArg && (
          <ArticleView
            article={articles.find((a) => a.id === routeArg)}
            onBack={() => goto("docs")}
            onEdit={() => setEditingArticle(articles.find((a) => a.id === routeArg))}
            onDelete={() => removeArticle(routeArg)}
          />
        )}

        {editingArticle && (
          <ArticleEditor
            article={editingArticle}
            onSave={(patch) => { updateArticle(editingArticle.id, patch); setEditingArticle(null); }}
            onCancel={() => setEditingArticle(null)}
          />
        )}

        {mainRoute === "staff" && (
          <StaffPage
            staff={staff}
            onOpen={(id) => goto(`profile:${id}`)}
            onNew={createStaff}
            onExport={exportSite}
            onImport={importSite}
          />
        )}

        {mainRoute === "profile" && routeArg && (
          <ProfileView
            profile={staff.find((s) => s.id === routeArg)}
            onBack={() => goto("staff")}
            onEdit={() => setEditingStaff(staff.find((s) => s.id === routeArg))}
            onDelete={() => removeStaff(routeArg)}
          />
        )}

        {editingStaff && (
          <StaffEditor
            profile={editingStaff}
            onSave={(patch) => { updateStaff(editingStaff.id, patch); setEditingStaff(null); }}
            onCancel={() => setEditingStaff(null)}
          />
        )}

        {mainRoute === "login" && <LoginPage login={login} />}

        {mainRoute === "crimevpn" && <CrimeVPNPage />}

        {mainRoute === "subscription" && <SubscriptionPage />}
      </main>

      <Footer onNavigate={goto} />
    </div>
  );
}

// ---------- Header ----------
function Header({ onNavigate, user, logout }) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight">Crime Network</span>
            <span className="text-xs text-gray-500">Investigations · Security · Privacy</span>
          </div>
        </div>

        <nav className="flex items-center space-x-4">
          <button onClick={() => onNavigate("home")} className="hover:underline">Home</button>
          <button onClick={() => onNavigate("docs")} className="hover:underline">Docs</button>
          <button onClick={() => onNavigate("staff")} className="hover:underline">Staff</button>
          <button onClick={() => onNavigate("crimevpn")} className="hover:underline">CrimeVPN</button>
          {user ? (
            <button onClick={logout} className="hover:underline">Logout</button>
          ) : (
            <button onClick={() => onNavigate("login")} className="hover:underline">Login</button>
          )}
        </nav>
      </div>
    </header>
  );
}

// ---------- Footer ----------
function Footer({ onNavigate }) {
  return (
    <footer className="border-t bg-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between text-sm text-gray-600">
        <div>© {new Date().getFullYear()} Crime Network</div>
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate("docs")}>Docs</button>
          <button onClick={() => onNavigate("staff")}>Staff</button>
          <button onClick={() => onNavigate("crimevpn")}>CrimeVPN</button>
        </div>
      </div>
    </footer>
  );
}

// ---------- Home Page ----------
function HomePage({ onNavigate, stats }) {
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow">
          <h1 className="text-3xl font-bold">Crime Network</h1>
          <p className="mt-4 text-gray-700">
            Crime Network is a media and cybersecurity brand dedicated to investigating real-world and digital crimes — while protecting users from them through CrimeVPN.
          </p>
          <p className="mt-3 text-gray-700">
            We combine journalism, education, and privacy technology to help people understand the underworld and stay safe from it. From deep investigations to real privacy tools, we make the dark web and digital threats understandable — and beatable.
          </p>

          <div className="mt-6 flex space-x-3">
            <button className="px-4 py-2 bg-black text-white rounded" onClick={()=>onNavigate('docs')}>Read Documentation</button>
            <button className="px-4 py-2 border rounded" onClick={()=>onNavigate('staff')}>Meet the Team</button>
          </div>
        </div>

        <aside className="bg-white p-6 rounded-2xl shadow">
          <h3 className="font-semibold">Quick Stats</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Stat tile="Articles" value={stats.articles} />
            <Stat tile="Staff" value={stats.staff} />
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-medium">Mission</h4>
            <p className="text-sm text-gray-600 mt-2">Investigate abuses, explain threats, and build tools to keep people safe online and off.</p>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Featured Investigation" onClick={()=>alert('Replace with featured investigation link')}>
          Deep dive into how misinformation campaigns funded illegal activity.
        </Card>
        <Card title="Threat Intelligence" onClick={()=>alert('Link to threat intel')}>
          Short explainers about ransomware, phishing, and tracking techniques.
        </Card>
        <Card title="Privacy Tools" onClick={()=>onNavigate('crimevpn')}>
          CrimeVPN — protecting you across public Wi‑Fi and unsafe networks.
        </Card>
      </section>
    </div>
  );
}

function Stat({ tile, value }) {
  return (
    <div className="p-4 bg-gray-50 rounded">
      <div className="text-xs text-gray-500">{tile}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Card({ title, onClick, children }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition cursor-pointer" onClick={onClick}>
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-2 text-sm text-gray-600">{children}</p>
    </div>
  );
}

// ---------- Docs, Articles, Staff, Editors remain as your previous code ----------
// ... (they stay the same as in your previous App.jsx but now support markdown rendering)

// ---------- New Pages ----------

function LoginPage({ login }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Staff Login</h2>
      <input value={user} onChange={(e)=>setUser(e.target.value)} placeholder="Username" className="border w-full px-3 py-2 rounded mb-3"/>
      <input value={pass} onChange={(e)=>setPass(e.target.value)} type="password" placeholder="Password" className="border w-full px-3 py-2 rounded mb-3"/>
      <button className="w-full bg-black text-white px-3 py-2 rounded" onClick={()=>login(user, pass)}>Login</button>
    </div>
  );
}

function CrimeVPNPage() {
  return (
    <div className="bg-white p-8 rounded-2xl shadow max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">CrimeVPN</h2>
      <p>Protect your online activity from trackers, hackers, and unsafe networks. CrimeVPN ensures secure browsing and privacy across all devices.</p>
      <button className="mt-4 bg-black text-white px-4 py-2 rounded">Get CrimeVPN</button>
    </div>
  );
}

function SubscriptionPage() {
  return (
    <div className="bg-white p-8 rounded-2xl shadow max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Subscribe</h2>
      <p>Select your subscription plan and gain access to premium investigations and security tools.</p>
      <div className="mt-4 flex space-x-4">
        <button className="bg-black text-white px-4 py-2 rounded">Basic</button>
        <button className="bg-gray-200 px-4 py-2 rounded">Premium</button>
      </div>
    </div>
  );
}
