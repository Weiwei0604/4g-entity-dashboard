"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed", "#0891b2", "#be185d"];

export default function Home() {

  const supabase = useMemo(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ), []
  );

  // Auth
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [articles, setArticles] = useState([]);
  const [entities, setEntities] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/sheets");
      const data = await res.json();

      setArticles((data.articles || []).slice(0, 10));
      setEntities((data.entities || []).slice(0, 10));
      setSummary(data.summary || []);
    } catch (err) {
      console.log("資料抓不到", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);

      if (user) fetchData();
    };
    checkUser();
  }, [supabase]);

  
  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
    } else {
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // loading畫面
  if (authLoading || loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-2xl shadow-lg w-80 space-y-4">
          <h2 className="text-xl font-bold text-center">登入系統</h2>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-blue-600 text-white p-3 rounded">
            登入
          </button>
        </form>
      </div>
    );
  }


  const pieChartData = summary.slice(0, 7).map(item => ({
    name: item[0],
    value: Number(item[2])
  }));

  const barChartData = entities.slice(0, 10).map(item => ({
    name: `第${item[0]}名`,
    count: Number(item[3])
  }));

  return (
    <main className="max-w-6xl mx-auto p-8 font-sans">

      {/* Header */}
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">4G 吃到飽分析 Dashboard</h1>
        <button onClick={handleLogout} className="text-red-500">登出</button>
      </div>

      {/* 數據 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 border rounded text-center">
          <div className="text-xl font-bold">{articles.length}</div>
          <div>文章數</div>
        </div>
        <div className="p-4 border rounded text-center">
          <div className="text-xl font-bold">{summary.length}</div>
          <div>Entity種類</div>
        </div>
        <div className="p-4 border rounded text-center">
          <div className="text-xl font-bold">
            {entities.reduce((s, r) => s + (Number(r[3]) || 0), 0)}
          </div>
          <div>總出現次數</div>
        </div>
      </div>

      {/* 圖表 */}
      <div className="grid grid-cols-2 gap-6 mb-10">

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieChartData} dataKey="value">
              {pieChartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

      </div>

    </main>
  );
}