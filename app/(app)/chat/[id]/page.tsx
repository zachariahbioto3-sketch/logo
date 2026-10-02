import ChatClient from "./ChatClient";

export async function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function ChatPage() {
  return <ChatClient />;
}
