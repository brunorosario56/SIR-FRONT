import { api } from "./client";
import type { Group, GroupSlotsResponse, Schedule, StudyEvent, User } from "./types";

export async function authLogin(email: string, password: string) {
  const { data } = await api.post<{ token: string }>("/auth/login", { email, password });
  return data;
}

export async function authRegister(nome: string, email: string, password: string) {
  const { data } = await api.post("/auth/register", { nome, email, password });
  return data;
}

export async function authMe() {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export async function updateProfile(body: { nome?: string; email?: string; avatar?: string }) {
  const { data } = await api.put("/auth/me", body);
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.put("/auth/me/password", { currentPassword, newPassword });
  return data;
}

export async function getMyStats() {
  const { data } = await api.get<{
    totalColegas: number;
    totalGroups: number;
    ownedGroups: number;
    totalBlocos: number;
    upcomingEvents: number;
    pastEvents: number;
    totalEvents: number;
  }>("/auth/me/stats");
  return data;
}

export async function getMySchedule() {
  const { data } = await api.get<Schedule>("/schedules/me");
  return data;
}

export async function putMySchedule(blocos: Schedule["blocos"]) {
  const { data } = await api.put("/schedules/me", { blocos });
  return data;
}

export async function getUserSchedule(userId: string) {
  const { data } = await api.get<Schedule>(`/users/${userId}/schedule`);
  return data;
}

export async function getMyColegas() {
  const { data } = await api.get<{ colegas: User[] }>("/users/me/colegas");
  return data;
}

export async function addColega(email: string) {
  const { data } = await api.post("/users/me/colegas", { email });
  return data;
}

export async function removeColega(colegaId: string) {
  const { data } = await api.delete(`/users/me/colegas/${colegaId}`);
  return data;
}

export async function getFriendRequests() {
  const { data } = await api.get<{ incoming: any[]; outgoing: any[] }>("/users/me/colegas/requests");
  return data;
}

export async function sendFriendRequest(email: string) {
  const { data } = await api.post("/users/me/colegas/requests", { email });
  return data;
}

export async function respondFriendRequest(requestId: string, decision: "accept" | "reject") {
  const { data } = await api.post(`/users/me/colegas/requests/${requestId}/${decision}`);
  return data;
}

export async function cancelFriendRequest(requestId: string) {
  const { data } = await api.delete(`/users/me/colegas/requests/${requestId}`);
  return data;
}

export async function getMyGroups() {
  const { data } = await api.get<Group[]>("/groups/me");
  return data;
}

export async function createGroup(nome: string, descricao?: string) {
  const { data } = await api.post<{ message: string; group: Group }>("/groups", { nome, descricao });
  return data;
}

export async function addMembersToGroup(groupId: string, payload: { emails?: string[]; userIds?: string[] }) {
  const { data } = await api.post(`/groups/${groupId}/members`, payload);
  return data;
}

export async function removeMemberFromGroup(groupId: string, memberId: string) {
  const { data } = await api.delete(`/groups/${groupId}/members/${memberId}`);
  return data;
}

export async function leaveGroup(groupId: string) {
  const { data } = await api.delete(`/groups/${groupId}/leave`);
  return data;
}

export async function getGroupSlots(groupId: string) {
  const { data } = await api.get<GroupSlotsResponse>(`/groups/${groupId}/slots`);
  return data;
}

export async function createGroupEvent(groupId: string, body: {
  titulo: string;
  descricao?: string;
  inicio: string; // ISO
  fim: string; // ISO
  local?: string;
}) {
  const { data } = await api.post(`/groups/${groupId}/events`, body);
  return data;
}

export async function updateGroupEvent(groupId: string, eventId: string, body: {
  titulo?: string;
  descricao?: string;
  inicio?: string;
  fim?: string;
  local?: string;
}) {
  const { data } = await api.put(`/groups/${groupId}/events/${eventId}`, body);
  return data;
}

export async function deleteGroupEvent(groupId: string, eventId: string) {
  const { data } = await api.delete(`/groups/${groupId}/events/${eventId}`);
  return data;
}

export async function getGroupEvents(groupId: string) {
  const { data } = await api.get<StudyEvent[]>(`/groups/${groupId}/events`);
  return data;
}

export async function getMyEvents() {
  const { data } = await api.get<StudyEvent[]>("/events/me");
  return data;
}
