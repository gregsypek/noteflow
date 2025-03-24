import { auth } from "@/auth";

const Home = async () => {
  const session = await auth();
  console.log("🚀 ~ Home ~ session:", session);
  return (
    <>
      <div className="text-3xl text-red-500"> Welcome to my application</div>
    </>
  );
};

export default Home;
