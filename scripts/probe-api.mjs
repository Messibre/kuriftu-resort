import fs from "node:fs";

const base = "https://resort-forecast-api.onrender.com";
const start = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
const end = new Date().toISOString().slice(0, 10);

function fill(name) {
  const defaults = {
    start_date: start,
    end_date: end,
    year: "2026",
    limit: "10",
    offset: "0",
    format: "csv",
  };
  return defaults[name] ?? "1";
}

function replacePath(path) {
  return path
    .replace("{staff_id}", "1")
    .replace("{promotion_id}", "1")
    .replace("{notification_id}", "1");
}

async function main() {
  const openapiRes = await fetch(`${base}/openapi.json`);
  if (!openapiRes.ok) {
    throw new Error(`openapi request failed with status ${openapiRes.status}`);
  }

  const spec = await openapiRes.json();
  const results = [];

  for (const [rawPath, methods] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(methods ?? {})) {
      const upperMethod = method.toUpperCase();
      const path = replacePath(rawPath);

      const requiredQueryParams = (op.parameters ?? []).filter(
        (param) => param.in === "query" && param.required,
      );

      const query = new URLSearchParams();
      for (const param of requiredQueryParams) {
        query.set(param.name, fill(param.name));
      }

      const url = `${base}${path}${query.toString() ? `?${query.toString()}` : ""}`;
      const init = { method: upperMethod, headers: {} };

      if (["POST", "PUT", "PATCH"].includes(upperMethod)) {
        init.headers["content-type"] = "application/json";
        init.body = "{}";
      }

      let status = -1;
      let note = "ok";

      try {
        const response = await fetch(url, init);
        status = response.status;
      } catch (error) {
        note = String(error?.message ?? error);
      }

      results.push({
        method: upperMethod,
        path: rawPath,
        probed_url: url,
        status,
        note,
      });
    }
  }

  const statusBuckets = {};
  for (const item of results) {
    statusBuckets[item.status] = (statusBuckets[item.status] ?? 0) + 1;
  }

  const report = {
    base_url: base,
    checked_at_utc: new Date().toISOString(),
    endpoint_count: results.length,
    status_buckets: statusBuckets,
    results,
  };

  fs.writeFileSync(
    "g:/codes/projects/resort-ai/api-endpoint-check.json",
    JSON.stringify(report, null, 2),
    "utf8",
  );

  console.log(
    "report written: g:/codes/projects/resort-ai/api-endpoint-check.json",
  );
  console.log("endpoint_count:", results.length);
  console.log("status_buckets:", statusBuckets);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
