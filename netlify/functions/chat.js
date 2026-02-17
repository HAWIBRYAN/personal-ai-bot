const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async function(event) {
  try {
    console.log("Request body:", event.body);

    const { message } = JSON.parse(event.body);

    if (!message) throw new Error("No message provided");

    // Test OpenAI response
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
    console.error(err); // logs show in Netlify dashboard
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
