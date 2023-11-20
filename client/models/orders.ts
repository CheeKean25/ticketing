import { Tickets } from "./tickets";

export interface Orders {
  id: string;
  version: number;
  userId: string;
  price: number;
  status: string;
  expiresAt: string;
  ticket: Tickets;
}
