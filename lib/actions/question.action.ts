"use server";

import mongoose from "mongoose";

import Question from "@/database/question.model";
import TagQuestion from "@/database/tag-question.model";
import Tag, { ITagDoc } from "@/database/tag.modeL";

import action from "../handlers/action";
import handleError from "../handlers/error";
import {
  AskQuestionSchema,
  EditQuestionSchema,
  GetQuestionSchema,
} from "../validations";

export async function createQuestion(
  params: CreateQuestionParams
): Promise<ActionResponse<Question>> {
  const validationResult = await action({
    params,
    schema: AskQuestionSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { title, content, tags } = validationResult.params!;
  const userId = validationResult?.session?.user?.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [question] = await Question.create(
      [{ title, content, author: userId }],
      { session }
    );

    if (!question) {
      throw new Error("Failed to create question");
    }

    const tagIds: mongoose.Types.ObjectId[] = [];
    const tagQuestionDocuments = [];

    for (const tag of tags) {
      const existingTag = await Tag.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${tag}$`, "i") } },
        { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
        { upsert: true, new: true, session }
      );

      tagIds.push(existingTag._id);
      tagQuestionDocuments.push({
        tag: existingTag._id,
        question: question._id,
      });
    }

    await TagQuestion.insertMany(tagQuestionDocuments, { session });

    await Question.findByIdAndUpdate(
      question._id,
      { $push: { tags: { $each: tagIds } } },
      { session }
    );

    await session.commitTransaction();

    return { success: true, data: JSON.parse(JSON.stringify(question)) };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    session.endSession();
  }
}
export async function editQuestion(
  params: EditQuestionParams
): Promise<ActionResponse<Question>> {
  const validationResult = await action({
    params,
    schema: EditQuestionSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { title, content, tags, questionId } = validationResult.params!;
  const userId = validationResult?.session?.user?.id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const question = await Question.findById(questionId).populate("tags");
    console.log("🚀 ~ editQuestion ~ question:", question);

    if (!question) {
      throw new Error("Question not found");
    }
    if (question.author.toString() !== userId) {
      throw new Error("You are not authorized to edit this question");
    }

    if (question.title !== title || question.content !== content) {
      question.title = title;
      question.content = content;
      await question.save({ session });
    }
    const tagsToAdd = tags.filter(
      (tag) => !question.tags.includes(tag.toLowerCase())
    );

    const tagsToRemove = question.tags.filter(
      (tag: ITagDoc) => !tags.includes(tag.name.toLowerCase())
    );

    // ^ — oznacza początek stringa.
    // ${tag} — wstawia szukaną wartość (np. "javascript").
    // $ — oznacza koniec stringa.

    const newTagDocuments = [];
    if (tagsToAdd.length > 0) {
      for (const tag of tagsToAdd) {
        const existingTag = await Tag.findOneAndUpdate(
          { name: { $regex: new RegExp(`^${tag}$`, "i") } },
          { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
          { upsert: true, new: true, session } // upsert: true mówi:
          // "Jeśli nie znajdziesz dokumentu, to go utwórz z danymi z $setOnInsert."
        );

        newTagDocuments.push({
          tag: existingTag._id,
          question: question._id,
        });
        if (existingTag) {
          newTagDocuments.push({
            tag: existingTag._id,
            question: questionId,
          });
          question.tags.push(existingTag._id);
        }
      }
    }
    if (tagsToRemove.length > 0) {
      const tagIdsToRemove = tagsToRemove.map((tag: ITagDoc) => tag._id);

      await Tag.updateMany(
        { _id: { $in: tagIdsToRemove } },
        { $inc: { questions: -1 } },
        { session }
      );

      await TagQuestion.deleteMany(
        { tag: { $in: tagIdsToRemove }, question: questionId },
        { session }
      );

      question.tags = question.tags.filter(
        (tagId: mongoose.Types.ObjectId) => !tagsToRemove.includes(tagId)
      );
    }
    if (newTagDocuments.length > 0) {
      await TagQuestion.insertMany(newTagDocuments, { session });
    }
    await question.save({ session });
    await session.commitTransaction();
    return { success: true, data: JSON.parse(JSON.stringify(question)) };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}
export async function getQuestion(
  params: GetQuestionParams
): Promise<ActionResponse<Question>> {
  const validationResult = await action({
    params,
    schema: GetQuestionSchema,
    authorize: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { questionId } = validationResult.params!;
  try {
    const question = await Question.findById(questionId).populate("tags");

    if (!question) {
      throw new Error("Question not found");
    }
    return { success: true, data: JSON.parse(JSON.stringify(question)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

// 1. Server Actions w skrócie
// Server Action to funkcja, która zawsze uruchamia się po stronie serwera — niezależnie od tego, czy wywołujesz ją z komponentu serwerowego, czy klienckiego.
// Różnica polega tylko na sposobie wywołania.
// 2. Dwa konteksty użycia
// A. W Server Component
// Wywołanie jest bezpośrednie (direct invocation).
// Kod komponentu serwerowego i kod Server Action działają w tym samym środowisku — na serwerze.
// Nie ma żadnego HTTP requestu ani fetch’a — Next.js po prostu wywołuje funkcję w pamięci (tak jak zwykłą funkcję async w Node.js).
// 📌 Przykład:
// // Server Component
// import { saveData } from './actions';

// export default async function Page() {
//   await saveData({ foo: 'bar' }); // bezpośrednie wywołanie
//   return <div>Dane zapisane</div>;
// }
// Tutaj saveData() po prostu uruchamia się na serwerze od razu.
// B. W Client Component
// Gdy Server Action jest użyta np. jako action w <form> albo w event handlerze (onClick, onSubmit), wywołanie idzie przez POST request do serwera.
// Next.js generuje endpoint „w tle” i wysyła dane formularza/eventu do tego endpointu.
// Serwer odbiera dane i uruchamia Server Action.
// 📌 Przykład:
// 'use client';
// import { saveData } from './actions';

// export default function Form() {
//   return (
//     <form action={saveData}>
//       <input name="foo" defaultValue="bar" />
//       <button type="submit">Zapisz</button>
//     </form>
//   );
// }
// Tutaj po kliknięciu przycisku przeglądarka wysyła POST do wygenerowanego przez Next.js endpointu, a tam wywoływana jest saveData().
// 3. Dlaczego tak?
// W Server Component wszystko jest już po stronie serwera — nie ma sensu robić HTTP requestu do samego siebie.
// W Client Component kod działa w przeglądarce, więc żeby uruchomić kod serwerowy, trzeba wysłać request.
