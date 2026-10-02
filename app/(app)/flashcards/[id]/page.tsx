import FlashcardClient from "./FlashcardClient";

export async function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function FlashcardPage() {
  return <FlashcardClient />;
}
