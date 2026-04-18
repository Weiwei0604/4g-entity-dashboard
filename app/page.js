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

      setArticles(data.articles || []);
      setEntities(data.entities || []);
      setSummary(data.summary || []);
    } catch (err) {
      console.log("資料抓不到，檢查一下 API", err);
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

  // ======== 登入 ========
  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert("登入失敗：" + error.message);
    else window.location.reload();
  };

  // ======== 登出 ========
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // ======== Loading ========
  if (authLoading || (user && loading)) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  // ======== 未登入畫面 ========
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md space-y-6">
          <h2 className="text-2xl font-bold text-center">登入系統</h2>

          <input
            type="email"
            placeholder="Email"
            required
            className="w-full p-4 border rounded-xl"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            className="w-full p-4 border rounded-xl"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold">
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

  const barChartData = entities.map(item => ({
    name: `第${item[0]}名`,
    count: Number(item[3])
  }));

  return (
    <main className="max-w-6xl mx-auto p-8 font-sans">

      {/* Header */}
      <header className="mb-10 text-center relative">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
          4G 吃到飽 Entity 分析 Dashboard
        </h1>
        <p className="text-slate-500">Google 搜尋前 10 名文章的命名實體分析</p>

        <button
          onClick={handleLogout}
          className="absolute right-0 top-0 text-red-500"
        >
          登出
        </button>
      </header>

      {/* 數據看板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 border rounded-2xl bg-slate-50 text-center">
          <div className="text-2xl font-bold text-blue-600">{articles.length}</div>
          <div className="text-sm text-slate-500">文章數</div>
        </div>
        <div className="p-6 border rounded-2xl bg-slate-50 text-center">
          <div className="text-2xl font-bold text-green-600">{summary.length}</div>
          <div className="text-sm text-slate-500">Entity 種類</div>
        </div>
        <div className="p-6 border rounded-2xl bg-slate-50 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {entities.length > 0
              ? entities.reduce((sum, row) => sum + (Number(row[3]) || 0), 0)
              : 0}
          </div>
          <div className="text-sm text-slate-500">總出現次數</div>
        </div>
      </div>

      {/* 圖表區 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

        <div className="p-5 border rounded-2xl shadow-sm">
          <h3 className="font-bold mb-6 text-slate-700">各篇文章 Entity 統計</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-5 border rounded-2xl shadow-sm">
          <h3 className="font-bold mb-6 text-slate-700">Top 7 Entity 佔比</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={80}
                label={({ name }) => name}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* 表格 */}
      <section className="mb-10">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
          搜尋結果與分析
        </h3>
        <div className="border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 w-20">排名</th>
                <th className="p-4">標題</th>
                <th className="p-4 w-32">Entity 數</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((item, idx) => (
                <tr key={idx} className="border-t hover:bg-slate-50 transition">
                  <td className="p-4 font-mono text-blue-600 font-bold">{item[0]}</td>
                  <td className="p-4">
                    <a href={item[2]} target="_blank" className="text-slate-700 hover:text-blue-600">
                      {item[1]}
                    </a>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">
                      {entities[idx] ? entities[idx][3] : 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {/* 分群統計表 */}
      <section>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-green-600 rounded-full"></span>
          主題分群統計
        </h3>
        <div className="border rounded-2xl overflow-hidden shadow-sm bg-white text-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-slate-500 font-bold">
              <tr>
                <th className="p-4 pl-8">Entity 名稱</th>
                <th className="p-4">類別</th>
                <th className="p-4">篇數</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="p-4 pl-8 font-bold">{row[entity] || row[0]}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-xs font-medium">
                      {row[category] || row[1]}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-100 flex-1 h-2 rounded-full overflow-hidden max-w-[100px]">
                        <div 
                          className="bg-green-500 h-full" 
                          style={{ width: `${((row[count] || row[2]) / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-slate-700">{row[count] || row[2]}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </main>
  );
}