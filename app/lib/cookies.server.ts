import { createCookie } from "@remix-run/node"; 

export const userSession = createCookie("user-session", {
  maxAge: 60 * 60, // 1 hour
  httpOnly: true,
  sameSite: "lax",
  secrets: ["s3cr3t"], // replace with your secret
});

export const visitorDataCookie = createCookie("visitor-data", {
  httpOnly: true,
  sameSite: "lax",
})