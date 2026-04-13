"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { leads: number };
};

export function AdminUsers({ onRefresh }: { onRefresh: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function toggleRole(user: User) {
    setActionId(user.id);
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      await loadUsers();
      onRefresh();
    }
    setActionId(null);
  }

  async function deleteUser(id: string) {
    setActionId(id);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadUsers();
      onRefresh();
    }
    setActionId(null);
    setConfirmDelete(null);
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/80">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
              <th className="text-center px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Role</th>
              <th className="text-center px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Leads</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Joined</th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {users.map((user) => (
              <tr
                key={user.id}
                className={`hover:bg-zinc-800/30 transition-colors ${actionId === user.id ? "opacity-50" : ""}`}
              >
                <td className="px-5 py-3.5 font-medium text-zinc-100">{user.name}</td>
                <td className="px-5 py-3.5 text-zinc-400 font-mono text-xs">{user.email}</td>
                <td className="px-5 py-3.5 text-center">
                  <span
                    className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide ${
                      user.role === "ADMIN"
                        ? "bg-indigo-500/15 text-indigo-400"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center text-zinc-400 tabular-nums">{user._count.leads}</td>
                <td className="px-5 py-3.5 text-zinc-500 text-xs">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => toggleRole(user)}
                      disabled={actionId === user.id}
                      className="text-xs px-3 py-1.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30"
                    >
                      {user.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
                    </button>
                    {confirmDelete === user.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={actionId === user.id}
                          className="text-xs px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/25 transition-colors disabled:opacity-30"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs px-2 py-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(user.id)}
                        className="text-xs px-2 py-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
