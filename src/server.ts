import { Hono } from "hono";
import sanitizeHtml from "sanitize-html";
import { marked } from "marked";
import fs from "fs";
import path from "path";
import { ExperimentResource } from "@app/resources/experiment";
import { MessageResource } from "@app/resources/messages";
import { PublicationResource } from "@app/resources/publication";
import { SolutionResource } from "@app/resources/solutions";
import {
  getAttachmentPath,
  getPublicationContent,
} from "@app/tools/publications";

const sanitizeText = (value: unknown): string => {
  const input =
    value === null || value === undefined
      ? ""
      : typeof value === "number"
        ? value.toLocaleString()
        : String(value);
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter: (text: string) =>
      text.replace(/"/g, "&quot;").replace(/'/g, "&#39;"),
  });
};

const sanitizeMarkdown = (value: unknown): string => {
  const input = value === null || value === undefined ? "" : String(value);
  try {
    const html = marked.parse(input, { async: false });
    return sanitizeHtml(html, {
      allowedTags: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "br",
        "hr",
        "ul",
        "ol",
        "li",
        "strong",
        "em",
        "code",
        "pre",
        "a",
        "blockquote",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
      ],
      allowedAttributes: {
        a: ["href"],
        code: ["class"],
        pre: ["class"],
      },
    });
  } catch (_err) {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }
};

const safeStatusClass = (status: string): string => {
  const statusClasses: Record<string, string> = {
    PUBLISHED: "status-published",
    SUBMITTED: "status-submitted",
    REJECTED: "status-rejected",
  };
  return statusClasses[status] || "status-unknown";
};

const baseTemplate = (title: string, content: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sanitizeText(title)} - msrchd</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>`;
};

export const createApp = () => {
  const app = new Hono();

  // Serve static files (CSS)
  app.get("/styles.css", (c) => {
    const cssPath = path.join(__dirname, "styles.css");
    const css = fs.readFileSync(cssPath, "utf-8");
    return c.text(css, 200, { "Content-Type": "text/css" });
  });

  // Home page - List all experiments
  app.get("/", async (c) => {
    const experiments = (await ExperimentResource.all()).sort(
      (a, b) => b.toJSON().created.getTime() - a.toJSON().created.getTime(),
    );

    // Calculate costs and publications for all experiments
    const experimentsWithMetadata = await Promise.all(
      experiments.map(async (exp) => {
        const cost = await MessageResource.totalCostForExperiment(exp);
        const formattedCost =
          cost < 0.01
            ? `$${cost.toFixed(6)}`
            : cost < 1
              ? `$${cost.toFixed(4)}`
              : `$${cost.toFixed(2)}`;

        const publications = await PublicationResource.listByExperiment(exp);
        const solutions = await SolutionResource.listByExperiment(exp);

        // Count votes per publication
        const votesByPublication = solutions.reduce(
          (acc, sol) => {
            const pubId = sol.toJSON().publication.id;
            acc[pubId] = (acc[pubId] || 0) + 1;
            return acc;
          },
          {} as Record<number, number>,
        );

        const topVoted = Object.entries(votesByPublication).sort(
          (a, b) => b[1] - a[1],
        )[0];

        return {
          exp,
          cost: formattedCost,
          publicationsCount: publications.length,
          votesCount: solutions.length,
          topVoted: topVoted ? `${topVoted[1]} votes` : "No votes",
        };
      }),
    );

    const content = `
      <h1>Experiments</h1>
      ${experimentsWithMetadata
        .map(({ exp, cost, publicationsCount, votesCount, topVoted }) => {
          const data = exp.toJSON();
          return `
          <div class="list-item">
            <div class="list-item-title">
              <a href="/experiments/${sanitizeText(data.name)}">${sanitizeText(data.name)}</a>
            </div>
            <div class="list-item-meta">
              Model: <strong>${sanitizeText(data.model)}</strong> |
              Agents: <strong>${sanitizeText(data.agent_count)}</strong> |
              Cost: <strong>${sanitizeText(cost)}</strong> |
              Publications: <strong>${publicationsCount}</strong> |
              Votes: <strong>${votesCount}</strong> |
              Top: <strong>${sanitizeText(topVoted)}</strong>
            </div>
          </div>
        `;
        })
        .join("")}
    `;

    return c.html(baseTemplate("Experiments", content));
  });

  // Experiment overview
  app.get("/experiments/:name", async (c) => {
    const name = c.req.param("name");

    const experimentRes = await ExperimentResource.findByName(name);
    if (experimentRes.isErr()) {
      return c.notFound();
    }

    const experiment = experimentRes.value;
    const expData = experiment.toJSON();

    const publications = await PublicationResource.listByExperiment(experiment);
    const solutions = await SolutionResource.listByExperiment(experiment);

    // Count votes per publication
    const votesByPublication = solutions.reduce(
      (acc, sol) => {
        const pubId = sol.toJSON().publication.id;
        acc[pubId] = (acc[pubId] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    const sortedVotes = Object.entries(votesByPublication)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const votesContent =
      sortedVotes.length > 0
        ? sortedVotes
            .map(([pubId, votes]) => {
              const pub = publications.find(
                (p) => p.toJSON().id === parseInt(pubId),
              );
              if (!pub) return "";
              const pubData = pub.toJSON();
              return `
            <div class="vote-item">
              <a href="/experiments/${sanitizeText(name)}/publications/${sanitizeText(pubData.reference)}">
                ${sanitizeText(pubData.title)}
              </a>
              - <strong>${votes} vote${votes > 1 ? "s" : ""}</strong>
            </div>
          `;
            })
            .join("")
        : "<div class='detail-value'>No votes yet</div>";

    const publicationsContent = publications
      .sort(
        (a, b) =>
          b.toJSON().created.getTime() - a.toJSON().created.getTime(),
      )
      .map((pub) => {
        const pubData = pub.toJSON();
        const votes = votesByPublication[pubData.id] || 0;
        return `
        <div class="list-item">
          <div class="list-item-title">
            <a href="/experiments/${sanitizeText(name)}/publications/${sanitizeText(pubData.reference)}">
              ${sanitizeText(pubData.title)}
            </a>
          </div>
          <div class="list-item-meta">
            Status: <span class="${safeStatusClass(pubData.status)}">${sanitizeText(pubData.status)}</span> |
            Author: <strong>Agent ${sanitizeText(pubData.author)}</strong> |
            Reference: <strong>${sanitizeText(pubData.reference)}</strong> |
            Votes: <strong>${votes}</strong> |
            Created: ${sanitizeText(pubData.created.toLocaleString())}
          </div>
        </div>
      `;
      })
      .join("");

    const content = `
      <a href="/" class="back-link">← Back to Experiments</a>
      <h1>${sanitizeText(expData.name)}</h1>

      <div class="detail-section">
        <div class="detail-label">Model</div>
        <div class="detail-value">${sanitizeText(expData.model)}</div>

        <div class="detail-label">Agents</div>
        <div class="detail-value">${sanitizeText(expData.agent_count)}</div>

        <div class="detail-label">Problem</div>
        <div class="detail-value markdown-content">${sanitizeMarkdown(expData.problem)}</div>
      </div>

      <h2>Solution Votes</h2>
      <div class="detail-section">
        ${votesContent}
      </div>

      <h2>Publications (${publications.length})</h2>
      ${publicationsContent}
    `;

    return c.html(
      baseTemplate(`${sanitizeText(expData.name)} - Experiment`, content),
    );
  });

  // Publication detail
  app.get("/experiments/:name/publications/:ref", async (c) => {
    const experimentName = c.req.param("name");
    const reference = c.req.param("ref");

    const experimentRes = await ExperimentResource.findByName(experimentName);
    if (experimentRes.isErr()) {
      return c.notFound();
    }

    const experiment = experimentRes.value;
    const publication = await PublicationResource.findByReference(
      experiment,
      reference,
    );
    if (!publication) {
      return c.notFound();
    }

    const pubData = publication.toJSON();
    const expData = experiment.toJSON();

    const content = getPublicationContent(reference);
    if (!content) {
      return c.text("Publication content not found", 404);
    }

    // Get attachments
    const attachmentsDir = getAttachmentPath(expData.id, reference);
    const attachments = fs.existsSync(attachmentsDir)
      ? fs.readdirSync(attachmentsDir)
      : [];

    // Get votes
    const solutions = await SolutionResource.listByExperiment(experiment);
    const votes = solutions.filter(
      (sol) => sol.toJSON().publication.id === pubData.id,
    ).length;

    const attachmentsContent =
      attachments.length > 0
        ? `
        <div class="detail-label">Attachments</div>
        <div class="attachment-list">
          ${attachments
            .map(
              (att) => `
            <div class="attachment-item">
              <a href="/experiments/${sanitizeText(experimentName)}/publications/${sanitizeText(reference)}/attachments/${sanitizeText(att)}">
                📎 ${sanitizeText(att)}
              </a>
            </div>
          `,
            )
            .join("")}
        </div>
      `
        : "";

    const reviewsContent =
      pubData.status === "PUBLISHED" && pubData.reviews.length > 0
        ? `
      <h2>Reviews</h2>
      <div class="detail-section">
        ${pubData.reviews
          .map(
            (review) => `
          <div class="detail-label">Agent ${sanitizeText(review.author)} - ${sanitizeText(review.grade ?? "PENDING")}</div>
          <div class="detail-value markdown-content">${sanitizeMarkdown(review.content ?? "No content")}</div>
        `,
          )
          .join("<hr style='border-color: #333; margin: 15px 0;'>")}
      </div>
    `
        : "";

    const pageContent = `
      <a href="/experiments/${sanitizeText(experimentName)}" class="back-link">← Back to ${sanitizeText(experimentName)}</a>
      <h1>${sanitizeText(pubData.title)}</h1>

      <div class="detail-section">
        <div class="detail-label">Reference</div>
        <div class="detail-value">${sanitizeText(pubData.reference)}</div>

        <div class="detail-label">Author</div>
        <div class="detail-value">Agent ${sanitizeText(pubData.author)}</div>

        <div class="detail-label">Status</div>
        <div class="detail-value">
          <span class="${safeStatusClass(pubData.status)}">${sanitizeText(pubData.status)}</span>
        </div>

        <div class="detail-label">Votes</div>
        <div class="detail-value">${votes}</div>

        <div class="detail-label">Created</div>
        <div class="detail-value">${sanitizeText(pubData.created.toLocaleString())}</div>

        ${attachmentsContent}
      </div>

      <h2>Content</h2>
      <div class="detail-section">
        <div class="markdown-content">${sanitizeMarkdown(content)}</div>
      </div>

      ${reviewsContent}
    `;

    return c.html(
      baseTemplate(
        `${sanitizeText(pubData.title)} - Publication`,
        pageContent,
      ),
    );
  });

  // Publication attachment download
  app.get(
    "/experiments/:name/publications/:ref/attachments/:attachment",
    async (c) => {
      const experimentName = c.req.param("name");
      const reference = c.req.param("ref");
      const attachment = c.req.param("attachment");

      const experimentRes = await ExperimentResource.findByName(experimentName);
      if (experimentRes.isErr()) {
        return c.notFound();
      }

      const experiment = experimentRes.value;
      const publication = await PublicationResource.findByReference(
        experiment,
        reference,
      );
      if (!publication) {
        return c.notFound();
      }

      const localPath = getAttachmentPath(
        experiment.toJSON().id,
        reference,
        attachment,
      );

      if (!fs.existsSync(localPath)) {
        return c.notFound();
      }

      const fileContent = fs.readFileSync(localPath);
      const filename = `${experimentName}_${reference}_${attachment}`;

      return c.body(fileContent, 200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      });
    },
  );

  return app;
};

export default createApp();
