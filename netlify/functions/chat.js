const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async function(event) {
  try {
    console.log("Function triggered");
    console.log("Event body:", event.body);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing!");
    }

    if (!event.body) {
      throw new Error("No body in request!");
    }

    const { message } = JSON.parse(event.body);

    if (!message) {
      throw new Error("No message provided in request!");
    }

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }]
    });

    console.log("OpenAI response:", response.choices[0].message.content);

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: response.choices[0].message.content })
    };

  } catch (err) {
    console.error("Error in function:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
