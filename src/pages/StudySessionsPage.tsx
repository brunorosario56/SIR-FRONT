import { useEffect, useMemo, useState } from "react";
import { createGroupEvent, getGroupEvents, getMyGroups } from "../api/endpoints";
import type { Group, StudyEvent } from "../api/types";
import { Button, Card, Input, Label } from "../components/ui";

function isoNowPlus(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16); // para input datetime-local
}

export default function StudySessionsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [inicio, setInicio] = useState(isoNowPlus(1));
  const [fim, setFim] = useState(isoNowPlus(2));
  const [local, setLocal] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedGroup = useMemo(() => groups.find((g) => g._id === groupId) || null, [groupId, groups]);

  async function loadGroups() {
    setErr(null);
    setLoading(true);
    try {
      const data = await getMyGroups();
      setGroups(data);
      setGroupId((prev) => prev || data[0]?._id || null);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao obter grupos.");
    } finally {
      setLoading(false);
    }
  }

  async function loadEvents(gId: string) {
    setErr(null);
    try {
      const ev = await getGroupEvents(gId);
      setEvents(ev || []);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao obter eventos.");
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (groupId) {
      loadEvents(groupId);
    } else {
      setEvents([]);
    }
  }, [groupId]);

  async function onCreateEvent() {
    if (!groupId) return;
    if (!titulo.trim()) {
      setErr("Título é obrigatório.");
      return;
    }

    setCreating(true);
    setErr(null);
    try {
      await createGroupEvent(groupId, {
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        inicio: new Date(inicio).toISOString(),
        fim: new Date(fim).toISOString(),
        local: local.trim() || undefined,
      });
      setTitulo("");
      setDescricao("");
      setLocal("");
      setInicio(isoNowPlus(1));
      setFim(isoNowPlus(2));
      await loadEvents(groupId);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao criar evento.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="p-2">A carregar…</div>;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Study Sessions</div>
        <div className="text-white/60 text-sm">Cria e consulta eventos de estudo para os teus grupos.</div>
      </div>

      {err && <div className="text-sm text-red-300">{err}</div>}

      <Card className="space-y-2">
        <div className="text-sm text-white/60">Seleciona o grupo</div>
        <select
          value={groupId || ""}
          onChange={(e) => setGroupId(e.target.value || null)}
          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30 text-white"
        >
          {groups.map((g) => (
            <option key={g._id} value={g._id} className="bg-neutral-900 text-white">
              {g.nome}
            </option>
          ))}
        </select>
        {groups.length === 0 && (
          <div className="text-sm text-white/60">Ainda não tens grupos. Cria um para poderes agendar sessões.</div>
        )}
      </Card>

      {selectedGroup && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="space-y-3">
            <div className="text-sm text-white/60">Criar evento</div>

            <div>
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Sessão de estudo - Redes" />
            </div>

            <div>
              <Label>Descrição</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que vão fazer / tópicos" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label>Início</Label>
                <Input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} />
              </div>
              <div>
                <Label>Fim</Label>
                <Input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Local</Label>
              <Input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Sala, Discord, Biblioteca..." />
            </div>

            <Button onClick={onCreateEvent} disabled={creating}>
              {creating ? "A criar..." : "Criar evento"}
            </Button>
          </Card>

          <Card>
            <div className="text-sm text-white/60 mb-3">Eventos do grupo</div>
            <div className="space-y-2">
              {events.map((ev) => (
                <div key={ev._id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="font-medium">{ev.titulo}</div>
                  <div className="text-xs text-white/60">
                    {new Date(ev.inicio).toLocaleString()} → {new Date(ev.fim).toLocaleString()}
                    {ev.local ? ` • ${ev.local}` : ""}
                  </div>
                  {ev.descricao && <div className="text-sm text-white/70 mt-2">{ev.descricao}</div>}
                </div>
              ))}
              {events.length === 0 && <div className="text-sm text-white/50">Ainda não há eventos para este grupo.</div>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
