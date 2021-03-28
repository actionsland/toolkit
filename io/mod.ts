import { fs, path, pipe, TE } from "./deps.ts";

export type CopyOptions = {
  force?: boolean;
};

/**
 * Creates a directory recursively, like `mkdir -p`.
 * Requires `--allow-read` and `--allow-write` flag.
 */
export async function mkdir(dir: string): Promise<void> {
  await pipe(dir, mkdirTE, orElseThrow)();
}

/**
 * Creates a directory recursively, like `mkdir -p`.
 * Requires `--allow-read` and `--allow-write` flag.
 */
export function mkdirTE(dir: string): TE.TaskEither<Error, void> {
  return pipe(() => fs.ensureDir(dir), TE.fromFailableTask(toError));
}

/**
 * Copies a file or directory.
 * Requires `--allow-read` and `--allow-write` flag.
 */
export async function cp(
  source: string,
  dest: string,
  options: CopyOptions = {},
): Promise<void> {
  await pipe(options, cpTE(source)(dest), orElseThrow)();
}

/**
 * Copies a file or directory.
 * Requires `--allow-read` and `--allow-write` flag.
 */
export function cpTE(source: string) {
  return (dest: string) =>
    (options: CopyOptions) =>
      pipe(
        pipe(dest, modifyDestPath(source)),
        TE.chain((actualDest) =>
          pipe(
            () => fs.copy(source, actualDest, { overwrite: options.force }),
            TE.fromFailableTask(toError),
          )
        ),
      );
}

function toError(e: unknown): Error {
  return e as Error;
}

function orElseThrow<R>(e: TE.TaskEither<Error, R>): TE.TaskEither<Error, R> {
  return pipe(
    e,
    TE.orElse((err) => {
      throw err;
    }),
  );
}

function stat(path: string): TE.TaskEither<Error, Deno.FileInfo> {
  return pipe(
    () => Deno.stat(path),
    TE.fromFailableTask(toError),
  );
}

function exists(path: string): TE.TaskEither<Error, boolean> {
  return pipe(
    () => fs.exists(path),
    TE.fromFailableTask(toError),
  );
}

function modifyDestPath(source: string) {
  return (dest: string) =>
    pipe(
      pipe(dest, exists),
      TE.chain((destExists) =>
        destExists
          ? pipe(
            pipe(dest, stat),
            TE.chain((destStat) =>
              destStat.isDirectory
                ? TE.right(path.join(dest, path.basename(source)))
                : TE.right(dest)
            ),
          )
          : TE.right(dest)
      ),
    );
}
