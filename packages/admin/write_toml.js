const fs = require("fs");
fs.writeFileSync("netlify.toml", `[build]
  command = "echo skipping build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`);
