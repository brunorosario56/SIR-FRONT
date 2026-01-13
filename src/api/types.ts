export type User = {
  _id: string;
  nome: string;
  email: string;
  avatar?: string;
  createdAt?: string;
};

export type ScheduleBlock = {
  disciplina: string;
  sala?: string;
  diaSemana: number; // 1..7
  horaInicio: string; // "HH:MM"
  horaFim: string; // "HH:MM"
};

export type Schedule = {
  user: string;
  blocos: ScheduleBlock[];
};

export type Group = {
  _id: string;
  nome: string;
  descricao?: string;
  owner: string | User;
  membros: string[] | User[];
};

export type Slot = {
  diaSemana: number;
  inicio: string; // "HH:MM"
  fim: string; // "HH:MM"
};

export type StudyEvent = {
  _id: string;
  group: string | Group;
  criador: string | User;
  titulo: string;
  descricao?: string;
  inicio: string; // ISO
  fim: string; // ISO
  local?: string;
  createdAt: string;
  updatedAt: string;
};

export type PresenceEntry = {
  online: boolean;
  lastSeen?: string;
};

export type FriendRequest = {
  _id: string;
  from: User;
  to: User;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export type GroupSlotsResponse = {
  groupId: string;
  slots: Slot[];
  membros?: User[];
};
