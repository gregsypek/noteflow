import Link from "next/link";

import QuestionCard from "@/components/cards/QuestionCard";
import HomeFilter from "@/components/filters/HomeFilter";
import LocalSearch from "@/components/search/LocalSearch";
import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";
import handleError from "@/lib/handlers/error";

const notes = [
  {
    _id: "1",
    title: "How to learn React?",
    prompt: "I want to learn React, write me some basic info",
    tags: [
      { _id: "1", name: "React" },
      { _id: "2", name: "JavaScript" },
    ],
    author: {
      _id: "1",
      name: "John Doe",
      image: "/images/avatar.png",
    },
    upvotes: 10,
    answers: 5,
    views: 100,
    createdAt: new Date("2022-03-11"),
  },
  {
    _id: "2",
    title: "How to learn JavaScript?",
    prompt: "I want to learn JavaScript, start from basics",
    tags: [{ _id: "1", name: "JavaScript" }],
    author: {
      _id: "2",
      name: "John Rambo",
      image: "/images/avatar.png",
    },
    upvotes: 10,
    answers: 5,
    views: 100,
    createdAt: new Date("2025-02-01"),
  },
];

const test = async () => {
  try {
    throw new Error("Test error");
  } catch (error) {
    return handleError(error);
  }
};

interface SearchParams {
  searchParams: Promise<{ [key: string]: string }>;
}

// NOTE: Next.js automatically passes an object with a searchParams property to any page.tsx component.

// The searchParams prop contains the query parameters from the URL (e.g., { query: "test" }).

// In Next.js 13+, searchParams is a Promise because it supports both server-side rendering (SSR) and static generation, where the data might need to be fetched or resolved asynchronously.

const Home = async ({ searchParams }: SearchParams) => {
  const { query = "", filter = "" } = await searchParams;

  const result = await test();
  console.log("🚀 ~ Home ~ result:", result);

  const filteredNotes = notes.filter((note) => {
    const matchesQuery = note.title
      .toLowerCase()
      .includes(query?.toLocaleLowerCase());

    const matchesFilter = filter
      ? note.tags[0].name.toLowerCase() === filter.toLowerCase()
      : true;
    return matchesQuery && matchesFilter;
  });

  return (
    <>
      <section className="flex w-full flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="h1-bold text-dark100_light900">All Notes</h1>
        <Button className="primary-gradient  min-h-[46px] px-4 py-3" asChild>
          <Link href={ROUTES.ASK_QUESTION}>Make a Note</Link>
        </Button>
      </section>
      <section className="mt-11">
        <LocalSearch
          route="/"
          imgSrc="/icons/search.svg"
          placeholder="Search notes..."
          otherClasses="flex-1"
        />
      </section>

      <HomeFilter />
      <div className="mt-10 flex w-full flex-col gap-6">
        {filteredNotes.map((note) => (
          // <h1 key={note._id}>{note.title}</h1>
          <h1 key={note._id}>
            <QuestionCard key={note._id} question={note} />
          </h1>
        ))}
      </div>
    </>
  );
};

export default Home;
