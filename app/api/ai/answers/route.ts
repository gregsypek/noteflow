import Groq from "groq-sdk";
import { NextResponse } from "next/server";

import handleError from "@/lib/handlers/error";
import { ValidationError } from "@/lib/http-errors";
import { AIAnswerSchema } from "@/lib/validations";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  const { question, content, userAnswer } = await req.json();

  try {
    const validatedData = AIAnswerSchema.safeParse({
      question,
      content,
    });
    // Note; why not parse? because we want to handle the error and return a proper response
    if (!validatedData.success) {
      throw new ValidationError(validatedData.error.flatten().fieldErrors);
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Generate a markdown-formatted response to the following question: "${question}". Consider the provided context: **Context:** ${content} Also, prioritize and incorporate the user's answer when formulating your response: **User's Answer:** ${userAnswer} Prioritize the user's answer only if it's correct. If it's incomplete or incorrect, improve or correct it while keeping the response concise and to the point.Provide the final answer in markdown format.`,
        },
        {
          role: "user",
          content: `You are a helpful assistant that provides informative responses in markdown format. Use appropriate markdown syntax for headings, lists, code blocks, and emphasis where necessary. For code blocks, use short-form smaller case language identifiers (e.g., 'js' for JavaScript, 'py' for Python, 'ts' for TypeScript, 'html' for HTML, 'css' for CSS, etc.).`,
        },
      ],
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const text = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ success: true, data: text }, { status: 200 });
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}
