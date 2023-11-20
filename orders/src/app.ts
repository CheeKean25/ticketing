import {
  NotFoundError,
  currentUser,
  errorHandler,
} from "@kentickets/kencommon";
import cookieSession from "cookie-session";
import cors from "cors";
import express from "express";
import "express-async-errors";
import { deleteOrderRouter } from "./routes/delete";
import { indexOrderRouter } from "./routes";
import { showOrderRouter } from "./routes/show";
import { createOrderRouter } from "./routes/new";

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
app.use(deleteOrderRouter);
app.use(indexOrderRouter);
app.use(showOrderRouter);
app.use(createOrderRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
