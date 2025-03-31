"use client";

import { AskQuestionSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const QuestionForm = () => {
  const form = useForm({
    resolver: zodResolver(AskQuestionSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: [],
    },
  });

  const handleCreateQuestion = () => {};

  return (
    <Form {...form}>
      <form
        className="flex w-full flex-col gap-10"
        onSubmit={form.handleSubmit(handleCreateQuestion)}
      >
        <form
          onSubmit={form.handleSubmit(handleCreateQuestion)}
          className="mt-10 space-y-6"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col ">
                <FormLabel className="paragraph-medium text-dark400_light800">
                  Question Title <span className="text-primary-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="paragraph-regular background-light700_dark300 light-border-2 text-dark300_light700 no-focus min-h-[56px]  border"
                  />
                </FormControl>
                <FormDescription className="body-regular mt-2.5 text-light-500">
                  Be specific and imagine you&apos;re asking a question to
                  anoher person.
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col ">
                <FormLabel className="paragraph-medium text-dark400_light800">
                  Detailed explanation of your problem
                  <span className="text-primary-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="paragraph-regular background-light700_dark300 light-border-2 text-dark300_light700 no-focus min-h-[56px]  border"
                  />
                </FormControl>
                <FormDescription className="body-regular mt-2.5 text-light-500">
                  Intruduce the note and expand on what you&apos;ve put in the
                  title
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col ">
                <FormLabel className="paragraph-medium text-dark400_light800">
                  Tags <span className="text-primary-500">*</span>
                </FormLabel>
                <FormControl>
                  <div>
                    <Input
                      {...field}
                      className="paragraph-regular background-light700_dark300 light-border-2 text-dark300_light700 no-focus min-h-[56px]  border"
                      placeholder="Add tags..."
                    />
                    Tags
                  </div>
                </FormControl>
                <FormDescription className="body-regular mt-2.5 text-light-500">
                  Add up to 3 tags to describe what your note is about. You need
                  to press enter to add a tag.
                </FormDescription>
              </FormItem>
            )}
          />

          <div className="mt-16 flex justify-end">
            <Button
              type="submit"
              className="primary-gradient w-fit !text-light-900"
            >
              Ask A Question
            </Button>
          </div>
        </form>
      </form>
    </Form>
  );
};

export default QuestionForm;
