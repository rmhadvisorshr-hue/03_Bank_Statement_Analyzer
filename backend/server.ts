import { createApiApp } from "./createApp";

const PORT = Number(process.env.PORT) || 8099;

createApiApp().listen(PORT, "0.0.0.0", () => {
  console.log(`[bank-statement-analyzer backend] listening on ${PORT}`);
});
