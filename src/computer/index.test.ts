/**
 * Test for volume initialization with home directory contents.
 *
 * Run with: npx tsx src/computer/index.test.ts
 *
 * Prerequisites:
 * - Docker must be running
 * - agent-computer:formal-math image must be built
 */

import { Computer } from "./index";

const TEST_COMPUTER_ID = "test-volume-init-" + Date.now();
const TEST_IMAGE = "agent-computer:formal-math";

async function runTest() {
  console.log("=== Volume Initialization Test ===\n");
  console.log(`Computer ID: ${TEST_COMPUTER_ID}`);
  console.log(`Image: ${TEST_IMAGE}\n`);

  // Create a new computer (this should initialize the volume)
  console.log("1. Creating computer with new volume...");
  const createRes = await Computer.create(TEST_COMPUTER_ID, TEST_IMAGE);
  if (createRes.isErr()) {
    console.error("❌ Failed to create computer:", createRes.error.message);
    process.exit(1);
  }
  const computer = createRes.value;
  console.log("✓ Computer created\n");

  let allPassed = true;

  // Test 1: Check .bashrc exists
  console.log("2. Checking .bashrc exists...");
  const bashrcRes = await computer.execute("test -f /home/agent/.bashrc && echo 'exists'");
  if (bashrcRes.isOk() && bashrcRes.value.stdout.includes("exists")) {
    console.log("✓ .bashrc exists\n");
  } else {
    console.error("❌ .bashrc not found");
    allPassed = false;
  }

  // Test 2: Check .bashrc has expected content
  console.log("3. Checking .bashrc content...");
  const bashrcContentRes = await computer.execute("cat /home/agent/.bashrc");
  if (bashrcContentRes.isOk()) {
    const content = bashrcContentRes.value.stdout;
    const hasPath = content.includes("PATH=");
    const hasElanHome = content.includes("ELAN_HOME");
    if (hasPath && hasElanHome) {
      console.log("✓ .bashrc has PATH and ELAN_HOME\n");
    } else {
      console.error("❌ .bashrc missing expected content");
      console.log("  Has PATH:", hasPath);
      console.log("  Has ELAN_HOME:", hasElanHome);
      allPassed = false;
    }
  } else {
    console.error("❌ Failed to read .bashrc:", bashrcContentRes.error.message);
    allPassed = false;
  }

  // Test 3: Check .venv exists
  console.log("4. Checking .venv exists...");
  const venvRes = await computer.execute("test -d /home/agent/.venv && echo 'exists'");
  if (venvRes.isOk() && venvRes.value.stdout.includes("exists")) {
    console.log("✓ .venv exists\n");
  } else {
    console.error("❌ .venv not found");
    allPassed = false;
  }

  // Test 4: Check Python works in venv
  console.log("5. Checking Python venv works...");
  const pythonRes = await computer.execute("/home/agent/.venv/bin/python --version");
  if (pythonRes.isOk() && pythonRes.value.exitCode === 0) {
    console.log("✓ Python works:", pythonRes.value.stdout.trim(), "\n");
  } else {
    console.error("❌ Python venv not working");
    allPassed = false;
  }

  // Test 5: Check /opt/lean permissions
  console.log("6. Checking /opt/lean permissions...");
  const permRes = await computer.execute("ls -la /opt/lean/.elan/toolchains/ 2>&1 | head -5");
  if (permRes.isOk()) {
    console.log("   /opt/lean/.elan/toolchains/ listing:");
    console.log("  ", permRes.value.stdout.split("\n").slice(0, 3).join("\n   "));
    if (permRes.value.stderr.includes("Permission denied")) {
      console.error("❌ Permission denied - image needs rebuild with permissions fix\n");
      allPassed = false;
    } else {
      console.log("✓ Permissions look ok\n");
    }
  }

  // Test 6: Check lake command is available (formal-math specific)
  // Note: lake/lean need ELAN_HOME to find toolchains
  const leanEnv = { ELAN_HOME: "/opt/lean/.elan" };

  console.log("7. Checking lake command (formal-math profile)...");
  const lakeRes = await computer.execute("lake --version", { env: leanEnv });
  if (lakeRes.isOk() && lakeRes.value.exitCode === 0) {
    console.log("✓ lake works:", lakeRes.value.stdout.trim(), "\n");
  } else {
    console.error("❌ lake not working");
    if (lakeRes.isOk()) {
      console.log("  stdout:", lakeRes.value.stdout);
      console.log("  stderr:", lakeRes.value.stderr);
    } else {
      console.log("  error:", lakeRes.error.message);
    }
    allPassed = false;
  }

  // Test 7: Check lean command is available
  console.log("8. Checking lean command...");
  const leanRes = await computer.execute("lean --version", { env: leanEnv });
  if (leanRes.isOk() && leanRes.value.exitCode === 0) {
    console.log("✓ lean works:", leanRes.value.stdout.trim(), "\n");
  } else {
    console.error("❌ lean not working");
    allPassed = false;
  }

  // Test 8: Check /opt/lean/Math exists
  console.log("9. Checking /opt/lean/Math project...");
  const mathRes = await computer.execute("test -d /opt/lean/Math && echo 'exists'");
  if (mathRes.isOk() && mathRes.value.stdout.includes("exists")) {
    console.log("✓ /opt/lean/Math exists\n");
  } else {
    console.error("❌ /opt/lean/Math not found");
    allPassed = false;
  }

  // Cleanup
  console.log("10. Cleaning up...");
  const terminateRes = await computer.terminate();
  if (terminateRes.isOk()) {
    console.log("✓ Computer terminated\n");
  } else {
    console.error("⚠ Failed to terminate:", terminateRes.error.message);
  }

  // Summary
  console.log("=== Test Summary ===");
  if (allPassed) {
    console.log("✅ All tests passed!");
    process.exit(0);
  } else {
    console.log("❌ Some tests failed");
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error("Test crashed:", err);
  process.exit(1);
});
