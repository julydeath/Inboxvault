"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Brand } from "./brand";
import { GmailMark, Icon } from "./icon";
import { FileBadge } from "./file-badge";
import { demoFiles } from "@/lib/demo";
import { formatBytes } from "@/lib/format";

function ExtractionStory() {
  const section = useRef<HTMLElement>(null);
  const [act, setAct] = useState(0);
  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = node.getBoundingClientRect();
      const progress = reduced.matches
        ? 1
        : Math.max(
            0,
            Math.min(
              1,
              -box.top / Math.max(1, box.height - window.innerHeight),
            ),
          );
      node.style.setProperty("--spread", String(progress));
      node.style.setProperty(
        "--settle",
        String(Math.max(0, Math.min(1, (progress - 0.7) / 0.3))),
      );
      setAct(progress < 0.3 ? 0 : progress < 0.7 ? 1 : 2);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, []);

  return (
    <section
      className="product-story"
      ref={section}
      id="product"
      aria-label="How email attachments become a file library"
    >
      <div className="story-sticky">
        <div className="hero-copy">
          <div className="announcement">
            <span className="status-dot" /> A little order for your inbox{" "}
            <span className="announcement-arrow">↗</span>
          </div>
          <h1>
            Your inbox.
            <br />
            Your files.
            <br />
            <span>Finally, apart.</span>
          </h1>
          <p>
            All those files, buried in all those emails.
            <br className="desktop-break" /> Bring your Gmail attachments into
            one
            <br className="desktop-break" /> beautifully organized space.
          </p>
          <div className="hero-actions">
            <Link className="button button-lilac" href="/connect">
              <GmailMark size={19} /> Connect Gmail{" "}
              <Icon name="arrow" size={18} />
            </Link>
            <Link className="text-link" href="/demo">
              Take a look inside <Icon name="diagonal" size={16} />
            </Link>
          </div>
          <div className="hero-assurance">
            <Icon name="shield" size={15} /> Read-only access. Your emails stay
            yours.
          </div>
        </div>

        <div
          className={`extraction-scene scene-act-${act}`}
          role="img"
          aria-label="Illustration: three attachments separate from an email and organize into a vault"
        >
          <div className="scene-grid" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="scene-coordinate coordinate-top">
            INBOX → POSSIBILITY
          </div>
          <div className="scene-coordinate coordinate-bottom">
            LESS NOISE. MORE CLARITY.
          </div>
          <div className="source-label">
            <GmailMark size={16} /> Your Gmail <span className="tiny-dot" />
          </div>
          <div className="email-object">
            <div className="email-toolbar">
              <div className="window-dots">
                <i />
                <i />
                <i />
              </div>
              <span>One email. So much inside.</span>
              <Icon name="mail" size={14} />
            </div>
            <div className="email-body">
              <div className="email-person">
                <span className="person-avatar">J</span>
                <div>
                  <strong>Jamie at Studio North</strong>
                  <small>to you · Nov 8</small>
                </div>
                <span className="email-time">10:24</span>
              </div>
              <h3>Everything for our next chapter</h3>
              <p>
                Hey Alex,
                <br />A few things for the project. All yours.
              </p>
              <div className="email-attachment-count">
                <Icon name="link" size={13} /> 3 attachments
              </div>
            </div>
          </div>
          <div className="floating-file floating-pdf">
            <FileBadge mime="application/pdf" />
            <div className="mini-document">
              <span />
              <span />
              <span />
              <span />
            </div>
            <strong>Brand guidelines.pdf</strong>
            <span>PDF document · 2.4 MB</span>
            <div className="file-extracted">
              <Icon name="check" size={11} /> Found in your inbox
            </div>
          </div>
          <div className="floating-file floating-image">
            <div className="abstract-photo">
              <div className="photo-sun" />
              <div className="photo-ridge" />
              <span>
                STUDIO
                <br />
                NORTH
              </span>
            </div>
            <strong>Autumn collection.jpg</strong>
            <span>Image · 3.2 MB</span>
          </div>
          <div className="floating-file floating-doc">
            <FileBadge mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
            <div>
              <strong>Project proposal.docx</strong>
              <span>Document · 186 KB</span>
            </div>
            <Icon name="check" size={15} />
          </div>
          <div className="vault-arrival" aria-hidden="true">
            <div className="arrival-header">
              <Icon name="folder" size={17} />
              <strong>Your attachment library</strong>
              <span>3 files</span>
            </div>
            {demoFiles.slice(0, 3).map((file) => (
              <div className="arrival-row" key={file.id}>
                <FileBadge mime={file.mimeType} small />
                <div>
                  <strong>{file.filename}</strong>
                  <span>{formatBytes(file.size)}</span>
                </div>
                <Icon name="check" size={14} />
              </div>
            ))}
            <div className="arrival-footer">
              <Icon name="shield" size={12} /> Organized here. Originals in
              Gmail.
            </div>
          </div>
          <div className="vault-target">
            <span className="vault-symbol">
              <Icon name="folder" size={20} />
            </span>
            <div>
              <strong>A place for every file.</strong>
              <span>Your attachment library</span>
            </div>
            <span className="vault-check">
              <Icon name="check" size={13} />
            </span>
          </div>
          <span className="illustration-label">Illustrative example</span>
        </div>

        <div className="story-bottom">
          <div className="story-steps">
            {[
              "Connect your inbox",
              "Find your attachments",
              "Make room for clarity",
            ].map((label, index) => (
              <div
                className={act === index ? "story-step active" : "story-step"}
                key={label}
              >
                <span>0{index + 1}</span>
                {label}
              </div>
            ))}
          </div>
          <span className="scroll-hint">
            SCROLL TO UNTANGLE <span>↓</span>
          </span>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <nav className="landing-nav" aria-label="Main navigation">
        <Brand dark />
        <div className="landing-links">
          <a href="#workflow">How it works</a>
          <a href="#library">Your files, better</a>
          <a href="#privacy">Privacy</a>
        </div>
        <Link className="button button-dark-outline nav-demo" href="/demo">
          Explore the demo <Icon name="diagonal" size={15} />
        </Link>
      </nav>
      <main id="main">
        <ExtractionStory />
        <section className="provider-strip">
          <span>STARTING WITH YOUR EVERYDAY INBOX</span>
          <div>
            <GmailMark size={24} />
            <strong>Gmail</strong>
            <span className="provider-live">Available in private preview</span>
          </div>
          <div className="future-provider">
            <Icon name="mail" size={23} />
            <strong>Outlook</strong>
            <span>On the horizon</span>
          </div>
        </section>

        <section className="workflow-section section-width" id="workflow">
          <div className="section-intro">
            <span className="eyebrow light-eyebrow">
              FROM OVERWHELMED TO ORGANIZED
            </span>
            <h2>
              Your files deserve
              <br />a better address.
            </h2>
            <p>
              No more guessing which thread had that one file.
              <br />A simpler path from “where is it?” to “here it is.”
            </p>
          </div>
          <div className="workflow-columns">
            {[
              {
                number: "01",
                icon: "mail" as const,
                title: "One connection.",
                text: "Connect your Gmail with read-only access. Your emails stay right where they are.",
              },
              {
                number: "02",
                icon: "scan" as const,
                title: "Find what matters.",
                text: "Scan for attachments, or narrow things down to PDFs and specific Gmail searches.",
              },
              {
                number: "03",
                icon: "folder" as const,
                title: "A little more clarity.",
                text: "Search one library. Filter by file type. Download exactly what you came for.",
              },
            ].map((item) => (
              <article key={item.number}>
                <div className="workflow-number">
                  {item.number}
                  <Icon name={item.icon} size={25} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="library-section" id="library">
          <div className="section-width">
            <div className="library-heading">
              <div>
                <span className="eyebrow">THE GOOD KIND OF SEPARATION</span>
                <h2>
                  All the files.
                  <br />
                  None of the digging.
                </h2>
              </div>
              <p>
                Documents, images, audio, video, and the
                <br className="desktop-break" /> occasional mystery ZIP.
                Together at last.
              </p>
            </div>
            <div className="library-preview" inert aria-hidden="true">
              <div className="preview-sidebar">
                <Brand />
                <div className="preview-nav">
                  <Icon name="grid" size={17} /> Overview
                </div>
                <div className="preview-nav selected">
                  <Icon name="folder" size={17} /> Attachments <span>8</span>
                </div>
                <div className="preview-nav">
                  <Icon name="clock" size={17} /> Scan history
                </div>
                <div className="preview-sidebar-footer">
                  <span className="status-dot" /> Gmail connected
                </div>
              </div>
              <div className="preview-content">
                <div className="preview-topbar">
                  <span>YOUR WORKSPACE / ATTACHMENTS</span>
                  <span className="sample-label">SAMPLE LIBRARY</span>
                </div>
                <div className="preview-title">
                  <div>
                    <h3>A home for your files.</h3>
                    <p>Everything you need, without the email thread.</p>
                  </div>
                  <span className="button button-violet">
                    <Icon name="plus" size={15} /> New scan
                  </span>
                </div>
                <div className="preview-search">
                  <Icon name="search" size={17} /> Find that file...{" "}
                  <span>
                    All types <Icon name="down" size={13} />
                  </span>
                </div>
                <div className="preview-table-head">
                  <span>FILE NAME</span>
                  <span>SIZE</span>
                  <span />
                </div>
                {demoFiles.slice(0, 4).map((file) => (
                  <div className="preview-file-row" key={file.id}>
                    <div>
                      <FileBadge mime={file.mimeType} small />
                      <strong>{file.filename}</strong>
                    </div>
                    <span>{formatBytes(file.size)}</span>
                    <Icon name="download" size={17} />
                  </div>
                ))}
              </div>
            </div>
            <div className="library-caption">
              <span>Shown with fictional sample files.</span>
              <Link href="/demo">
                Go on. Try it yourself. <Icon name="arrow" size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="privacy-section section-width" id="privacy">
          <div className="privacy-visual">
            <div className="privacy-ring ring-outer" />
            <div className="privacy-ring ring-inner" />
            <div className="privacy-lock">
              <Icon name="shield" size={49} />
            </div>
            <span className="privacy-note">
              <span className="status-dot" /> YOUR INBOX STAYS YOURS
            </span>
          </div>
          <div className="privacy-copy">
            <span className="eyebrow light-eyebrow">
              A SMALLER DIGITAL FOOTPRINT
            </span>
            <h2>
              Useful access.
              <br />
              Thoughtful boundaries.
            </h2>
            <p>
              InboxVault indexes attachment details, not a second copy of your
              inbox. The files themselves stay in Gmail until you choose to
              download them.
            </p>
            <ul>
              <li>
                <Icon name="check" size={17} /> Read-only Gmail access
              </li>
              <li>
                <Icon name="check" size={17} /> Encrypted connection credentials
              </li>
              <li>
                <Icon name="check" size={17} /> A library scoped to your account
              </li>
            </ul>
            <span className="private-preview-note">
              Currently a private developer preview for approved test accounts.
            </span>
          </div>
        </section>

        <section className="faq-section section-width">
          <div>
            <span className="eyebrow light-eyebrow">A FEW THINGS TO KNOW</span>
            <h2>Glad you asked.</h2>
          </div>
          <div className="faq-list">
            <details>
              <summary>
                Does this change anything in my Gmail?
                <Icon name="plus" size={18} />
              </summary>
              <p>
                No. InboxVault uses read-only access to find attachments. It
                does not send, edit, or delete your emails.
              </p>
            </details>
            <details>
              <summary>
                What can I do in the demo?
                <Icon name="plus" size={18} />
              </summary>
              <p>
                Explore the workspace, search and filter fictional files,
                inspect file details, and try a simulated scan. No Gmail account
                is connected and no real email is accessed.
              </p>
            </details>
            <details>
              <summary>
                Is Outlook supported yet?
                <Icon name="plus" size={18} />
              </summary>
              <p>
                Gmail is our first integration. Outlook is planned for a future
                release.
              </p>
            </details>
            <details>
              <summary>
                Can I download any attachment?
                <Icon name="plus" size={18} />
              </summary>
              <p>
                Individual downloads up to 15 MB are supported in the private
                preview. Large-file delivery and bulk exports are planned for
                later.
              </p>
            </details>
          </div>
        </section>

        <section className="final-cta section-width">
          <span className="eyebrow light-eyebrow">
            A CLEARER SPACE STARTS HERE
          </span>
          <h2>
            Less inbox archaeology.
            <br />
            <span>More getting on with it.</span>
          </h2>
          <Link className="button button-lilac" href="/demo">
            Find your moment of clarity <Icon name="arrow" size={19} />
          </Link>
          <p>Explore the demo. No sign-in needed.</p>
        </section>
      </main>
      <footer className="landing-footer section-width">
        <Brand dark />
        <span>A little order. A lot of possibility.</span>
        <a href="#privacy">
          Privacy & access <Icon name="diagonal" size={13} />
        </a>
        <small>
          © {new Date().getFullYear()} InboxVault · Private preview
        </small>
      </footer>
    </div>
  );
}
