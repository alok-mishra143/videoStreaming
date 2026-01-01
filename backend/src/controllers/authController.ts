import type { Request, Response } from "express";
import User from "../models/User";
import Organization from "../models/Organization";
import generateToken from "../utils/generateToken";

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await (user as any).matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id as any),
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: "User already exists" });
    return;
  }

  const user = await User.create({
    username,
    email,
    password,
    role: "admin", // Default to admin as they are the owner of their account/org
  });

  if (user) {
    // Create default organization
    await Organization.create({
      name: `${user.username}'s Workspace`,
      owner: user._id,
      members: [],
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id as any),
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};
