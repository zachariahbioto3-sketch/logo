import StudyGroupClient from "./StudyGroupClient";

export async function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function StudyGroupPage() {
  return <StudyGroupClient />;
}
