import InstagramPosts from "@/clients/instagram-post";

export const metadata = {
  title: "Instagram Posts",
};

export default function Page() {
  return (
    <>
      <InstagramPosts />
    </>
  );
}
