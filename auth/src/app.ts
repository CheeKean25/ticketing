import cookieSession from "cookie-session";
import cors from "cors";
import express from "express";
import "express-async-errors";
import { currentUserRouter } from "./routes/current-user";
import { signinRouter } from "./routes/signin";
import { signoutRouter } from "./routes/signout";
import { signupRouter } from "./routes/signup";
import { NotFoundError, errorHandler } from "@kentickets/kencommon";

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

app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
