import { NotFoundError, validateRequest } from "@kentickets/kencommon";
import express, { Request, Response } from "express";
import { param } from "express-validator";
import mongoose from "mongoose";
import { Ticket } from "../models/ticket";

const router = express.Router();

router.get(
  "/api/tickets/:id",
  [
    param("id", "Ticket id is required")
      .notEmpty()
      .bail()
      .isString()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid ticket id"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      throw new NotFoundError();
    }

    res.status(200).send(ticket);
  }
);

export { router as showTicketRouter };
