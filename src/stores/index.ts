// All app data lives in Firestore via createLocalStore (Firebase-backed).

import { createLocalStore } from "@/lib/local-store";
import { query, where, or } from "firebase/firestore";

/* ---------------- PYQ ---------------- */
export type PYQStream = "boards" | "jee" | "neet";
export type PYQSubject = "Mathematics" | "Physics" | "Chemistry" | "Biology" | "English";
export type PYQClass = "11" | "12" | "Others";
export type PYQPaper = {
  id: string;
  stream?: PYQStream; // defaults to "boards" for legacy rows
  subject: PYQSubject;
  klass: PYQClass;
  year: number;
  title: string;
  url: string;
  uploadedAt: string;
};

export const pyqStore = createLocalStore<PYQPaper[]>("sn-pyq", []);

/* ---------------- Notes ---------------- */
export type NoteDoc = {
  id: string;
  stream?: PYQStream;
  subject: PYQSubject;
  chapter: string;
  title: string;
  url: string;
  uploadedAt: string;
};
export const notesStore = createLocalStore<NoteDoc[]>("sn-notes", []);

/* ---------------- Meetings ---------------- */
export type Meeting = {
  id: string;
  kind: "global" | "peer";
  title: string;
  hostName: string;
  hostEmail: string;
  startsAt: string;
  meetUrl: string;
  description?: string;
  createdAt: string;
};
export const meetingsStore = createLocalStore<Meeting[]>("sn-meetings", []);

/* ---------------- Schedule ---------------- */
export type ScheduleEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "academic" | "extracurricular" | "career" | "other";
  notes?: string;
  createdAt: string;
};
export const scheduleStore = createLocalStore<ScheduleEvent[]>("sn-schedule", []);

/* ---------------- Chat ---------------- */
export type GroupMsg = { id: string; senderEmail: string; senderName: string; body: string; at: string };
export type DM = { id: string; from: string; to: string; body: string; at: string; senderName?: string };
export const groupChatStore = createLocalStore<GroupMsg[]>("sn-chat-group", []);
export const dmStore = createLocalStore<DM[]>("sn-chat-dm", [], (col, user) => 
  user.role === "admin" ? col as unknown as ReturnType<typeof query> : query(col, or(where("from", "==", user.email), where("to", "==", user.email)))
);

/* ---------------- Skill Share ---------------- */
export type SkillPost = {
  id: string;
  authorEmail: string;
  authorName: string;
  title: string;
  body: string;
  videoUrl?: string;
  classUrl?: string;
  createdAt: string;
};
export const skillStore = createLocalStore<SkillPost[]>("sn-skill", []);

/* ---------------- Coding Workshops ---------------- */
export type CodingWorkshop = {
  id: string;
  title: string;
  language: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  startsAt: string;
  meetUrl: string;
  blurb: string;
};
export const codingStore = createLocalStore<CodingWorkshop[]>("sn-coding", []);

/* ---------------- Career Sessions ---------------- */
export type CareerLive = { id: string; title: string; mentor: string; startsAt: string; meetUrl: string };
export type CareerVideo = { id: string; title: string; speaker?: string; thumb?: string; videoUrl?: string; documentUrl?: string };
export const careerLiveStore = createLocalStore<CareerLive[]>("sn-career-live", []);
export const careerVideoStore = createLocalStore<CareerVideo[]>("sn-career-vids", []);

/* ---------------- Founder Inbox ---------------- */
export type FounderMsg = { id: string; fromName: string; fromEmail: string; body: string; at: string };
export const founderInboxStore = createLocalStore<FounderMsg[]>("sn-founder-inbox", []);

/* ---------------- Payment Requests ---------------- */
export type PaymentRequest = {
  id: string;
  uid: string;
  email: string;
  name: string;
  utr: string;
  note?: string;
  status: "pending" | "verified" | "rejected";
  at: string;
};
export const paymentRequestsStore = createLocalStore<PaymentRequest[]>("sn-payments", []);

/* ---------------- MUN (admin-controlled) ---------------- */
export type MunItem = {
  id: string;
  committee: string;
  title: string;
  agenda: string;
  blocs: string[];
  side?: "crimson" | "azure";
  documentUrl?: string;
};
export const munStore = createLocalStore<MunItem[]>("sn-mun", []);

/* ---------------- Olympiads (admin-controlled) ---------------- */
export type OlympiadResource = { title: string; url: string };
export type OlympiadItem = {
  id: string;
  subject: string;
  topics: string[];
  examDate?: string;
  resources?: OlympiadResource[];
  blurb?: string;
};
export const olympiadStore = createLocalStore<OlympiadItem[]>("sn-olympiads", []);
