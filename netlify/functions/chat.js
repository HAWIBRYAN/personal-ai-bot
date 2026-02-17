kkconst { OpenAI } = require("openai");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Your profile knowledge base
const knowledgeBase = [
  {
    topic: "projects",
    content: "I build AI bots, web apps using React and Node.js, and automation tools. My GitHub contains personal AI projects and portfolio websites."
  },
  {
    topic: "skills",
    content: "My main skills include JavaScript, React, Node.js, Python, Git, APIs, and AI integrations."
  },
  {
    topic: "education",
    content: "I studied IT at JKUAT where I focused on software development and emerging technologies."
  },
  {
    topic: "hobbies",
    content: "I enjoy coding, experimenting with AI, gaming, and learning new technologies."
  }
];

// Simple keyword matching
function findBestMatch(message) {
  const lowerMessage = message.toLowerCase();
  let bestMatch = null;
  let score = 0;

  knowledgeBase.forEach(entry => {
    let currentScore = 0;
    entry.topic.split(" ").forEach(word => {
      if (lowerMessage.includes(word)) currentScore++;
    });
    if (lowerMessage.includes(entry.topic)) currentScore += 2;
    if (currentScore > score) {
      score = currentScore;
      bestMatch = entry;
    }
  });

  return score > 0 ? bestMatch.content : null;
}

// Fetch latest GitHub repos using native fetch
async function fetchGitHubRepos(username, token) {
  const res = await fetch(`https://api.github.com/users/${username}/repos`, {
    headers: token ? { Authorization: `token ${token}` } : {}
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();

  return data
    .sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0,5)
    .map(repo => `• ${repo.name} (${repo.language || "Unknown"})`)
    .join("\n");
}

// Netlify function handler
exports.handler = async function(event) {
  try {
    if (!event.body) throw new Error("No request body");
    const { message } = JSON.parse(event.body);
    if (!message) throw new Error("No message provided");

    const lowerMessage = message.toLowerCase();

    // 1️⃣ Check knowledge base first
    const matched = findBestMatch(message);
    if (matched) {
      return { statusCode: 200, body: JSON.stringify({ reply: matched }) };
    }

    // 2️⃣ Check for GitHub projects request
    if (lowerMessage.includes("project")) {
      try {
        const username = "HAWIBRYAN"; // replace with your GitHub username
        const token = process.env.GITHUB_TOKEN; // optional
        const repos = await fetchGitHubRepos(username, token);
        return {
          statusCode: 200,
          body: JSON.stringify({ reply: `Here are my latest GitHub projects:\n${repos}` })
        };
      } catch (err) {
        console.error("GitHub fetch error:", err);
        return {
          statusCode: 200,
          body: JSON.stringify({ reply: "Couldn't reach GitHub 😅 Check my profile directly!" })
        };
      }
    }

    // 3️⃣ Otherwise call OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return { statusCode: 200, body: JSON.stringify({ reply: "AI not enabled 😅" }) };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }]
    });

    const reply = response.choices[0].message.content;

    return { statusCode: 200, body: JSON.stringify({ reply }) };

  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: "Something went wrong 😅 Please try again later." })
    };
  }
};

