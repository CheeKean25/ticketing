import express, { NextFunction, Request, Response } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import { User } from "../models/user";
import { BadRequestError, validateRequest } from "@kentickets/kencommon";

const router = express.Router();

router.post(
  "/api/users/signup",
  [
    body("email", "Email must be valid").notEmpty().bail().isEmail(),
    body("password", "Password must be between 4 and 20 characters length")
      .trim()
      .notEmpty()
      .bail()
      .isLength({ min: 4, max: 20 }),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const existingUser = await User.findOne({
        email,
      });

      if (existingUser) {
        throw new BadRequestError("Email in use");
      }

      const user = User.build({ email, password });
      await user.save();

      // Generate JWT
      const userJwt = jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        process.env.JWT_KEY!
      );

      // Store it on session object
      // The cookie on browser need to use base64decode to check the jwt
      // Use jwt website to check the jwt values
      req.session = {
        jwt: userJwt,
      };
      res.status(201).send(user);
    } catch (error) {
      next(error);
    }
  }
);

export { router as signupRouter };
