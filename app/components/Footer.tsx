import Image from "next/image";
import Link from "next/link";
import { EVENT, SPONSORS } from "../data/event";

const COLUMNS = [
  {
    title: "Tournament",
    links: [
      { label: "Format", href: "/#format" },
      { label: "Points", href: "/#points" },
      { label: "Rules", href: "/#rules" },
    ],
  },
  {
    title: "Teams",
    links: [
      { label: "Register your squad", href: "/register" },
      { label: "How to register", href: "/#how-to-register" },
    ],
  },
  {
    title: "College",
    links: [
      { label: EVENT.college, href: EVENT.collegeUrl },
      { label: EVENT.contactEmail, href: `mailto:${EVENT.contactEmail}` },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="px-4">
      <div className="frame px-4 pb-10 pt-16 sm:px-8">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/gss-it-club-logo.png" alt="" width={64} height={64} className="size-7 rounded-full" />
              <span className="text-xl font-semibold tracking-tight text-neutral-800">{EVENT.organiser}</span>
            </Link>
            <p className="mt-4 text-base leading-relaxed text-neutral-500">
              {EVENT.name}, a Free Fire squad tournament for Grade 11 and 12
              students, organised by the {EVENT.organiser} at {EVENT.college}.
            </p>
            <p className="mt-4 text-sm text-neutral-500">
              Event managed by <span className="font-medium text-neutral-800">{EVENT.managedBy}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-16">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-medium text-neutral-500">{col.title}</h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => {
                    const external = link.href.startsWith("http");
                    return (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          className="break-all text-[15px] text-neutral-700 transition-colors hover:text-neutral-900"
                        >
                          {link.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {EVENT.organiser} · Title sponsor {SPONSORS.title.short} · Powered by{" "}
            {SPONSORS.poweredBy.short}
          </p>
          <a
            href="https://manishtamang.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-fit items-center gap-2"
          >
            <Image
              src="/golecodes.png"
              alt="Manish Tamang"
              width={160}
              height={160}
              className="size-6 rounded-full ring-1 ring-black/5"
            />
            <span>
              Made with love by{" "}
              <span className="font-medium text-neutral-800 group-hover:underline group-hover:underline-offset-4">
                @golecodes
              </span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
