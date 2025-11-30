import mongoose from "mongoose";

const menuSchema = mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    menuName: {
      type: String,
      required: true,
    },
    menuDescription: {
      type: String,
    },
    clientName: {
      type: String,
    },
    venue: {
      type: String,
      required: true,
    },
    menuDate: {
      type: Date,
      // required: true,
    },
    price: {
      type: String,
    },
    lastPageDescription: {
      type: String,
    },
    jobId: {
      type: String,
    },
    notified: {
      type: Boolean,
      default: false,
    },
    pageBreak:{
      type: Array
    },
    status:{
      type: String,
      enum: ["CONFIRMED", "COMPLETED", "UNCONFIRMED", "CANCELLED"],
      default: "UNCONFIRMED",
    },
    pageOptions: {
      type: [
        {
          page: { type: Number },
          menuDate: { type: Date },
          menuTime: { type: String },
          guestNo: { type: Number },
          ratePerHead: { type: Number },
        },
      ],
      default: [],
    },
    details: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Details" }],
    },
  },
  { timestamps: true }
);

export const Menu = mongoose.model("Menu", menuSchema);
