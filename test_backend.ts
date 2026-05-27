import http from "http";

const checkHealth = () => {
  const req = http.get("http://localhost:3000/api/health", (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log("HEALTH CHECK SUCCESSFUL:", res.statusCode, data);
      process.exit(0);
    });
  });

  req.on("error", (err) => {
    console.error("HEALTH CHECK FAILED:", err.message);
    process.exit(1);
  });
};

checkHealth();
