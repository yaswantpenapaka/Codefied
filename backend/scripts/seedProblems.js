const path = require("path");
const crypto = require("crypto");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const slugify = require("slugify");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const Problem = require("../models/Problem");
const TestCase = require("../models/TestCase");
const Submission = require("../models/Submission");
const User = require("../models/User");
const { hashPassword } = require("../utils/password");

const ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ||
  `${crypto.randomBytes(10).toString("base64url")}!9K`;

const TITLES_TO_DELETE = ["Two Sum", "Valid Parentheses"];
const SLUGS_TO_DELETE = ["two-sum", "valid-parentheses"];

const PROBLEMS = [
  {
    title: "Maximum of Three Numbers",
    difficulty: "Easy",
    constraints: "1 <= each number <= 10^6",
    timeLimit: 1000,
    memoryLimit: 256,
    tags: ["math", "basics", "conditional"],
    description: `Given three integers **a**, **b**, and **c** on a single line, print the maximum of the three.

**Input**
A single line with three integers separated by spaces.

**Output**
Print one integer — the maximum value.`,
    sampleCases: [
      { input: "5 3 9", expectedOutput: "9" },
      { input: "-1 -5 -3", expectedOutput: "-1" },
    ],
    hiddenCases: [
      { input: "1 1 1", expectedOutput: "1" },
      { input: "1000000 999999 1", expectedOutput: "1000000" },
      { input: "7 7 3", expectedOutput: "7" },
      { input: "0 -1 -2", expectedOutput: "0" },
      { input: "42 41 40", expectedOutput: "42" },
    ],
  },
  {
    title: "Palindrome Check",
    difficulty: "Easy",
    constraints: "0 <= length <= 1000; only lowercase letters a-z",
    timeLimit: 1000,
    memoryLimit: 256,
    tags: ["string", "two-pointers", "palindrome"],
    description: `Given a string **s**, print **YES** if it is a palindrome, otherwise **NO**.

**Input**
A single line containing string s (may be empty).

**Output**
Print YES or NO.`,
    sampleCases: [
      { input: "racecar", expectedOutput: "YES" },
      { input: "hello", expectedOutput: "NO" },
    ],
    hiddenCases: [
      { input: "", expectedOutput: "YES" },
      { input: "a", expectedOutput: "YES" },
      { input: "ab", expectedOutput: "NO" },
      { input: "abba", expectedOutput: "YES" },
      { input: "abcba", expectedOutput: "YES" },
    ],
  },
  {
    title: "Sum of Array",
    difficulty: "Easy",
    constraints: "1 <= n <= 1000; each element between -10^6 and 10^6",
    timeLimit: 1000,
    memoryLimit: 256,
    tags: ["array", "math", "iteration"],
    description: `Given an array of **n** integers, print the sum of all elements.

**Input**
- First line: integer n
- Second line: n integers separated by spaces

**Output**
Print one integer — the sum.`,
    sampleCases: [
      { input: "5\n1 2 3 4 5", expectedOutput: "15" },
      { input: "3\n-1 2 -3", expectedOutput: "-2" },
    ],
    hiddenCases: [
      { input: "1\n10", expectedOutput: "10" },
      { input: "4\n0 0 0 0", expectedOutput: "0" },
      { input: "3\n-1000000 -1000000 -1000000", expectedOutput: "-3000000" },
      { input: "5\n1 -1 1 -1 1", expectedOutput: "1" },
      { input: "6\n100 200 300 400 500 600", expectedOutput: "2100" },
    ],
  },
  {
    title: "Count Vowels",
    difficulty: "Easy",
    constraints: "0 <= length <= 1000",
    timeLimit: 1000,
    memoryLimit: 256,
    tags: ["string", "counting"],
    description: `Count vowels in a string. Vowels are: a, e, i, o, u (lowercase only).

**Input**
A single line string (may be empty).

**Output**
Print the vowel count.`,
    sampleCases: [
      { input: "codefied", expectedOutput: "4" },
      { input: "rhythm", expectedOutput: "0" },
    ],
    hiddenCases: [
      { input: "", expectedOutput: "0" },
      { input: "aeiou", expectedOutput: "5" },
      { input: "bcdfg", expectedOutput: "0" },
      { input: "aabbcc", expectedOutput: "2" },
      { input: "uuuuu", expectedOutput: "5" },
    ],
  },
  {
    title: "FizzBuzz Count",
    difficulty: "Medium",
    constraints: "1 <= n <= 10^5",
    timeLimit: 2000,
    memoryLimit: 256,
    tags: ["math", "implementation", "fizzbuzz"],
    description: `For integers from 1 to **n**, count how many numbers are divisible by 3 or 5.

**Input**
A single integer n.

**Output**
Print the count.`,
    sampleCases: [
      { input: "15", expectedOutput: "8" },
      { input: "1", expectedOutput: "0" },
    ],
    hiddenCases: [
      { input: "3", expectedOutput: "1" },
      { input: "5", expectedOutput: "2" },
      { input: "15", expectedOutput: "8" },
      { input: "30", expectedOutput: "14" },
      { input: "100000", expectedOutput: "46667" },
    ],
  },
  {
    title: "Second Largest Element",
    difficulty: "Medium",
    constraints: "2 <= n <= 1000; each element between -10^6 and 10^6; answer always exists",
    timeLimit: 1000,
    memoryLimit: 256,
    tags: ["array", "sorting"],
    description: `Given an array of **n** integers, print the **second largest** distinct value.

**Input**
- First line: integer n
- Second line: n integers separated by spaces

**Output**
Print the second largest value.`,
    sampleCases: [
      { input: "5\n3 1 4 1 5", expectedOutput: "4" },
      { input: "3\n10 10 5", expectedOutput: "5" },
    ],
    hiddenCases: [
      { input: "2\n1 2", expectedOutput: "1" },
      { input: "4\n-5 -1 -3 -2", expectedOutput: "-2" },
      { input: "5\n7 7 7 6 6", expectedOutput: "6" },
      { input: "6\n100 99 98 97 96 95", expectedOutput: "99" },
      { input: "3\n-1000000 -999999 -1000000", expectedOutput: "-1000000" },
    ],
  },
  {
    title: "Longest Word Length",
    difficulty: "Medium",
    constraints: "1 <= number of words <= 100; each word length <= 50; lowercase letters only",
    timeLimit: 1000,
    memoryLimit: 256,
    tags: ["string", "split"],
    description: `Given a sentence of lowercase words separated by single spaces, print the length of the longest word.

**Input**
A single line sentence.

**Output**
Print one integer — max word length.`,
    sampleCases: [
      { input: "code fied online judge", expectedOutput: "6" },
      { input: "a bb ccc", expectedOutput: "3" },
    ],
    hiddenCases: [
      { input: "x", expectedOutput: "1" },
      { input: "same same same", expectedOutput: "4" },
      { input: "abcdefghijklmnopqrstuvwxyz abcdefghijklmnopqrstuvwxy", expectedOutput: "26" },
      { input: "one two three four five", expectedOutput: "5" },
      { input: "a ab abc abcd abcde", expectedOutput: "5" },
    ],
  },
  {
    title: "Maximum Subarray Sum",
    difficulty: "Hard",
    constraints: "1 <= n <= 10^4; each element between -10^6 and 10^6",
    timeLimit: 2000,
    memoryLimit: 256,
    tags: ["array", "dp", "kadane"],
    description: `Given an array of **n** integers, print the maximum sum of any contiguous subarray (Kadane's algorithm).

**Input**
- First line: integer n
- Second line: n integers separated by spaces

**Output**
Print the maximum subarray sum.`,
    sampleCases: [
      { input: "5\n-2 1 -3 4 -1", expectedOutput: "4" },
      { input: "3\n1 2 3", expectedOutput: "6" },
    ],
    hiddenCases: [
      { input: "1\n-5", expectedOutput: "-5" },
      { input: "4\n-1 -2 -3 -4", expectedOutput: "-1" },
      { input: "5\n5 -1 5 -1 5", expectedOutput: "13" },
      { input: "6\n-1000000 1000000 -1000000 1000000 -1000000 1000000", expectedOutput: "1000000" },
      { input: "8\n1 -3 2 1 -1 2 -2 3", expectedOutput: "4" },
    ],
  },
  {
    title: "Prime Count in Range",
    difficulty: "Hard",
    constraints: "1 <= L <= R <= 10^5",
    timeLimit: 3000,
    memoryLimit: 256,
    tags: ["math", "primes", "sieve"],
    description: `Count how many prime numbers exist in the inclusive range **[L, R]**.

**Input**
A single line with two integers L and R separated by a space.

**Output**
Print the prime count.`,
    sampleCases: [
      { input: "1 10", expectedOutput: "4" },
      { input: "10 20", expectedOutput: "4" },
    ],
    hiddenCases: [
      { input: "2 2", expectedOutput: "1" },
      { input: "4 4", expectedOutput: "0" },
      { input: "1 1", expectedOutput: "0" },
      { input: "1 100", expectedOutput: "25" },
      { input: "99990 100000", expectedOutput: "1" },
    ],
  },
  {
    title: "Coin Change Minimum",
    difficulty: "Hard",
    constraints: "1 <= coin types <= 12; 0 <= amount <= 10^4; each coin value >= 1",
    timeLimit: 2000,
    memoryLimit: 256,
    tags: ["dp", "coin-change"],
    description: `Given coin denominations and a target amount, print the **minimum number of coins** needed (unlimited supply of each coin). Print **-1** if impossible.

**Input**
- First line: integer \`k\` (number of coin types)
- Second line: \`k\` coin values separated by spaces
- Third line: target amount

**Output**
Print one integer.`,
    sampleCases: [
      { input: "3\n1 2 5\n11", expectedOutput: "3" },
      { input: "1\n2\n3", expectedOutput: "-1" },
    ],
    hiddenCases: [
      { input: "1\n1\n0", expectedOutput: "0" },
      { input: "2\n1 3\n4", expectedOutput: "2" },
      { input: "3\n2 5 10\n27", expectedOutput: "4" },
      { input: "1\n5\n11", expectedOutput: "-1" },
      { input: "4\n1 2 5 10\n18", expectedOutput: "4" },
    ],
  },
  {
    title: "Longest Increasing Subsequence",
    difficulty: "Hard",
    constraints: "1 <= n <= 5000; each element between -10^6 and 10^6",
    timeLimit: 2000,
    memoryLimit: 256,
    tags: ["dp", "binary-search", "lis"],
    description: `Given an array of **n** integers, print the length of the **longest strictly increasing subsequence**.

**Input**
- First line: integer \`n\`
- Second line: \`n\` integers separated by spaces

**Output**
Print the LIS length.`,
    sampleCases: [
      { input: "6\n10 9 2 5 3 7", expectedOutput: "3" },
      { input: "7\n1 3 5 2 4 6 8", expectedOutput: "5" },
    ],
    hiddenCases: [
      { input: "1\n42", expectedOutput: "1" },
      { input: "5\n5 4 3 2 1", expectedOutput: "1" },
      { input: "5\n1 2 3 4 5", expectedOutput: "5" },
      { input: "8\n3 10 2 1 20 5 8 6", expectedOutput: "4" },
      { input: "6\n0 0 0 0 0 0", expectedOutput: "1" },
    ],
  },
  {
    title: "0-1 Knapsack Maximum Value",
    difficulty: "Hard",
    constraints: "1 <= n <= 100; 1 <= capacity <= 10^4; weights and values <= 10^4",
    timeLimit: 2000,
    memoryLimit: 256,
    tags: ["dp", "knapsack"],
    description: `Given \`n\` items (weight and value) and knapsack capacity \`W\`, print the **maximum total value** you can carry (each item at most once).

**Input**
- First line: \`n W\`
- Next \`n\` lines: \`weight value\` for each item

**Output**
Print maximum achievable value.`,
    sampleCases: [
      { input: "3 4\n1 15\n3 20\n4 30", expectedOutput: "35" },
      { input: "2 5\n2 3\n3 4", expectedOutput: "7" },
    ],
    hiddenCases: [
      { input: "1 10\n5 100", expectedOutput: "100" },
      { input: "1 4\n5 100", expectedOutput: "0" },
      { input: "4 8\n2 3\n3 4\n4 5\n5 6", expectedOutput: "10" },
      { input: "3 10\n4 40\n5 50\n6 60", expectedOutput: "100" },
      { input: "5 12\n1 1\n2 2\n3 3\n4 4\n5 5", expectedOutput: "12" },
    ],
  },
  {
    title: "Connected Components Count",
    difficulty: "Hard",
    constraints: "1 <= n <= 1000; 0 <= m <= 5000; graph is undirected",
    timeLimit: 2000,
    memoryLimit: 256,
    tags: ["graph", "dfs", "union-find"],
    description: `Given an undirected graph with \`n\` nodes (0-indexed) and \`m\` edges, print the number of **connected components**.

**Input**
- First line: \`n m\`
- Next \`m\` lines: \`u v\` (each edge)

**Output**
Print component count.`,
    sampleCases: [
      { input: "4 2\n0 1\n2 3", expectedOutput: "2" },
      { input: "3 2\n0 1\n1 2", expectedOutput: "1" },
    ],
    hiddenCases: [
      { input: "5 0", expectedOutput: "5" },
      { input: "1 0", expectedOutput: "1" },
      { input: "6 3\n0 1\n2 3\n4 5", expectedOutput: "3" },
      { input: "7 6\n0 1\n1 2\n2 0\n3 4\n4 5\n5 3", expectedOutput: "2" },
      { input: "10 9\n0 1\n1 2\n2 3\n3 4\n4 5\n5 6\n6 7\n7 8\n8 9", expectedOutput: "1" },
    ],
  },
  {
    title: "Grid Shortest Path",
    difficulty: "Hard",
    constraints: "1 <= rows, cols <= 100; grid cells are 0 (open) or 1 (blocked)",
    timeLimit: 2000,
    memoryLimit: 256,
    tags: ["graph", "bfs", "grid"],
    description: `In a 2D grid, find the **shortest path length** from top-left \`(0,0)\` to bottom-right \`(n-1,m-1)\`. Move up/down/left/right only through cells with value **0**. Print **-1** if unreachable.

**Input**
- First line: \`n m\`
- Next \`n\` lines: \`m\` integers each (0 or 1)
- Last line: not needed; always start (0,0), end (n-1,m-1)

**Output**
Print shortest steps count.`,
    sampleCases: [
      { input: "3 3\n0 0 0\n0 1 0\n0 0 0", expectedOutput: "4" },
      { input: "2 2\n0 1\n1 0", expectedOutput: "-1" },
    ],
    hiddenCases: [
      { input: "1 1\n0", expectedOutput: "0" },
      { input: "2 2\n0 0\n0 0", expectedOutput: "2" },
      { input: "3 3\n0 0 0\n0 0 0\n0 0 0", expectedOutput: "4" },
      { input: "4 4\n0 0 0 0\n1 1 1 0\n0 0 0 0\n0 1 1 0", expectedOutput: "6" },
      { input: "3 3\n0 1 0\n0 1 0\n0 1 0", expectedOutput: "-1" },
    ],
  },
];

const deleteLegacyProblems = async () => {
  const legacy = await Problem.find({
    $or: [
      { title: { $in: TITLES_TO_DELETE } },
      { slug: { $in: SLUGS_TO_DELETE } },
      { title: { $regex: /^two sum$/i } },
      { title: { $regex: /^valid parentheses$/i } },
    ],
  });

  if (!legacy.length) {
    console.log("No legacy problems found to delete (Two Sum / Valid Parentheses).");
    return;
  }

  const ids = legacy.map((p) => p._id);
  const deletedCases = await TestCase.deleteMany({ problemId: { $in: ids } });
  const deletedSubs = await Submission.deleteMany({ problemId: { $in: ids } });
  const deletedProblems = await Problem.deleteMany({ _id: { $in: ids } });

  console.log(
    `Deleted ${deletedProblems.deletedCount} problem(s), ${deletedCases.deletedCount} test case(s), ${deletedSubs.deletedCount} submission(s).`,
  );
  legacy.forEach((p) => console.log(`  - removed: ${p.title} (${p.slug})`));
};

const upsertProblem = async (data) => {
  const slug = slugify(data.title, { lower: true, strict: true });
  const existing = await Problem.findOne({ slug });

  if (existing) {
    await TestCase.deleteMany({ problemId: existing._id });
    await Problem.deleteOne({ _id: existing._id });
    console.log(`Replaced existing problem: ${data.title}`);
  }

  const sampleCases = data.sampleCases.filter(
    (c) => c.input.trim() || c.expectedOutput.trim(),
  );

  const problem = await Problem.create({
    title: data.title,
    slug,
    description: data.description,
    difficulty: data.difficulty,
    constraints: data.constraints,
    timeLimit: data.timeLimit,
    memoryLimit: data.memoryLimit,
    tags: data.tags,
    sampleCases,
    sampleInput: sampleCases[0]?.input || "",
    sampleOutput: sampleCases[0]?.expectedOutput || "",
    starterCode: "",
  });

  for (let i = 0; i < data.hiddenCases.length; i += 1) {
    const hidden = data.hiddenCases[i];
    await TestCase.create({
      problemId: problem._id,
      input: hidden.input,
      expectedOutput: hidden.expectedOutput,
      isHidden: true,
      order: i + 1,
    });
  }

  return problem;
};

const updateAdminPassword = async () => {
  const admins = await User.find({ role: "admin" });
  if (!admins.length) {
    console.log("\nNo admin user found — password not changed.");
    console.log("Promote a user in MongoDB: db.users.updateOne({handle:'...'},{$set:{role:'admin'}})");
    return;
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  for (const admin of admins) {
    await User.updateOne(
      { _id: admin._id },
      {
        $set: { passwordHash },
        $inc: { tokenVersion: 1 },
      },
    );
    console.log(`\nUpdated admin password: ${admin.handle} (${admin.email})`);
  }

  console.log("\n========================================");
  console.log("  ADMIN LOGIN — SAVE THIS PASSWORD");
  console.log("========================================");
  for (const admin of admins) {
    console.log(`  Handle/Email: ${admin.handle} / ${admin.email}`);
  }
  console.log(`  New Password: ${ADMIN_PASSWORD}`);
  console.log("========================================\n");
};

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  await deleteLegacyProblems();

  console.log(`\nSeeding ${PROBLEMS.length} problems...`);
  for (const problemData of PROBLEMS) {
    const problem = await upsertProblem(problemData);
    console.log(
      `  + ${problem.title} [${problem.difficulty}] — ${problemData.sampleCases.length} sample, ${problemData.hiddenCases.length} hidden`,
    );
  }

  const difficultyMap = { easy: "Easy", medium: "Medium", hard: "Hard" };
  for (const [lower, capitalized] of Object.entries(difficultyMap)) {
    await Problem.updateMany(
      { difficulty: lower },
      { $set: { difficulty: capitalized } },
    );
  }

  const counts = await Problem.aggregate([
    { $group: { _id: "$difficulty", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.log("\nProblem counts by difficulty:");
  counts.forEach((c) => console.log(`  ${c._id}: ${c.count}`));

  await updateAdminPassword();

  await mongoose.disconnect();
  console.log("\nDone.");
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});