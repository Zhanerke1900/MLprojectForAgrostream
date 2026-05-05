import "dotenv/config";
import express, { type Express, type Request, type Response } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { analyzeAgronomicYield } from "../agronomicYieldForecast";
import { ensureDatabaseReady } from "../db";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { validateRuntimeEnv } from "./env";
import { registerOAuthRoutes } from "./oauth";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function getLocalUrlPort(urlValue: string | undefined): number | null {
  if (!urlValue) return null;

  try {
    const parsed = new URL(urlValue);
    if (!["localhost", "127.0.0.1"].includes(parsed.hostname)) return null;
    if (parsed.port) return parseInt(parsed.port, 10);
    return parsed.protocol === "https:" ? 443 : 80;
  } catch {
    return null;
  }
}

async function startServer() {
  validateRuntimeEnv();
  await ensureDatabaseReady();

  const app: Express = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path, type }) {
        console.error(`[tRPC] ${type} ${path ?? "<unknown>"} failed:`, error);
      },
    })
  );

  app.post("/api/agronomic-predict", async (req: Request, res: Response) => {
    try {
      const result = await analyzeAgronomicYield({
        crop: String(req.body.crop ?? ""),
        variety: String(req.body.variety ?? ""),
        predecessor: String(req.body.predecessor ?? ""),
        area: String(req.body.area ?? ""),
        sowingDate: String(req.body.sowingDate ?? ""),
        harvestDate: String(req.body.harvestDate ?? ""),
        set: String(req.body.set ?? ""),
        precipitation: String(req.body.precipitation ?? ""),
        humus: String(req.body.humus ?? ""),
        language: req.body.language === "en" ? "en" : "ru",
      });

      return res.json(result);
    } catch (error: unknown) {
      console.error("Agronomic prediction error:", error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Agronomic prediction failed",
      });
    }
  });

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    const appUrl = `http://localhost:${port}/`;
    console.log(`Server running at ${appUrl}`);
    console.log(`Open this URL in your browser: ${appUrl}`);

    if (process.env.NODE_ENV === "development") {
      const oAuthServerPort = getLocalUrlPort(process.env.OAUTH_SERVER_URL);
      const oAuthPortalPort = getLocalUrlPort(
        process.env.VITE_OAUTH_PORTAL_URL
      );

      if (oAuthServerPort && oAuthServerPort !== port) {
        console.warn(
          `[Dev warning] OAUTH_SERVER_URL uses port ${oAuthServerPort}, but the app is running on ${port}.`
        );
      }

      if (oAuthPortalPort && oAuthPortalPort !== port) {
        console.warn(
          `[Dev warning] VITE_OAUTH_PORTAL_URL uses port ${oAuthPortalPort}, but the app is running on ${port}.`
        );
      }
    }
  });
}

startServer().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
