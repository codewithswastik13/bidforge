// k6 load test for the bid endpoint.
//
//   k6 run -e TARGET_RPS=100  k6/stress_test.js
//   k6 run -e TARGET_RPS=500  k6/stress_test.js
//   ... step up toward 5000
//
// Get a token first (backend running, seed script run):
//
//   TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
//     -H 'Content-Type: application/json' \
//     -d '{"username":"alice","password":"alice1234"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
//
//   AUCTION_ID=<uuid from GET /api/v1/auctions>
//   k6 run -e TARGET_RPS=200 -e TOKEN=$TOKEN -e AUCTION_ID=$AUCTION_ID k6/stress_test.js
//
// After the run, prove correctness independently:
//   cd backend && python -m scripts.verify_auction $AUCTION_ID
import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";
const TARGET_RPS = Number(__ENV.TARGET_RPS || 100);
const TOKEN = __ENV.TOKEN;
const AUCTION_ID = __ENV.AUCTION_ID;
const DURATION = __ENV.DURATION || "30s";

export const options = {
  scenarios: {
    bid_flood: {
      executor: "constant-arrival-rate",
      rate: TARGET_RPS,
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: Math.max(50, Math.ceil(TARGET_RPS / 4)),
      maxVUs: Math.max(200, TARGET_RPS * 2),
    },
  },
  thresholds: {
    // Rejections (409) are correct behaviour under contention, so only
    // 5xx counts as failure here.
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function () {
  if (!TOKEN || !AUCTION_ID) {
    throw new Error("Set -e TOKEN=<jwt> and -e AUCTION_ID=<uuid>. See the header comment.");
  }

  // CASE A (implemented): random increasing amounts. Most land above the
  // current price, some are stale by the time they arrive -- that mix is
  // what produces real lock contention.
  //
  // Other cases from the framework doc, run them by editing this line:
  //   B) always identical amount        -> at most one accept per price
  //   C) strictly increasing per VU     -> version should climb 1..N
  //   D) amounts far below current      -> should be 100% BID_TOO_LOW
  //   E) reuse one idempotency key      -> exactly one bid row created
  const amount = (1000 + Math.floor(Math.random() * 100000)).toFixed(2);

  const res = http.post(
    `${BASE_URL}/api/v1/auctions/${AUCTION_ID}/bids`,
    JSON.stringify({ amount }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
        "X-Idempotency-Key": uuid(),
      },
    },
  );

  check(res, {
    "no server error": (r) => r.status < 500,
    "accepted or cleanly rejected": (r) => r.status === 200 || r.status === 409,
  });
}
