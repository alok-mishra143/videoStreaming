import express from "express";
import {
  getMyOrgs,
  addMember,
  updateMemberRole,
  removeMember,
} from "../controllers/orgController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", protect, getMyOrgs);
router.post("/:id/members", protect, addMember);
router.put("/:id/members/:userId", protect, updateMemberRole);
router.delete("/:id/members/:userId", protect, removeMember);

export default router;
