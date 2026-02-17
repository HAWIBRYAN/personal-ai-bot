const { OpenAI } = require("openai");
const profile = require("../../data/profile.json");

exports.handler = async function (event) {
  try {
    const { message } = JSON.parse(event.body);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a personal assistant AI for ${profile.name}.
Use ONLY the following information to answer questions:

${JSON.stringify(profile, null, 2)}

If a question is outside this data, politely say you don’t have that information.`
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
