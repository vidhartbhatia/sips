"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// Cookieless visit counts (Vercel Web Analytics). Only public pages are counted: the authors'
// own admin and login visits would drown out real readers on a two-person site.
const PRIVATE = /^\/(admin|login|auth|fixtures)(\/|$)/;

function dropPrivatePages(event: BeforeSendEvent): BeforeSendEvent | null {
  return PRIVATE.test(new URL(event.url).pathname) ? null : event;
}

export function SiteAnalytics() {
  return <Analytics beforeSend={dropPrivatePages} />;
}
