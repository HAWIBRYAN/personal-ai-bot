const { OpenAI } = require("openai");
const cosineSimilarity = require("cosine-similarity");
const profile = require("../../data/profile.json");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Convert profile object into searchable text chunks
function createChunks(profile) {
  const chunks = [];

  chunks.push(`Name: ${profile.name}`);
  chunks.push(`Education: ${profile.education}`);

  profile.projects.forEach(p => {
    chunks.push(`Project: ${p.name} - ${p.description}`);
  });

  chunks.push(`Skills: ${profile.skills.join(", ")}`);
  chunks.push(`Interests: ${profile.interests.join(", ")}`);

  return chunks;
}

exports.handler = async function (event) {
  try {
    const { message } = JSON.parse(event.body);

    const chunks = createChunks(profile);

    // 1️⃣ Embed all chunks
    const chunkEmbeddings = await Promise.all(
      chunks.map(chunk =>
        openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk
        })
      )
    );

    // 2️⃣ Embed user query
    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message
    });

    const queryVector = queryEmbedding.data[0].embedding;

    // 3️⃣ Compare similarity
    const similarities = chunkEmbeddings.map((embedding, index) => {
      return {
        text: chunks[index],
        score: cosineSimilarity(
          queryVector,
          embedding.data[0].embedding
        )
      };
    });

    // 4️⃣ Sort by similarity
    similarities.sort((a, b) => b.score - a.score);

    // 5️⃣ Take top 3 most relevant
    const relevantContext = similarities
      .slice(0, 3)
      .map(s => s.text)
      .join("\n");

    // 6️⃣ Generate response
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a personal AI assistant. 
Answer using ONLY this context:

${relevantContext}`
        },
        {
          role: "user",
          content: message
        }
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
