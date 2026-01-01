import type { Request, Response } from "express";
import Organization from "../models/Organization";
import User from "../models/User";

// @desc    Get user's organizations (owned or member)
// @route   GET /api/orgs
// @access  Private
export const getMyOrgs = async (req: any, res: Response) => {
  try {
    const orgs = await Organization.find({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    })
      .populate("owner", "username email")
      .populate("members.user", "username email");
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Add member to organization
// @route   POST /api/orgs/:id/members
// @access  Private (Owner only)
export const addMember = async (req: any, res: Response) => {
  const { email, role } = req.body;
  const orgId = req.params.id;

  try {
    const org = await Organization.findById(orgId);

    if (!org) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    // Check if requester is owner
    if (org.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: "Not authorized to add members" });
      return;
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if already member
    const isMember = org.members.some(
      (member: any) => member.user.toString() === userToAdd._id.toString()
    );
    if (isMember || org.owner.toString() === userToAdd._id.toString()) {
      res.status(400).json({ message: "User is already a member or owner" });
      return;
    }

    org.members.push({ user: userToAdd._id, role: role || "viewer" });
    await org.save();

    res.json(org);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update member role
// @route   PUT /api/orgs/:id/members/:userId
// @access  Private (Owner only)
export const updateMemberRole = async (req: any, res: Response) => {
  const { role } = req.body;
  const { id: orgId, userId } = req.params;

  try {
    const org = await Organization.findById(orgId);

    if (!org) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    // Check if requester is owner
    if (org.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: "Not authorized to update members" });
      return;
    }

    const memberIndex = org.members.findIndex(
      (member: any) => member.user.toString() === userId
    );

    if (memberIndex === -1) {
      res.status(404).json({ message: "Member not found in organization" });
      return;
    }

    (org.members[memberIndex] as any).role = role;
    await org.save();

    res.json(org);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Remove member from organization
// @route   DELETE /api/orgs/:id/members/:userId
// @access  Private (Owner only)
export const removeMember = async (req: any, res: Response) => {
  const { id: orgId, userId } = req.params;

  try {
    const org = await Organization.findById(orgId);

    if (!org) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }

    // Check if requester is owner
    if (org.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: "Not authorized to remove members" });
      return;
    }

    const memberIndex = org.members.findIndex(
      (member: any) => member.user.toString() === userId
    );

    if (memberIndex === -1) {
      res.status(404).json({ message: "Member not found in organization" });
      return;
    }

    org.members.splice(memberIndex, 1);

    await org.save();

    res.json(org);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
