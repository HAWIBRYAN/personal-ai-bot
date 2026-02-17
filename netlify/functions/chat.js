const { OpenAI } = require("openai");
const fetch = require("node-fetch");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

exports.handler = async function(event) {
  try {
    if (!event.body) throw new Error("No request body");
    const { message } = JSON.parse(event.body);
    if (!message) throw new Error("No message provided");

    // 🧠 Try semantic match first
    const matched = findBestMatch(message);
    if (matched) {
      return {
        statusCode: 200,
        body: JSON.stringify({ reply: matched })
      };
    }

    // 🤖 Only call OpenAI if no match
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          reply: "I don't have AI enabled right now, but feel free to ask about my skills, projects, or education!"
        })
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }]
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: response.choices[0].message.content
      })
    };

  } catch (err) {
    console.error(err);

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: "Something went wrong 😅 Please try again later."
      })
    };
  }
};
