import { expect, test } from "vitest";
import {
  ABSOLUTE_TIMEOUT_MS,
  IDLE_TIMEOUT_MS,
  getExpiry,
} from "./sessionTimeout";

const T = 1_700_000_000_000;

test("valid session", () => {
  expect(getExpiry(T + 1000, T, T)).toBeNull();
});

test("idle after 30 minutes without activity", () => {
  expect(getExpiry(T + IDLE_TIMEOUT_MS + 1, T, T)).toBe("idle");
  expect(getExpiry(T + IDLE_TIMEOUT_MS - 1, T, T)).toBeNull();
});

test("activity keeps the session alive until the 8 hour cap", () => {
  const last = T + ABSOLUTE_TIMEOUT_MS - 1000;
  expect(getExpiry(last + 1000, T, last)).toBeNull();
  expect(getExpiry(T + ABSOLUTE_TIMEOUT_MS + 1, T, T + ABSOLUTE_TIMEOUT_MS)).toBe("absolute");
});

test("missing timestamps are treated as expired", () => {
  expect(getExpiry(T, null, null)).toBe("absolute");
});
