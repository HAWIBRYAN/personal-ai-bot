exports.handler = async function(event) {
  console.log("Function triggered"); // will show in Netlify logs
  return {
    statusCode: 200,
    body: JSON.stringify({ reply: "Hawi AI is alive!" })
  };
};
