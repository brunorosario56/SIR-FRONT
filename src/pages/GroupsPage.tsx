import { useEffect, useMemo, useState } from "react";
import { 
  addMembersToGroup, 
  createGroup,
  createGroupEvent, 
  deleteGroupEvent,
  getGroupEvents, 
  getGroupSlots, 
  getMyGroups,
  leaveGroup,
  removeMemberFromGroup,
  updateGroupEvent
} from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";
import type { Group, GroupSlotsResponse, Slot, StudyEvent, User } from "../api/types";
import { Button, Card, Input, Label, Pill } from "../components/ui";
import { isoNowPlus } from "../utils/dateUtils";

const days = ["", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<Group | null>(null);

  const [slotsData, setSlotsData] = useState<GroupSlotsResponse | null>(null);
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // create group
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupNome, setNewGroupNome] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  // add members
  const [emailsRaw, setEmailsRaw] = useState("");
  const [adding, setAdding] = useState(false);

  // create/edit event
  const [editingEvent, setEditingEvent] = useState<StudyEvent | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [inicio, setInicio] = useState(isoNowPlus(1));
  const [fim, setFim] = useState(isoNowPlus(2));
  const [local, setLocal] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

  async function loadGroups() {
    setErr(null);
    setLoading(true);
    try {
      const data = await getMyGroups();
      setGroups(data);
      if (!selected && data.length > 0) setSelected(data[0]);
      if (selected) {
        const updated = data.find(g => g._id === selected._id);
        if (updated) setSelected(updated);
        else setSelected(data[0] || null);
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao obter grupos.");
    } finally {
      setLoading(false);
    }
  }

  async function loadGroupData(g: Group) {
    setErr(null);
    try {
      const [slotsRes, eventsRes] = await Promise.all([
        getGroupSlots(g._id),
        getGroupEvents(g._id),
      ]);
      setSlotsData(slotsRes);
      setEvents(eventsRes || []);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao obter slots/eventos.");
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selected) loadGroupData(selected);
    else {
      setSlotsData(null);
      setEvents([]);
    }
  }, [selected?._id]);

  const isOwner = useMemo(() => {
    if (!selected || !user) return false;
    const ownerId = typeof selected.owner === 'string' ? selected.owner : selected.owner._id;
    return ownerId === user._id;
  }, [selected, user]);

  const groupsSorted = useMemo(() => [...groups].sort((a, b) => a.nome.localeCompare(b.nome)), [groups]);

  async function onCreateGroup() {
    if (!newGroupNome.trim()) return;
    setCreatingGroup(true);
    setErr(null);
    setSuccess(null);
    try {
      await createGroup(newGroupNome.trim(), newGroupDesc.trim() || undefined);
      setNewGroupNome("");
      setNewGroupDesc("");
      setShowCreateGroup(false);
      setSuccess("Grupo criado!");
      await loadGroups();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao criar grupo.");
    } finally {
      setCreatingGroup(false);
    }
  }

  async function onAddMembers() {
    if (!selected) return;
    const emails = emailsRaw
      .split(/[,\n]/g)
      .map((s) => s.trim())
      .filter(Boolean);

    if (emails.length === 0) return;

    setAdding(true);
    setErr(null);
    setSuccess(null);
    try {
      await addMembersToGroup(selected._id, { emails });
      setEmailsRaw("");
      setSuccess("Membros adicionados!");
      await loadGroups();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao adicionar membros.");
    } finally {
      setAdding(false);
    }
  }

  async function onRemoveMember(memberId: string, memberName: string) {
    if (!selected) return;
    if (!confirm(`Remover ${memberName} do grupo?`)) return;
    
    setErr(null);
    setSuccess(null);
    try {
      await removeMemberFromGroup(selected._id, memberId);
      setSuccess("Membro removido!");
      await loadGroups();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao remover membro.");
    }
  }

  async function onLeaveGroup() {
    if (!selected) return;
    if (!confirm(`Tens a certeza que queres sair de "${selected.nome}"?`)) return;
    
    setErr(null);
    setSuccess(null);
    try {
      await leaveGroup(selected._id);
      setSuccess("Saíste do grupo.");
      setSelected(null);
      await loadGroups();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao sair do grupo.");
    }
  }

  function startEditEvent(ev: StudyEvent) {
    setEditingEvent(ev);
    setTitulo(ev.titulo);
    setDescricao(ev.descricao || "");
    setInicio(new Date(ev.inicio).toISOString().slice(0, 16));
    setFim(new Date(ev.fim).toISOString().slice(0, 16));
    setLocal(ev.local || "");
  }

  function cancelEditEvent() {
    setEditingEvent(null);
    setTitulo("");
    setDescricao("");
    setLocal("");
    setInicio(isoNowPlus(1));
    setFim(isoNowPlus(2));
  }

  async function onSaveEvent() {
    if (!selected) return;
    if (!titulo.trim()) {
      setErr("Título é obrigatório.");
      return;
    }

    setSavingEvent(true);
    setErr(null);
    setSuccess(null);
    try {
      if (editingEvent) {
        await updateGroupEvent(selected._id, editingEvent._id, {
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          inicio: new Date(inicio).toISOString(),
          fim: new Date(fim).toISOString(),
          local: local.trim() || undefined,
        });
        setSuccess("Evento atualizado!");
      } else {
        await createGroupEvent(selected._id, {
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          inicio: new Date(inicio).toISOString(),
          fim: new Date(fim).toISOString(),
          local: local.trim() || undefined,
        });
        setSuccess("Evento criado!");
      }
      cancelEditEvent();
      await loadGroupData(selected);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao guardar evento.");
    } finally {
      setSavingEvent(false);
    }
  }

  async function onDeleteEvent(eventId: string, eventTitle: string) {
    if (!selected) return;
    if (!confirm(`Apagar evento "${eventTitle}"?`)) return;

    setErr(null);
    setSuccess(null);
    try {
      await deleteGroupEvent(selected._id, eventId);
      setSuccess("Evento apagado!");
      await loadGroupData(selected);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao apagar evento.");
    }
  }

  function canEditEvent(ev: StudyEvent): boolean {
    if (!user) return false;
    if (isOwner) return true;
    return ev.criador === user._id;
  }

  if (loading) return <div className="p-2">A carregar…</div>;

  const membros = slotsData?.membros || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Grupos</div>
          <div className="text-white/60 text-sm">Gestão de grupos e eventos de estudo</div>
        </div>
        <Button onClick={() => setShowCreateGroup(!showCreateGroup)}>
          {showCreateGroup ? "Cancelar" : "+ Criar Grupo"}
        </Button>
      </div>

      {err && <div className="text-sm text-red-300 bg-red-950/30 border border-red-500/30 rounded-lg p-3">{err}</div>}
      {success && <div className="text-sm text-green-300 bg-green-950/30 border border-green-500/30 rounded-lg p-3">{success}</div>}

      {showCreateGroup && (
        <Card className="space-y-3">
          <div className="text-sm text-white/60">Criar novo grupo</div>
          <div>
            <Label>Nome do grupo</Label>
            <Input value={newGroupNome} onChange={(e) => setNewGroupNome(e.target.value)} placeholder="Grupo de Redes" />
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Input value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="Estudar para o exame..." />
          </div>
          <Button onClick={onCreateGroup} disabled={creatingGroup}>
            {creatingGroup ? "A criar..." : "Criar"}
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-3">
        <Card>
          <div className="text-sm text-white/60 mb-3">Os teus grupos ({groupsSorted.length})</div>
          <div className="space-y-2">
            {groupsSorted.map((g) => (
              <button
                key={g._id}
                onClick={() => setSelected(g)}
                className={`w-full text-left rounded-xl border px-3 py-2 transition
                  ${selected?._id === g._id ? "bg-white text-black border-white" : "border-white/10 hover:bg-white/10"}`}
              >
                <div className="font-medium truncate">{g.nome}</div>
                <div className="text-xs opacity-70 truncate">{g.descricao || "Sem descrição"}</div>
                <div className="text-xs opacity-70 mt-1">{Array.isArray(g.membros) ? g.membros.length : 0} membros</div>
              </button>
            ))}

            {groupsSorted.length === 0 && (
              <div className="text-sm text-white/50">Não és membro de nenhum grupo.</div>
            )}
          </div>
        </Card>

        <div className="space-y-3">
          {!selected ? (
            <Card>
              <div className="text-sm text-white/60">Seleciona um grupo ou cria um novo</div>
            </Card>
          ) : (
            <>
              <Card>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="text-lg font-semibold">{selected.nome}</div>
                    <div className="text-sm text-white/60">{selected.descricao || "Sem descrição"}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Pill>{isOwner ? "Owner" : "Membro"}</Pill>
                      <Pill>{Array.isArray(selected.membros) ? selected.membros.length : 0} membros</Pill>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onLeaveGroup}>
                    Sair
                  </Button>
                </div>

                {membros.length > 0 && (
                  <div>
                    <div className="text-sm text-white/60 mb-2">Membros</div>
                    <div className="space-y-1">
                      {membros.map((m) => (
                        <div key={m._id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-black/20">
                          <div>
                            <span className="font-medium">{m.nome}</span>
                            <span className="text-white/60 ml-2 text-xs">{m.email}</span>
                          </div>
                          {isOwner && m._id !== (typeof selected.owner === 'string' ? selected.owner : selected.owner._id) && (
                            <Button variant="ghost" size="sm" onClick={() => onRemoveMember(m._id, m.nome)}>
                              Remover
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {isOwner && (
                <Card className="space-y-2">
                  <div className="text-sm text-white/60">Adicionar membros (só o owner)</div>
                  <div>
                    <Label>Emails (separa por vírgula ou linhas)</Label>
                    <Input
                      value={emailsRaw}
                      onChange={(e) => setEmailsRaw(e.target.value)}
                      placeholder={"a@a.com, b@b.com"}
                    />
                  </div>
                  <Button onClick={onAddMembers} disabled={adding}>
                    {adding ? "A adicionar..." : "Adicionar membros"}
                  </Button>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Card>
                  <div className="text-sm text-white/60 mb-3">Slots livres em comum</div>
                  <div className="space-y-2">
                    {(slotsData?.slots || []).map((s, idx) => (
                      <div key={idx} className="rounded-xl border border-white/10 bg-black/30 p-3 flex justify-between">
                        <div className="font-medium">{days[s.diaSemana]}</div>
                        <div className="text-white/70">{s.inicio} — {s.fim}</div>
                      </div>
                    ))}
                    {(slotsData?.slots || []).length === 0 && <div className="text-sm text-white/50">Sem slots em comum.</div>}
                  </div>
                </Card>

                <Card className="space-y-3">
                  <div className="text-sm text-white/60">{editingEvent ? "Editar evento" : "Criar evento"}</div>

                  <div>
                    <Label>Título</Label>
                    <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Sessão de estudo" />
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Tópicos a estudar" />
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
                    <Input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Sala, Discord..." />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={onSaveEvent} disabled={savingEvent}>
                      {savingEvent ? "A guardar..." : editingEvent ? "Atualizar" : "Criar"}
                    </Button>
                    {editingEvent && (
                      <Button variant="ghost" onClick={cancelEditEvent}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </Card>
              </div>

              <Card>
                <div className="text-sm text-white/60 mb-3">Eventos ({events.length})</div>
                <div className="space-y-2">
                  {events.map((ev) => (
                    <div key={ev._id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium">{ev.titulo}</div>
                          <div className="text-xs text-white/60">
                            {new Date(ev.inicio).toLocaleString()} → {new Date(ev.fim).toLocaleString()}
                            {ev.local ? ` • ${ev.local}` : ""}
                          </div>
                          {ev.descricao && <div className="text-sm text-white/70 mt-2">{ev.descricao}</div>}
                        </div>
                        {canEditEvent(ev) && (
                          <div className="flex gap-2 flex-shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => startEditEvent(ev)}>
                              Editar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onDeleteEvent(ev._id, ev.titulo)}>
                              Apagar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && <div className="text-sm text-white/50">Ainda não há eventos.</div>}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

