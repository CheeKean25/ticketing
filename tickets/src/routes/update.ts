import {
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  requireAuth,
  validateRequest,
} from "@kentickets/kencommon";
import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import mongoose from "mongoose";
import { Ticket } from "../models/ticket";
import { natsWrapper } from "../nats-wrapper";
import { TicketUpdatedPublisher } from "../events/publishers/ticket-updated-publisher";

const router = express.Router();

router.put(
  "/api/tickets/:id",
  requireAuth,
  [
    body("title", "Title is required").notEmpty().bail().isString(),
    body("price", "Price is required")
      .notEmpty()
      .bail()
      .isFloat({ gt: 0 })
      .withMessage("Price must be greater than 0"),
    param("id", "Ticket id is required")
      .notEmpty()
      .bail()
      .isString()
      .bail()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid ticket id"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { price, title } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      throw new NotFoundError();
    }

    if (ticket.orderId) {
      throw new BadRequestError("Cannot edit a reserved ticket");
    }

    if (ticket.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    ticket.set({
      title,
      price,
    });

    await ticket.save();

    await new TicketUpdatedPublisher(natsWrapper.client).publish({
      id: ticket.id,
      price: ticket.price,
      title: ticket.title,
      userId: ticket.userId,
      version: ticket.version,
    });

    res.status(200).send(ticket);
  }
);

export { router as updateTicketRouter };
