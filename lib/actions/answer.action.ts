"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

import ROUTES from "@/constants/routes";
import { Question, Vote } from "@/database";
import Answer, { IAnswerDoc } from "@/database/answer.model";

import action from "../handlers/action";
import handleError from "../handlers/error";
import {
  AnswerServerSchema,
  DeleteAnswerSchema,
  GetAnswersSchema,
} from "../validations";
import { DEFAULT_PAGE_SIZE } from "@/constants";

export async function createAnswer(
  params: CreateAnswerParams
): Promise<ActionResponse<IAnswerDoc>> {
  const validationResult = await action({
    params,
    schema: AnswerServerSchema,
    authorize: true,
  });
  // console.log("🚀 ~ createAnswer ~ validationResult:", validationResult);

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { content, questionId } = validationResult.params!;
  const userId = validationResult?.session?.user?.id;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const question = await Question.findById(questionId);
    console.log("🚀 ~ createAnswer ~ question:", question);

    if (!question) {
      throw new Error("Question not found");
    }
    const [newAnswer] = await Answer.create(
      [{ author: userId, content, question: questionId }],
      { session }
    );

    if (!newAnswer) {
      throw new Error("Failed to create answer");
    }

    question.answers += 1;
    await question.save({ session });
    await session.commitTransaction();
    revalidatePath(ROUTES.QUESTION(questionId));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(newAnswer)),
    };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error as Error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}

export async function getAnswers(params: GetAnswersParams): Promise<
  ActionResponse<{
    answers: Answer[];
    isNext: boolean;
    totalAnswers: number;
  }>
> {
  const validationResult = await action({
    params,
    schema: GetAnswersSchema,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }
  const { questionId, page = 1, pageSize = DEFAULT_PAGE_SIZE, filter } = params;

  const skip = (Number(page) - 1) * pageSize;
  const limit = pageSize;

  let sortCriteria = {};

  switch (filter) {
    case "latest":
      sortCriteria = { createdAt: -1 };
      break;
    case "oldest":
      sortCriteria = { createdAt: 1 };
      break;
    case "popular":
      sortCriteria = { upvotes: -1 };
      break;
    default:
      sortCriteria = { createdAt: -1 };
      break;
  }

  try {
    const totalAnswers = await Answer.countDocuments({ question: questionId });
    //
    const answers = await Answer.find({ question: questionId })
      .populate("author", "_id name image")
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);

    const isNext = totalAnswers > skip + answers.length;

    return {
      success: true,
      data: {
        answers: JSON.parse(JSON.stringify(answers)),
        isNext,
        totalAnswers,
      },
    };
  } catch (error) {
    return handleError(error as Error) as ErrorResponse;
  }
}

export async function deleteAnswer(
  params: DeleteAnswerParams
): Promise<ActionResponse> {
  const validationResult = await action({
    params,
    schema: DeleteAnswerSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { answerId } = validationResult.params!;
  console.log("🚀 ~ deleteAnswer ~ answerId:", answerId);
  const { user } = validationResult.session!;
  const session = await mongoose.startSession();

  try {
    // implement logic here
    const answer = await Answer.findById(answerId).session(session);
    // console.log("🚀 ~ deleteAnswer ~ answer:", answer);

    //  deleteAnswer ~ answer: {
    //   _id: new ObjectId('68f89d748f1780213688dcee'),
    //   author: new ObjectId('68b4116f2fd8b12349839b8d'),
    //   question: new ObjectId('68f89cfa8f1780213688dc97'),
    //   content: '```jsx\n' +
    //     'true },\n' +
    //     '    content: { type: String, required: true },\n' +
    //     '    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],\n' +
    //     '    views: { type: Number, default: 0 },\n' +
    //     '    answers: { type: Number, default: 0 },\n' +
    //     '    upvotes: { type: Number, default: 0 },\n' +
    //     '    downvotes: { type: Number, default: 0 },\n' +
    //     '    author: { type: Schema.Types.ObjectId, ref: "User", required: true },\n' +
    //     '  },\n' +
    //     '```',
    //   upvotes: 0,
    //   downvotes: 0,
    //   createdAt: 2025-10-22T09:01:40.777Z,
    //   updatedAt: 2025-10-22T09:01:40.777Z,
    //   __v: 0
    // }

    if (!answer) {
      throw new Error("Answer not found");
    }

    if (answer.author.toString() !== user?.id) {
      throw new Error("Unauthorized to delete this answer");
    }

    // reduce the question answers count
    await Question.findByIdAndUpdate(
      answer.question, // what is answer.question type
      { $inc: { answers: -1 } },
      { new: true }
    );

    // delete votes associated with answer
    await Vote.deleteMany({ actionId: answerId, actionType: "answer" });

    // delete the answer
    await Answer.findByIdAndDelete(answerId);

    revalidatePath(`/profile/${user?.id}`);

    return { success: true };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
