"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import React, { use, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { toggleSaveQuestion } from "@/lib/actions/collection.action";

const SaveQuestion = ({
  questionId,
  hasSavedQuestionPromise,
}: {
  questionId: string;
  hasSavedQuestionPromise: Promise<ActionResponse<{ saved: boolean }>>;
}) => {
  const session = useSession();
  const userId = session?.data?.user?.id;

  const { data } = use(hasSavedQuestionPromise);
  // We use use to unwrap the promise and get the value directly

  const { saved: hasSaved } = data || {};

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (isLoading) return;
    if (!userId)
      return toast({
        title: "You must be logged in to save a question",
        variant: "destructive",
      });
    setIsLoading(true);

    try {
      const { success, data, error } = await toggleSaveQuestion({ questionId });

      if (!success)
        throw new Error(error?.message || "Failed to save question");

      toast({
        title: `Question  ${data?.saved ? "saved" : "unsaved"} successfully`,
      });
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description:
          error instanceof Error
            ? error.message
            : "Your question was not saved. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Image
      src={hasSaved ? "/icons/star-filled.svg" : "/icons/star-red.svg"}
      width={18}
      height={18}
      alt="save"
      className={`cursor-pointer ${isLoading && "opacity-50"}`}
      aria-label="save question"
      onClick={handleSave}
    />
  );
};

export default SaveQuestion;
