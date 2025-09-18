"use server";

import mongoose, { PipelineStage } from "mongoose";
import { revalidatePath } from "next/cache";

import ROUTES from "@/constants/routes";
import { Collection, Question } from "@/database";

import action from "../handlers/action";
import handleError from "../handlers/error";
import {
  CollectionBaseSchema,
  PaginatedSearchParamsSchema,
} from "../validations";

// NOTE: why we need toggleSaveQuestion
// We need this function to allow users to save or unsave questions
// This function is called when a user clicks on the "Save" or "Unsave" button in the SaveQuestion component
// It checks if the question is already saved by the user, and if so, it removes it from the collection
// If the question is not saved, it adds it to the collection
// This function also revalidates the question page to ensure that the UI reflects the updated saved status
// It is important for enhancing user experience by allowing users to easily manage their saved questions
export async function toggleSaveQuestion(
  params: CollectionBaseParams
): Promise<ActionResponse<{ saved: boolean }>> {
  const validationResult = await action({
    params,
    schema: CollectionBaseSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId } = validationResult.params!;
  const userId = validationResult.session!.user?.id;

  try {
    const question = await Question.findById(questionId);
    if (!question) throw new Error("Question not found");

    const collection = await Collection.findOne({
      question: questionId,
      author: userId,
    });
    // We need author because multiple users can save the same question

    if (collection) {
      await Collection.findByIdAndDelete(collection._id);

      revalidatePath(ROUTES.QUESTION(questionId));
      return { success: true, data: { saved: false } };
    }
    await Collection.create({ question: questionId, author: userId });

    revalidatePath(ROUTES.QUESTION(questionId));

    return {
      success: true,
      data: { saved: true },
    };
  } catch (error) {
    return handleError(error as Error) as ErrorResponse;
  }
}
export async function hasSavedQuestion(
  params: CollectionBaseParams
): Promise<ActionResponse<{ saved: boolean }>> {
  const validationResult = await action({
    params,
    schema: CollectionBaseSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId } = validationResult.params!;
  const userId = validationResult.session!.user?.id;

  try {
    const collection = await Collection.findOne({
      question: questionId,
      author: userId,
    });

    return {
      success: true,
      data: { saved: !!collection }, // why collection? because if collection exists, it means the question is saved
    };
  } catch (error) {
    return handleError(error as Error) as ErrorResponse;
  }
}
// NOTE: why we need hasSavedQuestion?
// We need to know if the user has saved the question or not to update the UI accordingly
// For example, if the user has saved the question, we need to show the "Unsave" button instead of "Save" button
// This function is used in the QuestionDetails component to fetch the saved status of the question for the logged-in user
// It is also used in the SaveQuestion component to optimistically update the UI when the user saves or unsaves a question
// This function is called on the server side to avoid exposing the logic to the client side and to ensure that the data is always up-to-date
// It also helps in reducing the number of requests made to the server by fetching the saved status along with other question details

export async function getSavedQuestions(
  params: PaginatedSearchParams
): Promise<ActionResponse<{ collection: Collection[]; isNext: boolean }>> {
  const validationResult = await action({
    params,
    schema: PaginatedSearchParamsSchema, // No schema validation needed for this action
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const userId = validationResult.session!.user?.id;
  const { page = 1, pageSize = 10, query, filter } = params;
  const skip = (Number(page) - 1) * pageSize;
  const limit = pageSize;

  const sortOptions: Record<string, Record<string, 1 | -1>> = {
    mostrecent: { "question.createdAt": -1 },
    oldest: { "question.createdAt": 1 },
    mostvoted: { "question.upvotes": -1 },
    mostviewed: { "question.views": -1 },
    mostanswered: { "question.answers": -1 },

    // Add more sort options as needed
  };
  const sortCriteria = sortOptions[filter as keyof typeof sortOptions] || {
    "question.createdAt": -1,
  };

  try {
    // we use pipeline because we need to join two collections: Collection and Question. Pipeline allows us to perform complex queries and transformations on the data, such as filtering, sorting, and pagination, all in one go. This is more efficient than fetching the data separately and then combining it in memory.
    const pipeline: PipelineStage[] = [
      { $match: { author: new mongoose.Types.ObjectId(userId) } }, // Match collections by the logged-in user
      {
        $lookup: {
          from: "questions", // The collection to join
          localField: "question", // Field from the Collection collection
          foreignField: "_id", // Field from the Question collection
          as: "question", // Output array field
        },
      },
      {
        $unwind: "$question", // Deconstruct the question array field to get a single question object
      },
      {
        $lookup: {
          from: "users",
          localField: "question.author",
          foreignField: "_id",
          as: "question.author",
        },
      },
      {
        $unwind: "$question.author", // Deconstruct the author array field to get a single author object
      },
      {
        $lookup: {
          from: "tags",
          localField: "question.tags",
          foreignField: "_id",
          as: "question.tags",
        },
      },
    ];

    if (query) {
      pipeline.push({
        $match: {
          $or: [
            { "question.title": { $regex: query, $options: "i" } },
            { "question.content": { $regex: query, $options: "i" } }, // Case-insensitive search
          ],
        },
      });
    }

    const [totalCount] = await Collection.aggregate([
      ...pipeline,
      { $count: "count" },
    ]);
    // totalCount is an array with a single object { count: number }
    // If there are no matching documents, totalCount will be an empty array

    // You may want to add sorting, pagination, and execute the aggregation here
    // Example:
    pipeline.push({ $sort: sortCriteria });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    pipeline.push({ $project: { question: 1, author: 1 } }); // Select only the fields we need to reduce the amount of data transferred. 1 means include the field, 0 means exclude the field.

    const questions = await Collection.aggregate(pipeline);
    const isNext = totalCount?.count > skip + questions.length;

    return {
      success: true,
      data: { collection: JSON.parse(JSON.stringify(questions)), isNext },
    };
  } catch (error) {
    return handleError(error as Error) as ErrorResponse;
  }
}
