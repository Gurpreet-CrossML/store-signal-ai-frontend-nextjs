import FacebookMessages from "@/clients/facebook-messages";

export const metadata = {
  title: "Facebook Messages",
};

export default function Page() {
  return (
    <>
      <FacebookMessages />
    </>
  );
}
