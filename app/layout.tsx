import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mobizinc Onboarding",
  description: "Interactive avatar-guided onboarding walkthrough",
};

// TalkingHead's own internal lip-sync module loader does a fully dynamic
// import() (path + lang, both runtime values) that Turbopack/webpack cannot
// statically resolve — it's a hard build error, not a warning. TalkingHead is
// designed to run as a native browser ES module (see its own examples/*.html),
// so instead of bundling it we serve it as a real static file and load it via
// a browser import map, exactly like the upstream examples do. See
// components/TalkingAvatar.tsx for the matching import(/* webpackIgnore */).
const IMPORT_MAP = {
  imports: {
    three: "/vendor/three/three.module.js",
    "three/addons/": "/vendor/three/addons/",
    talkinghead: "/vendor/talkinghead/talkinghead.mjs",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          type="importmap"
          // Must be present before any module script that resolves these
          // specifiers runs, hence rendered directly in <head>.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(IMPORT_MAP) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
