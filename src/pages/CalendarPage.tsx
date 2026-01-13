import { useEffect, useState, type FormEvent } from "react";
import { Page } from "../components/Page";
import { Card, Modal } from "../components/ui";
import { getMyEvents, createGroupEvent, getMyGroups } from "../api/endpoints";
import type { StudyEvent, Group } from "../api/types";

type ViewMode = "month" | "week" | "day";

export function CalendarPage() {
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // Quick create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventGroup, setNewEventGroup] = useState("");
  const [newEventStart, setNewEventStart] = useState("");
  const [newEventEnd, setNewEventEnd] = useState("");
  const [newEventLocal, setNewEventLocal] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [eventsData, groupsData] = await Promise.all([getMyEvents(), getMyGroups()]);
      setEvents(eventsData);
      setGroups(groupsData);
    } catch (err: any) {
      console.error("Erro ao carregar eventos:", err);
      setEvents([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  function getGroupColor(groupId: string): string {
    const colors = [
      "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500",
      "bg-pink-500", "bg-indigo-500", "bg-yellow-500", "bg-red-500"
    ];
    const index = groups.findIndex(g => g._id === groupId);
    return colors[index % colors.length] || "bg-gray-500";
  }

  function getDaysInMonth(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];
    
    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push(prevDate);
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  }

  function getEventsForDay(date: Date): StudyEvent[] {
    return events.filter(event => {
      const eventDate = new Date(event.inicio);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }

  function handleDayClick(date: Date) {
    setSelectedDate(date);
    const timeStr = new Date().toTimeString().slice(0, 5);
    setNewEventStart(`${date.toISOString().split('T')[0]}T${timeStr}`);
    setNewEventEnd(`${date.toISOString().split('T')[0]}T${timeStr}`);
    setShowCreateModal(true);
  }

  async function handleCreateEvent(e: FormEvent) {
    e.preventDefault();
    if (!newEventGroup) {
      alert("Selecione um grupo");
      return;
    }

    try {
      await createGroupEvent(newEventGroup, {
        titulo: newEventTitle,
        descricao: newEventDesc,
        inicio: new Date(newEventStart).toISOString(),
        fim: new Date(newEventEnd).toISOString(),
        local: newEventLocal
      });
      
      setShowCreateModal(false);
      resetCreateForm();
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao criar evento");
    }
  }

  function resetCreateForm() {
    setNewEventTitle("");
    setNewEventDesc("");
    setNewEventGroup("");
    setNewEventStart("");
    setNewEventEnd("");
    setNewEventLocal("");
    setSelectedDate(null);
  }

  function changeMonth(delta: number) {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  }

  function changeWeek(delta: number) {
    setCurrentDate(new Date(currentDate.getTime() + delta * 7 * 24 * 60 * 60 * 1000));
  }

  function changeDay(delta: number) {
    setCurrentDate(new Date(currentDate.getTime() + delta * 24 * 60 * 60 * 1000));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  if (loading) {
    return <Page title="Calendário"><p className="text-gray-600">A carregar...</p></Page>;
  }

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <Page title="Calendário">
      <div className="space-y-4">
        {/* Header Controls */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Hoje
              </button>
              <button
                onClick={() => {
                  if (viewMode === "month") changeMonth(-1);
                  else if (viewMode === "week") changeWeek(-1);
                  else changeDay(-1);
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ‹
              </button>
              <button
                onClick={() => {
                  if (viewMode === "month") changeMonth(1);
                  else if (viewMode === "week") changeWeek(1);
                  else changeDay(1);
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ›
              </button>
              <h2 className="text-xl font-semibold text-white ml-2">
                {viewMode === "month" && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                {viewMode === "week" && `Semana de ${currentDate.toLocaleDateString("pt-PT")}`}
                {viewMode === "day" && currentDate.toLocaleDateString("pt-PT", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("month")}
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  viewMode === "month" 
                    ? "bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border border-purple-400/50 text-purple-50" 
                    : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:border-white/30"
                }`}
              >
                📆 Mês
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  viewMode === "week" 
                    ? "bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border border-purple-400/50 text-purple-50" 
                    : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:border-white/30"
                }`}
              >
                📅 Semana
              </button>
              <button
                onClick={() => setViewMode("day")}
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  viewMode === "day" 
                    ? "bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border border-purple-400/50 text-purple-50" 
                    : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:border-white/30"
                }`}
              >
                📋 Dia
              </button>
            </div>
          </div>
        </Card>

        {/* Legend */}
        <Card className="p-4 bg-gradient-to-br from-slate-600/10 to-slate-700/5 border-slate-400/30">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">🎨 Grupos:</h3>
          <div className="flex flex-wrap gap-3">
            {groups.map(group => (
              <div key={group._id} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40 transition-all">
                <div className={`w-3 h-3 rounded-full ${getGroupColor(group._id)} shadow-lg`} />
                <span className="text-sm text-white font-medium">{group.nome}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Calendar Views */}
        {viewMode === "month" && (
          <Card className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {/* Week day headers */}
              {weekDays.map(day => (
                <div key={day} className="text-center font-bold text-indigo-300 py-2 text-sm">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {getDaysInMonth(currentDate).map((date, idx) => {
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = 
                  date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear();
                const dayEvents = getEventsForDay(date);

                return (
                  <div
                    key={idx}
                    onClick={() => handleDayClick(date)}
                    className={`
                      min-h-24 p-2 border rounded-lg cursor-pointer transition-all
                      ${!isCurrentMonth ? "bg-white/5 text-white/40 border-white/10" : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30"}
                      ${isToday ? "border-cyan-400 border-2 bg-gradient-to-br from-cyan-600/20 to-blue-600/10" : ""}
                    `}
                  >
                    <div className={`text-sm font-semibold ${isToday ? "text-cyan-200" : "text-white"}`}>
                      {date.getDate()}
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event._id}
                          className={`text-xs text-white px-1 py-0.5 rounded truncate ${getGroupColor(typeof event.group === 'string' ? event.group : event.group._id)}`}
                          title={event.titulo}
                        >
                          {new Date(event.inicio).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} {event.titulo}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500">+{dayEvents.length - 3} mais</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {viewMode === "week" && (
          <Card className="p-4">
            <p className="text-gray-600">Vista semanal em desenvolvimento...</p>
            <div className="mt-4 space-y-2">
              {events
                .filter(e => {
                  const eventDate = new Date(e.inicio);
                  const weekStart = new Date(currentDate);
                  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekStart.getDate() + 6);
                  return eventDate >= weekStart && eventDate <= weekEnd;
                })
                .map(event => (
                  <div key={event._id} className="p-3 bg-gray-50 rounded-lg">
                    <div className={`inline-block w-3 h-3 rounded mr-2 ${getGroupColor(typeof event.group === 'string' ? event.group : event.group._id)}`} />
                    <strong>{event.titulo}</strong> - {new Date(event.inicio).toLocaleString("pt-PT")}
                  </div>
                ))}
            </div>
          </Card>
        )}

        {viewMode === "day" && (
          <Card className="p-4">
            <div className="space-y-2">
              {getEventsForDay(currentDate).length === 0 ? (
                <p className="text-gray-600">Nenhum evento neste dia.</p>
              ) : (
                getEventsForDay(currentDate).map(event => (
                  <div key={event._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 rounded mt-1 ${getGroupColor(typeof event.group === 'string' ? event.group : event.group._id)}`} />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{event.titulo}</h4>
                        <p className="text-sm text-gray-600">{typeof event.group === 'string' ? 'Grupo' : event.group.nome}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(event.inicio).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} - {new Date(event.fim).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {event.local && <p className="text-sm text-gray-600">📍 {event.local}</p>}
                        {event.descricao && <p className="text-sm text-gray-700 mt-2">{event.descricao}</p>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* Quick Create Modal */}
        <Modal 
          isOpen={showCreateModal}
          onClose={() => { setShowCreateModal(false); resetCreateForm(); }}
          title={`Criar Evento - ${selectedDate?.toLocaleDateString("pt-PT")}`}
        >
          <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo *</label>
                <select
                  value={newEventGroup}
                  onChange={(e) => setNewEventGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Selecione um grupo</option>
                  {groups.map(group => (
                    <option key={group._id} value={group._id}>{group.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Início *</label>
                  <input
                    type="datetime-local"
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fim *</label>
                  <input
                    type="datetime-local"
                    value={newEventEnd}
                    onChange={(e) => setNewEventEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                <input
                  type="text"
                  value={newEventLocal}
                  onChange={(e) => setNewEventLocal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Criar Evento
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </Modal>
      </div>
    </Page>
  );
}
