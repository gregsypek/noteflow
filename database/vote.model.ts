import { Schema, models, model, Types, Document } from "mongoose";

export interface IVote {
  author: Types.ObjectId;
  actionId: Types.ObjectId;
  actionType: string;
  voteType: string;
}

// NOTE: actionId nie ma ref, bo jest to pole generyczne, które może wskazywać na różne kolekcje (Question lub Answer), a actionType określa kontekst.

// Oznacza to, że Mongoose nie wie, skąd automatycznie pobrać dane dla actionId, co wymaga ręcznej logiki w aplikacji, ale daje elastyczność w modelowaniu danych.

// if (vote.actionType === "question") {
//   const question = await Question.findById(vote.actionId);
// } else if (vote.actionType === "answer") {
//   const answer = await Answer.findById(vote.actionId);
// }

export interface IVoteDoc extends IVote, Document {}
const VoteSchema = new Schema<IVote>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actionId: { type: Schema.Types.ObjectId, required: true },
    actionType: { type: String, enum: ["question", "answer"], required: true },
    voteType: { type: String, enum: ["upvote", "downvote"], required: true },
  },
  { timestamps: true }
);

const Vote = models?.Vote || model<IVote>("Vote", VoteSchema);

export default Vote;
