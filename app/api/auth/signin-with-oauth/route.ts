import mongoose from "mongoose";
import { NextResponse } from "next/server";
import slugify from "slugify";

import Account from "@/database/account.model";
import User from "@/database/user.model";
import handleError from "@/lib/handlers/error";
import { ValidationError } from "@/lib/http-errors";
import dbConnect from "@/lib/mongoose";
import { SignInWithOAuthSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const { provider, providerAccountId, user } = await request.json();

  await dbConnect();

  const session = await mongoose.startSession();
  // Rozpoczęcie transakcji mongoose.startSession() i session.startTransaction() aby zapewnić, że wszystkie operacje bazy danych zostaną wykonane atomowo (wszystkie albo żadne).
  session.startTransaction();

  try {
    const validatedData = SignInWithOAuthSchema.safeParse({
      provider,
      providerAccountId,
      user,
    });

    if (!validatedData.success)
      throw new ValidationError(validatedData.error.flatten().fieldErrors);

    const { name, username, email, image } = user;
    const slugifiedUsername = slugify(username, {
      lower: true,
      strict: true,
      trim: true,
    });

    // session(session) - only if everything succeeds, then we can proceed to make those database changes check session-notes.md

    // wywoływanie .session(session) w ten sposób jest możliwe dzięki elastycznemu modelowi zapytań Mongoose, który pozwala na łatwe modyfikowanie zachowania zapytań przez łączenie metod.

    // Mongoose zaprojektowano tak, aby umożliwiać łączenie wielu metod w łańcuchu (chaining). Metody takie jak .select(), .sort(), .limit() czy .session() mogą być wywoływane po sobie, aby modyfikować zapytanie.

    // .session(session) jest metodą zapytania, która akceptuje obiekt sesji jako argument. Ta metoda informuje Mongoose, że dana operacja powinna być wykonana w kontekście podanej sesji transakcyjnej. Dzięki temu operacje bazy danych mogą być częścią większej transakcji.

    let existingUser = await User.findOne({ email }).session(session);

    console.log("🚀 ~ POST ~ existingUser:", existingUser);
    if (!existingUser) {
      [existingUser] = await User.create(
        [{ name, username: slugifiedUsername, email, image }],
        { session }
      );
    } else {
      const updatedData: { name?: string; image?: string } = {};

      if (existingUser.name !== name) updatedData.name = name;
      if (existingUser.image !== image) updatedData.image = image;

      if (Object.keys(updatedData).length > 0) {
        await User.updateOne(
          { _id: existingUser._id },
          { $set: updatedData }
        ).session(session); // if sth goes wrong we stop the session
      }
    }
    const existingAccount = await Account.findOne({
      userId: existingUser._id,
      provider,
      providerAccountId,
    }).session(session);

    if (!existingAccount) {
      await Account.create(
        [
          {
            userId: existingUser._id,
            name,
            image,
            provider,
            providerAccountId,
          },
        ],
        { session }
      );
    }

    // NOTE: Dla zapytań (odczyt) sesję dołącza się za pomocą metody .session(), ponieważ zapytania w Mongoose są obiektami typu Query, które mają dedykowane metody łańcuchowe.

    // Dla operacji modyfikujących sesję przekazuje się jako opcję w obiekcie konfiguracyjnym, co jest zgodne z API MongoDB dla operacji takich jak insert, update, itp.

    await session.commitTransaction(); // apply either all of them or none of them - 'atomic function'

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    await session.abortTransaction();
    return handleError(error, "api") as APIErrorResponse;
  } finally {
    session.endSession();
  }
}
