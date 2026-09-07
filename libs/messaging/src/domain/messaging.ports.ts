import type { Message, TutorInterest } from './messaging.types';

export interface MessageRepository {
  findById(id: string): Promise<Message | null>;
  save(message: Message): Promise<void>;
  listBetween(participantA: string, participantB: string): Promise<Message[]>;
  listThreadsFor(participantId: string): Promise<string[]>;
  markRead(id: string, at: string): Promise<void>;
}

export interface InterestRepository {
  find(studentId: string, tutorId: string): Promise<TutorInterest | null>;
  record(interest: TutorInterest): Promise<void>;
  forTutor(tutorId: string): Promise<TutorInterest[]>;
}
