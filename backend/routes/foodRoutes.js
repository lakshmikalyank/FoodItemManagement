const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Food = require("../models/Food");
const authMiddleware = require("../middleware/auth");

// Every food route requires a logged in user
router.use(authMiddleware);

const LOW_STOCK_LIMIT = 10;

const getStatus = (qty) => {
  if (qty <= 0) return "Out of Stock";
  if (qty <= LOW_STOCK_LIMIT) return "Low Stock";
  return "In Stock";
};

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// Validate + clean the incoming body. Returns { error } or { data }
const parseFoodBody = (body, partial = false) => {
  const data = {};

  if (!partial || body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (!name) return { error: "Food name is required" };
    data.name = name;
  }

  if (!partial || body.category !== undefined) {
    const category = String(body.category || "").trim();
    if (!category) return { error: "Category is required" };
    data.category = category;
  }

  if (!partial || body.quantity !== undefined) {
    const quantity = Number(body.quantity);
    if (body.quantity === "" || body.quantity === null || Number.isNaN(quantity)) {
      return { error: "Quantity must be a number" };
    }
    if (quantity < 0) return { error: "Quantity cannot be negative" };
    data.quantity = quantity;
  }

  if (!partial || body.expiryDate !== undefined) {
    const expiry = new Date(body.expiryDate);
    if (!body.expiryDate || Number.isNaN(expiry.getTime())) {
      return { error: "A valid expiry date is required" };
    }
    data.expiryDate = expiry;
  }

  if (data.quantity !== undefined) {
    data.status = getStatus(data.quantity);
  }

  return { data };
};

// GET ALL FOODS (only the logged in user's items)
router.get("/", async (req, res) => {
  try {
    const foods = await Food.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(foods);
  } catch (error) {
    res.status(500).json({
      message: "Failed to Fetch Items",
      error: error.message,
    });
  }
});

// ADD FOOD
router.post("/", async (req, res) => {
  try {
    const { error, data } = parseFoodBody(req.body);
    if (error) return res.status(400).json({ message: error });

    const item = new Food({ ...data, user: req.user.id });
    await item.save();

    res.status(201).json({
      message: "Item Added Successfully",
      item,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to Add Item",
      error: error.message,
    });
  }
});

// UPDATE FOOD
router.put("/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: "Invalid item id" });
    }

    const { error, data } = parseFoodBody(req.body, true);
    if (error) return res.status(400).json({ message: error });

    const updatedItem = await Food.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      data,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({
      message: "Item Updated Successfully",
      updatedItem,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to Update Item",
      error: error.message,
    });
  }
});

// DELETE FOOD
router.delete("/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: "Invalid item id" });
    }

    const deleted = await Food.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({
      message: "Item Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to Delete Item",
      error: error.message,
    });
  }
});

module.exports = router;
