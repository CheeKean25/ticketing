import {
  NotAuthorizedError,
  NotFoundError,
  validateRequest,
} from "@kentickets/kencommon";
import express, { Request, Response } from "express";
import { param } from "express-validator";
import mongoose from "mongoose";
import { Order, OrderStatus } from "../models/order";
import { OrderCancelledPublisher } from "../events/publishers/order-cancelled-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();

router.delete(
  "/api/orders/:orderId",
  [
    param("orderId", "Order id must be provided")
      .notEmpty()
      .bail()
      .isString()
      .bail()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid order id"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.orderId).populate("ticket");
    if (!order) {
      throw new NotFoundError();
    }

    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    // Update the status of order to cancelled
    order.set({ status: OrderStatus.Cancelled });
    await order.save();

    // publishing an event saying this was cancelled
    await new OrderCancelledPublisher(natsWrapper.client).publish({
      id: order.id,
      version: order.version,
      ticket: {
        id: order.ticket.id,
      },
    });
    res.status(204).send();
  }
);

export { router as deleteOrderRouter };
