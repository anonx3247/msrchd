import { readFile, stat } from "fs/promises";
import { Result, err, ok } from "../lib/error";
import path from "path";
import tar from "tar-stream";
import { buildImage } from "@app/lib/image";

const IDENTITY_FILES_COPY_PLACEHOLDER = "# IDENTITY_FILES_COPY_PLACEHOLDER";

export function getDockerfilePathForProfile(profile: string): string {
  return path.join(__dirname, "../../profiles", profile, "Dockerfile");
}

export async function dockerFile(dockerfilePath: string): Promise<string> {
  return await readFile(dockerfilePath, "utf8");
}

export async function dockerFileForIdentity(
  privateKeyPath: string,
  dfPath: string,
): Promise<Result<string>> {
  const publicKeyPath = privateKeyPath + ".pub";
  // check that both files exist
  const stats = await Promise.all([
    stat(privateKeyPath)
      .then(() => true)
      .catch(() => false),
    stat(publicKeyPath)
      .then(() => true)
      .catch(() => false),
  ]);

  if (stats.some((exists) => !exists)) {
    return err(
      "image_error",
      `Identity files not found at paths: ${privateKeyPath}, ${publicKeyPath}`,
    );
  }

  const privateKeyFilename = path.basename(privateKeyPath);
  const publicKeyFilename = path.basename(publicKeyPath);

  const copyCommand = `
COPY --chown=agent:agent ${privateKeyFilename} ${publicKeyFilename} /home/agent/.ssh/
RUN chmod 600 /home/agent/.ssh/${privateKeyFilename} && \\
    chmod 644 /home/agent/.ssh/${publicKeyFilename}

RUN ssh-keyscan github.com >> /home/agent/.ssh/known_hosts


RUN echo "Host github.com" >> /home/agent/.ssh/config && \\
    echo "    HostName github.com" >> /home/agent/.ssh/config && \\
    echo "    User git" >> /home/agent/.ssh/config && \\
    echo "    IdentityFile /home/agent/.ssh/${privateKeyFilename}" >> /home/agent/.ssh/config && \\
    echo "    IdentitiesOnly yes" >> /home/agent/.ssh/config
`;

  const df = await dockerFile(dfPath);

  if (!df.includes(IDENTITY_FILES_COPY_PLACEHOLDER)) {
    return err(
      "image_error",
      `Dockerfile is missing identity files placeholder.`,
    );
  }

  const dfId = df.replace(IDENTITY_FILES_COPY_PLACEHOLDER, copyCommand);

  return ok(dfId);
}

async function identityFilePacker(
  pack: tar.Pack,
  privateKeyPath: string,
): Promise<void> {
  const publicKeyPath = privateKeyPath + ".pub";

  const privateKeyFilename = path.basename(privateKeyPath);
  const publicKeyFilename = privateKeyFilename + ".pub";

  const privateKeyContent = await readFile(privateKeyPath);
  const publicKeyContent = await readFile(publicKeyPath);

  pack.entry({ name: privateKeyFilename }, privateKeyContent);
  pack.entry({ name: publicKeyFilename }, publicKeyContent);
}

export async function buildComputerImage(
  privateKeyPath: string | null,
  profile: string,
): Promise<Result<void>> {
  const dockerfilePath = getDockerfilePathForProfile(profile);
  const df = privateKeyPath
    ? await dockerFileForIdentity(privateKeyPath, dockerfilePath)
    : ok(await dockerFile(dockerfilePath));

  if (df.isErr()) {
    return df;
  }

  const imageName = `agent-computer:${profile}`;

  return buildImage(
    imageName,
    df.value,
    privateKeyPath
      ? (pack) => identityFilePacker(pack, privateKeyPath)
      : undefined,
  );
}
