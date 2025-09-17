"use server";

import { revalidatePath } from "next/cache";

import ROUTES from "@/constants/routes";
import { Collection, Question } from "@/database";

import action from "../handlers/action";
import handleError from "../handlers/error";
import { CollectionBaseSchema } from "../validations";

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
