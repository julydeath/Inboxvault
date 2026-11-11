import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "./styles.css";
import "./landing.css";
import "./workspace.css";
import "./dialogs.css";
import "./responsive.css";
import "./readability.css";
export const metadata: Metadata = {
  title: {
    default: "InboxVault — Your inbox. Your files. Finally, apart.",
    template: "%s · InboxVault",
  },
  description:
    "Find your Gmail attachments in one thoughtfully organized library. Read-only access, searchable files, and a little more clarity.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
