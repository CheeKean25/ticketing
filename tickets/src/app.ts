import {
  NotFoundError,
  currentUser,
  errorHandler,
} from "@kentickets/kencommon";
import cookieSession from "cookie-session";
import cors from "cors";
import express from "express";
import "express-async-errors";
import { createTicketRouter } from "./routes/new";
import { showTicketRouter } from "./routes/show";
import { indexTicketRouter } from "./routes";
import { updateTicketRouter } from "./routes/update";

const app = express();

app.use(express.json());
app.use(cors());
app.set("trust proxy", true);
app.use(
  cookieSession({
    signed: false,
    // secure: true, // Comment for testing http local
  })
);
app.use(currentUser);
app.use(createTicketRouter);
app.use(showTicketRouter);
app.use(indexTicketRouter);
app.use(updateTicketRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
