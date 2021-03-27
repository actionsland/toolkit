import { assertEquals, assertThrowsAsync, fs, path, os } from "./deps.ts";
import { cp } from "./mod.ts";

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

  await cp(sourceDir, targetDir, { recursive: true });

  assertEquals(await Deno.readTextFile(targetFile), "foo");
});

Deno.test("copies directory into non-existing destination with recursive", async () => {
  const root = await Deno.makeTempDir({ prefix: "cp_to_non_existing_with_recursive_flag" });
  const sourceDir = path.join(root, "cp_source_dir");
  const sourceFile = path.join(sourceDir, "cp_file");
  const targetDir = path.join(root, "cp_target_dir");
  const targetFile = path.join(targetDir, "cp_file");

  await fs.ensureDir(sourceDir);
  await Deno.writeTextFile(sourceFile, "foo");

  await cp(sourceDir, targetDir, { recursive: true });

  assertEquals(await Deno.readTextFile(targetFile), "foo");
});

Deno.test("tries to copy directory without recursive", async () => {
  const root = await Deno.makeTempDir({ prefix: "cp_without_recursive_flag" });
  const sourceDir = path.join(root, "cp_source_dir");
  const sourceFile = path.join(sourceDir, "cp_file");
  const targetDir = path.join(root, "cp_target_dir");
  const targetFile = path.join(targetDir, "cp_file");

  await fs.ensureDir(sourceDir);
  await Deno.writeTextFile(sourceFile, "foo");

  await assertThrowsAsync(() => cp(sourceFile, targetFile));
  // TODO: assert file doesn't exist
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
 
  await cp(sourceDir, targetDir, { recursive: true });

  assertEquals(await Deno.readTextFile(targetFile), "foo");
  assertEquals(await Deno.readTextFile(targetSymlink), "foo");
});

/**
 * Creates a symlink directory on OSX/Linux, and a junction point directory on Windows.
 * A symlink directory is not created on Windows since it requires an elevated context.
 */
async function createSymlinkDir(real: string, link: string): Promise<void> {
  if (os.platform() === 'win32') {
    await Deno.symlink(real, link, {type: 'dir'})
  } else {
    await Deno.symlink(real, link)
  }
}
