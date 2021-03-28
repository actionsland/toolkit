import { assertEquals, assertThrowsAsync, fs, os, path } from "./deps.ts";
import { cp, cpTE, mkdir } from "./mod.ts";

Deno.test("copies file with no flags", async () => {
  const root = await Deno.makeTempDir({ prefix: "cp_with_no_flags" });
  const sourceFile = path.join(root, "cp_source");
  const targetFile = path.join(root, "cp_target");

  await Deno.writeTextFile(sourceFile, "foo");

  await cp(sourceFile, targetFile);

  assertEquals(await Deno.readTextFile(targetFile), "foo");
});

Deno.test("copies file using force", async () => {
  const root = await Deno.makeTempDir({ prefix: "cp_with_force_flag" });
  const sourceFile = path.join(root, "cp_source");
  const targetFile = path.join(root, "cp_target");

  await Deno.writeTextFile(sourceFile, "foo");
  await Deno.writeTextFile(targetFile, "bar");

  await cp(sourceFile, targetFile, { force: true });

  assertEquals(await Deno.readTextFile(targetFile), "foo");
});

Deno.test("copies file into directory", async () => {
  const root = await Deno.makeTempDir({ prefix: "cp_into_dir" });
  const sourceFile = path.join(root, "cp_file");
  const targetDir = await Deno.makeTempDir({ prefix: "cp_into_dir_target" });
  const targetFile = path.join(targetDir, "cp_file");

  await Deno.writeTextFile(sourceFile, "foo");

  await cp(sourceFile, targetDir);

  assertEquals(await Deno.readTextFile(targetFile), "foo");
});

Deno.test("try copying to existing file without force (overwrite)", async () => {
  const root = await Deno.makeTempDir({ prefix: "cp_without_force_flag" });
  const sourceFile = path.join(root, "cp_source");
  const targetFile = path.join(root, "cp_target");

  await Deno.writeTextFile(sourceFile, "foo");
  await Deno.writeTextFile(targetFile, "bar");

  await assertThrowsAsync(() => cp(sourceFile, targetFile));
});

Deno.test("copies directory into existing destination with recursive flag", async () => {
  const root = await Deno.makeTempDir({ prefix: "cp_with_recursive_flag" });
  const sourceDir = path.join(root, "cp_source_dir");
  const sourceFile = path.join(sourceDir, "cp_file");
  const targetDir = path.join(root, "cp_target_dir");
  const targetFile = path.join(targetDir, "cp_file");

  await fs.ensureDir(sourceDir);
  await fs.ensureDir(targetDir);
  await Deno.writeTextFile(sourceFile, "foo");

  await cp(sourceDir, targetDir);

  assertEquals(await Deno.readTextFile(targetFile), "foo");
});

Deno.test("copies directory into non-existing destination", async () => {
  const root = await Deno.makeTempDir({
    prefix: "cp_to_non_existing_with_recursive_flag",
  });
  const sourceDir = path.join(root, "cp_source_dir");
  const sourceFile = path.join(sourceDir, "cp_file");
  const targetDir = path.join(root, "cp_target_dir");
  const targetFile = path.join(targetDir, "cp_file");

  await fs.ensureDir(sourceDir);
  await Deno.writeTextFile(sourceFile, "foo");

  await cp(sourceDir, targetDir);

  assertEquals(await Deno.readTextFile(targetFile), "foo");
});

Deno.test("copies directory without recursive", async () => {
  // this test differs from original implementation; original
  // requires a `recursive` option to be specified to copy a 
  // directory to other but we don't require it as it's the default
  // behavior of `fs.copy` (from Deno std fs module)

  const root = await Deno.makeTempDir({ prefix: "cp_without_recursive_flag" });
  const sourceDir = path.join(root, "cp_source_dir");
  const sourceFile = path.join(sourceDir, "cp_file");
  const targetDir = path.join(root, "cp_target_dir");
  const targetFile = path.join(targetDir, "cp_file");

  await fs.ensureDir(sourceDir);
  await Deno.writeTextFile(sourceFile, "foo");

  await cp(sourceDir, targetDir)

  assertEquals(await Deno.readTextFile(targetFile), "foo");
});

Deno.test("copies symlinks correctly", async () => {
  const root = await Deno.makeTempDir({ prefix: "cp_symlink" });
  const sourceDir = path.join(root, "cp_source");
  const sourceNestedDir = path.join(sourceDir, "nested");
  const sourceFile = path.join(sourceNestedDir, "cp_file");
  const sourceSymlinkDir = path.join(sourceDir, "symlink_dir");

  const targetDir = path.join(root, "cp_target");
  const targetFile = path.join(targetDir, "nested", "cp_file");
  const targetSymlink = path.join(targetDir, "symlink_dir", "cp_file");

  await fs.ensureDir(sourceDir);
  await fs.ensureDir(sourceNestedDir);
  await Deno.writeTextFile(sourceFile, "foo");
  await createSymlinkDir(sourceNestedDir, sourceSymlinkDir);

  await cp(sourceDir, targetDir);

  assertEquals(await Deno.readTextFile(targetFile), "foo");
  assertEquals(await Deno.readTextFile(targetSymlink), "foo");
});

Deno.test("fails when called with an empty path", async () => {
  await assertThrowsAsync(() => mkdir(""));
});

Deno.test("creates directory", async () => {
  const root = await Deno.makeTempDir({ prefix: "mkdir" });
  const testPath = path.join(root, "mkdir_test");

  await mkdir(testPath);

  assertEquals(await fs.exists(testPath), true);
});

Deno.test("creates nested directories with mkdir", async () => {
  const root = await Deno.makeTempDir({ prefix: "mkdir_nested" });
  const testPath = path.join(root, "mkdir1", "mkdir2");

  await mkdir(testPath);

  assertEquals(await fs.exists(testPath), true);
});

Deno.test("fails if mkdir with illegal chars", async () => {
  const root = await Deno.makeTempDir({ prefix: "mkdir_illegal_chars" });
  const testPath = path.join(root, "mkdir\0");

  await assertThrowsAsync(() => mkdir(testPath));
});

Deno.test("fails if mkdir with conflicting file path", async () => {
  const root = await Deno.makeTempDir({
    prefix: "mkdir_conflicting_file_path",
  });
  const testPath = path.join(root, "mkdir_file");

  await Deno.writeTextFile(testPath, "foo");

  await assertThrowsAsync(() => mkdir(testPath));
});

Deno.test("fails if mkdir with conflicting parent file path", async () => {
  const root = await Deno.makeTempDir({
    prefix: "mkdir_conflicting_parent_path",
  });
  const testPath = path.join(root, "mkdir_file", "dir");

  await Deno.writeTextFile(path.dirname(testPath), "foo");

  await assertThrowsAsync(() => mkdir(testPath));
});

Deno.test("no-ops if mkdir directory exists", async () => {
  const root = await Deno.makeTempDir({ prefix: "mkdir_exists" });
  const testPath = path.join(root, "mkdir_exists");

  await mkdir(testPath);

  assertEquals(await fs.exists(testPath), true);

  // Calling again shouldn't throw
  await mkdir(testPath);

  assertEquals(await fs.exists(testPath), true);
});

Deno.test("no-ops if mkdir with symlink directory", async () => {
  // create the following layout:
  //   real_dir
  //   real_dir/file.txt
  //   symlink_dir -> real_dir

  const root = await Deno.makeTempDir({ prefix: "mkdir_exists" });
  const rootPath = path.join(root, "mkdir_symlink_dir");
  const realDirPath = path.join(rootPath, "real_dir");
  const realFilePath = path.join(realDirPath, "file");
  const symlinkDirPath = path.join(rootPath, "symlink_dir");

  await fs.ensureDir(rootPath);
  await fs.ensureDir(realDirPath);

  await Deno.writeTextFile(realFilePath, "foo");

  await createSymlinkDir(realDirPath, symlinkDirPath);

  await mkdir(symlinkDirPath);

  // the file in the real directory should still be accessible via the symlink
  assertEquals((await Deno.lstat(symlinkDirPath)).isSymlink, true);
  assertEquals(
    (await Deno.stat(path.join(symlinkDirPath, "file"))).isFile,
    true,
  );
  assertEquals(
    await Deno.readTextFile(path.join(symlinkDirPath, "file")),
    "foo",
  );
});

Deno.test("no-ops if mkdir with parent symlink directory", async () => {
  // create the following layout:
  //   real_dir
  //   real_dir/file.txt
  //   symlink_dir -> real_dir

  const root = await Deno.makeTempDir({ prefix: "mkdir_parent_symlink_dir" });
  const rootPath = path.join(root, "mkdir_symlink_dir");
  const realDirPath = path.join(rootPath, "real_dir");
  const realFilePath = path.join(realDirPath, "file");
  const symlinkDirPath = path.join(rootPath, "symlink_dir");

  await fs.ensureDir(rootPath);
  await fs.ensureDir(realDirPath);

  await Deno.writeTextFile(realFilePath, "foo");

  await createSymlinkDir(realDirPath, symlinkDirPath);

  const subDirPath = path.join(symlinkDirPath, "sub_dir");

  await mkdir(subDirPath);

  // the subdirectory should be accessible via the real directory
  assertEquals(
    (await Deno.lstat(path.join(realDirPath, "sub_dir"))).isDirectory,
    true,
  );
});

/**
 * Creates a symlink directory on OSX/Linux, and a junction point directory on Windows.
 * A symlink directory is not created on Windows since it requires an elevated context.
 */
async function createSymlinkDir(real: string, link: string): Promise<void> {
  if (os.platform() === "win32") {
    await Deno.symlink(real, link, { type: "dir" });
  } else {
    await Deno.symlink(real, link);
  }
}
