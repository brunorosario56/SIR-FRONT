import { useEffect, useMemo, useState } from "react";
import { getMyEvents, getMyGroups, getGroupEvents } from "../api/endpoints";
import type { Group, StudyEvent } from "../api/types";
import { Button, Card, Pill } from "../components/ui";

function fmt(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString();
}

function isPast(dt: string) {
  return new Date(dt).getTime() < Date.now();
}

export default function StudySessionsPage() {
  const [tab, setTab] = useState<"me" | "group">("me");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [myEvents, setMyEvents] = useState<StudyEvent[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string>("");
  const [groupEvents, setGroupEvents] = useState<StudyEvent[]>([]);

  async function loadMine() {
    setLoading(true);
    setErr(null);
    try {
      const data = await getMyEvents();
      setMyEvents(data || []);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao obter as tuas sessões.");
    } finally {
      setLoading(false);
    }
  }

  async function loadGroupsAndPick() {
    setLoading(true);
    setErr(null);
    try {
      const g = await getMyGroups();
      setGroups(g || []);
      const first = g?.[0]?._id || "";
      setGroupId((prev) => prev || first);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao obter grupos.");
    } finally {
      setLoading(false);
    }
  }

  async function loadGroupEvents(id: string) {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const ev = await getGroupEvents(id);
      setGroupEvents(ev || []);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao obter sessões do grupo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Carrega tudo o que é necessário para a UX
    loadMine();
    loadGroupsAndPick();
  }, []);

  useEffect(() => {
    if (tab === "group" && groupId) loadGroupEvents(groupId);
  }, [tab, groupId]);

  const mineSorted = useMemo(() => {
    return [...myEvents].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  }, [myEvents]);

  const groupSorted = useMemo(() => {
    return [...groupEvents].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  }, [groupEvents]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Study Sessions</div>
        <div className="text-white/60 text-sm">Todas as tuas sessões e as do grupo</div>
      </div>

      <div className="flex gap-2">
        <button
          className={`rounded-xl px-3 py-2 text-sm border ${
            tab === "me" ? "bg-white text-black border-white" : "border-white/10 hover:bg-white/10"
          }`}
          onClick={() => setTab("me")}
        >
          As minhas
        </button>
        <button
          className={`rounded-xl px-3 py-2 text-sm border ${
            tab === "group" ? "bg-white text-black border-white" : "border-white/10 hover:bg-white/10"
          }`}
          onClick={() => setTab("group")}
        >
          Por grupo
        </button>

        {tab === "group" && (
          <select
            className="ml-auto rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            {groups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      {err && <div className="text-sm text-red-300">{err}</div>}
      {loading && <div className="text-sm text-white/60">A carregar…</div>}

      {!loading && tab === "me" && (
        <Card>
          <div className="text-sm text-white/60 mb-3">As minhas sessões ({mineSorted.length})</div>
          <div className="space-y-2">
            {mineSorted.map((ev) => (
              <div key={ev._id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{ev.titulo}</div>
                  <Pill className={isPast(ev.fim) ? "text-white/60" : "text-green-200"}>
                    {isPast(ev.fim) ? "Terminada" : "Ativa / futura"}
                  </Pill>
                </div>
                <div className="text-xs text-white/60 mt-1">
                  {fmt(ev.inicio)} → {fmt(ev.fim)} {ev.local ? `• ${ev.local}` : ""}
                </div>
                {ev.descricao && <div className="text-sm text-white/70 mt-2">{ev.descricao}</div>}
              </div>
            ))}
            {mineSorted.length === 0 && <div className="text-sm text-white/50">Ainda não tens sessões.</div>}
          </div>
        </Card>
      )}

      {!loading && tab === "group" && (
        <Card>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-sm text-white/60">Sessões do grupo ({groupSorted.length})</div>
            <Button variant="ghost" onClick={() => loadGroupEvents(groupId)}>
              Atualizar
            </Button>
          </div>

          <div className="space-y-2">
            {groupSorted.map((ev) => (
              <div key={ev._id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{ev.titulo}</div>
                  <Pill className={isPast(ev.fim) ? "text-white/60" : "text-green-200"}>
                    {isPast(ev.fim) ? "Terminada" : "Ativa / futura"}
                  </Pill>
                </div>
                <div className="text-xs text-white/60 mt-1">
                  {fmt(ev.inicio)} → {fmt(ev.fim)} {ev.local ? `• ${ev.local}` : ""}
                </div>
                {ev.descricao && <div className="text-sm text-white/70 mt-2">{ev.descricao}</div>}
              </div>
            ))}
            {groupSorted.length === 0 && <div className="text-sm text-white/50">Este grupo ainda não tem sessões.</div>}
          </div>
        </Card>
      )}
    </div>
  );
}
