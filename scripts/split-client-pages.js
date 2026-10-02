const fs = require('fs');

// 1. chat/[id]
const chatPage = 'app/(app)/chat/[id]/page.tsx';
const chatClient = 'app/(app)/chat/[id]/ChatClient.tsx';
if (fs.existsSync(chatPage)) {
  fs.copyFileSync(chatPage, chatClient);
  fs.writeFileSync(chatPage, `import ChatClient from "./ChatClient";

export async function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function ChatPage() {
  return <ChatClient />;
}
`);
}

// 2. flashcards/[id]
const fcPage = 'app/(app)/flashcards/[id]/page.tsx';
const fcClient = 'app/(app)/flashcards/[id]/FlashcardClient.tsx';
if (fs.existsSync(fcPage)) {
  fs.copyFileSync(fcPage, fcClient);
  fs.writeFileSync(fcPage, `import FlashcardClient from "./FlashcardClient";

export async function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function FlashcardPage() {
  return <FlashcardClient />;
}
`);
}

// 3. study-groups/[id]
const sgPage = 'app/(app)/study-groups/[id]/page.tsx';
const sgClient = 'app/(app)/study-groups/[id]/StudyGroupClient.tsx';
if (fs.existsSync(sgPage)) {
  fs.copyFileSync(sgPage, sgClient);
  fs.writeFileSync(sgPage, `import StudyGroupClient from "./StudyGroupClient";

export async function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function StudyGroupPage() {
  return <StudyGroupClient />;
}
`);
}

console.log('Successfully created client components and server wrapper pages!');
