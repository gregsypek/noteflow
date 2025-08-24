const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  COMUNITY: "/community",
  TAGS: "/tags",
  COLLECTION: "/collection",
  JOBS: "/jobs",
  PROFILE: (id: string) => `/profile/${id}`,
  QUESTION: (id: string) => `/questions/${id}`,
  TAG: (id: string) => `/tags/${id}`,
  ASK_QUESTION: "/ask-question",
  SIGN_IN_WITH_OAUTH: `signin-with-oauth`,
};

export default ROUTES;
