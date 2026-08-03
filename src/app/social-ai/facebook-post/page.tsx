import FacebookPosts from "@/clients/facebook-post";

export const metadata = {
  title: "Facebook Posts",
};

export default function Page() {
  return (
    <>
      <FacebookPosts />
    </>
  );
}
