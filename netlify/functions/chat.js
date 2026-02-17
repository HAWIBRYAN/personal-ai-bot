const { OpenAI } = require("openai");
const { Octokit } = require("@octokit/rest");
const cosineSimilarity = require("cosine-similarity");

// Your static profile info
const profile = {
  name: "Hawi Bryan",
  education: "Final year IT student at JKUAT",
  skills: ["React", "Flutter", "Node.js", "Django", "MySQL", "Supabase"],
  interests: ["AI systems", "UI/UX", "automation"]
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Helper: fetch GitHub repos dynamically
async function fetchRepos(username) {
  const repos = await octokit.repos.listForUser({
    username,
    per_page: 100
  });

  // Get name + description
  return repos.data.map(repo => ({
    name: repo.name,
    description: repo.description || "No description provided",
    url: repo.html_url
  }));
}

// Convert profile + GitHub repos into chunks
async function createChunks(username) {
  const chunks = [];

  // Profile
  chunks.push(`Name: ${profile.name}`);
  chunks.push(`Education: ${profile.education}`);
  chunks.push(`Skills: ${profile.skills.join(", ")}`);
  chunks.push(`Interests: ${profile.interests.join(", ")}`);

  // GitHub repos
  const repos = await fetchRepos(username);
  repos.forEach(r => {
    chunks.push(`Project: ${r.name} - ${r.description} - URL: ${r.url}`);
  });

  return chunks;
}

exports.handler = async function (event) {
  try {
    const { message } = JSON.parse(event.body);

    const chunks = await createChunks("HAWIBRYAN"); // replace with your GitHub username

    // Embed all chunks
    const chunkEmbeddings = await Promise.all(
      chunks.map(chunk =>
        openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk
        })
      )
    );

    // Embed user query
    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message
    });

    const queryVector = queryEmbedding.data[0].embedding;

    // Compare similarity
    const similarities = chunkEmbeddings.map((embedding, index) => ({
      text: chunks[index],
      score: cosineSimilarity(queryVector, embedding.data[0].embedding)
    }));

    // Top 3 matches
    const relevantContext = similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.text)
      .join("\n");

    // Generate response
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a personal AI assistant. Use ONLY the context provided to answer: \n${relevantContext}`
        },
        { role: "user", content: message }
      ]
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: response.choices[0].message.content
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
