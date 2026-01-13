import { useEffect, useMemo, useState } from "react";
import { createGroupEvent, getGroupEvents, getMyGroups } from "../api/endpoints";
import type { Group, StudyEvent } from "../api/types";
import { Badge, Button, Card, Input, Label, Select, Textarea } from "../components/ui";
import { isoNowPlus } from "../utils/dateUtils";

// Study Sessions Page
export default function StudySessionsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [searchTerm, setSearchTerm] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [inicio, setInicio] = useState(isoNowPlus(1));
  const [fim, setFim] = useState(isoNowPlus(2));
  const [local, setLocal] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedGroup = useMemo(() => groups.find((g) => g._id === groupId) || null, [groupId, groups]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    let filtered = events;

    // Filter by time
    if (filter === "upcoming") {
      filtered = filtered.filter(e => new Date(e.inicio) > now);
    } else if (filter === "past") {
      filtered = filtered.filter(e => new Date(e.inicio) <= now);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.titulo.toLowerCase().includes(term) ||
        e.descricao?.toLowerCase().includes(term) ||
        e.local?.toLowerCase().includes(term)
      );
    }

    // Sort by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.inicio).getTime();
      const dateB = new Date(b.inicio).getTime();
      return filter === "past" ? dateB - dateA : dateA - dateB;
    });
  }, [events, filter, searchTerm]);

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
        <Select
          value={groupId || ""}
          onChange={(e) => setGroupId(e.target.value || null)}
        >
          {groups.map((g) => (
            <option key={g._id} value={g._id}>
              {g.nome}
            </option>
          ))}
        </Select>
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
              <Textarea 
                value={descricao} 
                onChange={(e) => setDescricao(e.target.value)} 
                placeholder="O que vão estudar, tópicos a cobrir..."
              />
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

          <Card className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-white/60">
                Eventos ({filteredEvents.length}/{events.length})
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar..."
                  className="w-40"
                />
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setFilter("upcoming")}
                className={`px-3 py-1 rounded-lg text-xs transition ${
                  filter === "upcoming" 
                    ? "bg-white text-black" 
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                Futuros
              </button>
              <button
                onClick={() => setFilter("past")}
                className={`px-3 py-1 rounded-lg text-xs transition ${
                  filter === "past" 
                    ? "bg-white text-black" 
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                Passados
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs transition ${
                  filter === "all" 
                    ? "bg-white text-black" 
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                Todos
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredEvents.map((ev) => {
                const startDate = new Date(ev.inicio);
                const endDate = new Date(ev.fim);
                const isPast = startDate < new Date();
                const isToday = startDate.toDateString() === new Date().toDateString();
                
                return (
                  <div 
                    key={ev._id} 
                    className={`rounded-xl border p-3 ${
                      isPast 
                        ? "border-white/10 bg-black/20 opacity-60" 
                        : isToday
                        ? "border-yellow-500/40 bg-yellow-500/10"
                        : "border-white/10 bg-black/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-medium flex-1">{ev.titulo}</div>
                      <div className="flex gap-1">
                        {isToday && <Badge variant="warning">Hoje</Badge>}
                        {isPast && <Badge variant="default">Passado</Badge>}
                      </div>
                    </div>
                    <div className="text-xs text-white/60 space-y-1">
                      <div>📅 {startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      {ev.local && <div>📍 {ev.local}</div>}
                    </div>
                    {ev.descricao && (
                      <div className="text-sm text-white/70 mt-2 p-2 bg-black/20 rounded-lg">
                        {ev.descricao}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredEvents.length === 0 && events.length > 0 && (
                <div className="text-sm text-white/50 text-center py-4">
                  Nenhum evento encontrado com estes filtros.
                </div>
              )}
              {events.length === 0 && (
                <div className="text-sm text-white/50 text-center py-4">
                  Ainda não há eventos para este grupo.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
