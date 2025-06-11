import  { Metadata } from "next";
import "./globals.css";

export const metadata = {
  title: "CodeMate",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body
      >
        {children}
      </body>
    </html>
  );
}
