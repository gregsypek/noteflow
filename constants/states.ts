import ROUTES from "./routes";

export const DEFAULT_EMPTY = {
  title: "No Data Found",
  message:
    "No data found. Please try again later or contact support if the issue persists.",
  button: {
    text: "Add Data",
    href: ROUTES.HOME,
  },
};

export const DEFAULT_ERROR = {
  title: "Oops! Something Went Wrong",
  message: "An error occurred. Please try again later.",
  button: {
    text: "Try again",
    href: ROUTES.HOME,
  },
};

export const EMPTY_QUESTION = {
  title: "Ahh, No Questions Yet!",
  message:
    "The question board is empty. Try to add some questions to get started.",
  button: {
    text: "Ask a Question",
    href: ROUTES.ASK_QUESTION,
  },
};

export const EMPTY_TAGS = {
  title: "No Tags Found",
  message: "The tag cloud is empty. Add some keywords to make it rain.",
  button: {
    text: "Create Tag",
    href: ROUTES.TAGS,
  },
};
export const EMPTY_ANSWERS = {
  title: "No Answers Found",
  message: "The answer section is empty. Be the first to answer this question.",
  button: {
    text: "Answer",
    href: ROUTES.TAGS,
  },
};

export const EMPTY_COLLECTIONS = {
  title: "Collections Are Empty",
  message:
    "Looks like you haven’t created any collections yet. Start curating something extraordinary today",
};

export const EMPTY_USERS = {
  title: "No Users Found",
  message: "No users found. Looks like you're the first one here!",
};
