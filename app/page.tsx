"use client";

import { useEffect, useMemo, useState } from "react";

type Employee = {
  id: number;
  fullName: string;
  username: string;
  roles: string[];
};

type LoginResponse = {
  token: string;
  employee: Employee;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080";

export default function Home() {
  const [username, setUsername] = useState("admin1");
  const [password, setPassword] = useState("admin");
  const [token, setToken] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const maskedToken = useMemo(() => {
    if (!token) return "";
    if (token.length <= 10) return token;
    return `${token.slice(0, 6)}…${token.slice(-4)}`;
  }, [token]);

  useEffect(() => {
    const saved = window.localStorage.getItem("banksys-token");
    if (saved) {
      setToken(saved);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchProfile(token, false);
  }, [token]);

  const login = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Не удалось войти");
      }

      const data = (await response.json()) as LoginResponse;
      setToken(data.token);
      setEmployee(data.employee);
      window.localStorage.setItem("banksys-token", data.token);
      setInfo("Вход выполнен. Токен сохранён локально.");
    } catch (err) {
      setEmployee(null);
      setToken(null);
      window.localStorage.removeItem("banksys-token");
      setError(err instanceof Error ? err.message : "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (authToken: string, showInfo = true) => {
    setLoading(true);
    setError(null);
    if (showInfo) setInfo(null);
    try {
      const response = await fetch(`${API_BASE}/api/employees/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Не удалось получить профиль");
      }

      const data = (await response.json()) as Employee;
      setEmployee(data);
      if (showInfo) setInfo("Профиль обновлён.");
    } catch (err) {
      setEmployee(null);
      setError(err instanceof Error ? err.message : "Ошибка при запросе профиля");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setEmployee(null);
    setInfo(null);
    setError(null);
    window.localStorage.removeItem("banksys-token");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-12 text-slate-100">
      <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">
                banksys
              </p>
              <h1 className="text-3xl font-semibold leading-tight"></h1>
            </div>
          </div>
          <p className="mt-6 text-lg text-slate-200/90">
            Авторизация по REST API, роли из PostgreSQL. Используйте логины из
            бэкенда (employee1 / manager1 / admin1) и тестируйте выдачу ролей.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm uppercase tracking-wide text-emerald-200/90">
                Эндпоинты
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-200/80">
                <li>
                  <span className="text-emerald-300">POST</span>{" "}
                  /api/auth/login
                </li>
                <li>
                  <span className="text-emerald-300">GET</span>{" "}
                  /api/employees/me
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm uppercase tracking-wide text-emerald-200/90">
                Базовый URL
              </p>
              <p className="mt-2 text-sm text-slate-200/80 break-all">
                {API_BASE}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Можно переопределить через NEXT_PUBLIC_API_BASE_URL.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-200/80">Проверка доступа</p>
              <h2 className="text-2xl font-semibold">Вход в BANKsys</h2>
            </div>
            {token ? (
              <span className="rounded-full bg-emerald-400/20 px-4 py-1 text-xs font-semibold text-emerald-100">
                Токен есть
              </span>
            ) : (
              <span className="rounded-full bg-red-400/20 px-4 py-1 text-xs font-semibold text-red-100">
                Без токена
              </span>
            )}
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
          >
            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="username">
                Логин
              </label>
              <input
                id="username"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none ring-2 ring-transparent transition focus:ring-emerald-300/60"
                placeholder="admin1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="password">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none ring-2 ring-transparent transition focus:ring-emerald-300/60"
                placeholder="admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Запрос..." : "Войти и получить токен"}
              </button>
              <button
                type="button"
                onClick={() => token && fetchProfile(token)}
                disabled={!token || loading}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-emerald-300/60 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Запросить /me
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-red-300/60 hover:text-red-100"
              >
                Сбросить токен
              </button>
            </div>
          </form>

          {(info || error || token) && (
            <div className="mt-6 space-y-2 text-sm">
              {info && (
                <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-emerald-100">
                  {info}
                </div>
              )}
              {error && (
                <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-red-100">
                  {error}
                </div>
              )}
              {token && (
                <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-slate-200">
                  Токен: {maskedToken}
                </div>
              )}
            </div>
          )}

          {employee && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <p className="text-sm text-emerald-200/90">Текущий сотрудник</p>
              <h3 className="mt-2 text-xl font-semibold">{employee.fullName}</h3>
              <p className="text-sm text-slate-300">Логин: {employee.username}</p>
              <p className="text-sm text-slate-400">ID: {employee.id}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {employee.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
